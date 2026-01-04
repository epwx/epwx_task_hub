import axios from 'axios';

class TwitterVerificationService {
  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN;
    this.baseURL = 'https://api.twitter.com/2';
    this.likeCache = new Map(); // Cache verification results for 5 minutes
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  // Clear cache for a specific user and tweet
  clearCache(userId, tweetId) {
    const cacheKey = `${userId}:${tweetId}`;
    this.likeCache.delete(cacheKey);
    console.log('[Cache] Cleared cache for:', cacheKey);
  }

  // Clear all cache for a user
  clearUserCache(userId) {
    for (const [key] of this.likeCache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.likeCache.delete(key);
      }
    }
    console.log('[Cache] Cleared all cache for user:', userId);
  }

  // Extract tweet ID from various Twitter URL formats
  extractTweetId(url) {
    const patterns = [
      /twitter\.com\/[^/]+\/status\/(\d+)/,
      /x\.com\/[^/]+\/status\/(\d+)/,
      /\/status\/(\d+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  // Extract username from Twitter URL
  extractUsername(url) {
    const patterns = [
      /twitter\.com\/([^/]+)/,
      /x\.com\/([^/]+)/,
      /@([a-zA-Z0-9_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1].replace('@', '');
    }
    return null;
  }

  // Get Twitter user ID from username
  async getUserId(username) {
    try {
      const response = await axios.get(
        `${this.baseURL}/users/by/username/${username}`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          }
        }
      );
      return response.data.data.id;
    } catch (error) {
      console.error('Error fetching user ID:', error.response?.data);
      throw new Error('Could not find Twitter user');
    }
  }

  // Verify if user liked a tweet
  async verifyLike(username, tweetUrl, userAccessToken = null, userId = null) {
    let cacheKey;
    try {
      const tweetId = this.extractTweetId(tweetUrl);
      if (!tweetId) {
        console.error('[verifyLike] Could not extract tweet ID from URL:', tweetUrl);
        return { verified: false, message: 'Invalid tweet URL' };
      }

      console.log('[verifyLike] Extracted tweet ID:', tweetId);
      console.log('[verifyLike] Tweet URL:', tweetUrl);

      // Use provided userId or fetch it
      const userIdToUse = userId || await this.getUserId(username);
      console.log('[verifyLike] User ID:', userIdToUse);

      // Check cache first
      cacheKey = `${userIdToUse}:${tweetId}`;
      const cached = this.likeCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < this.CACHE_TTL)) {
        console.log('[verifyLike] Using cached result:', cached.verified);
        return {
          verified: cached.verified,
          message: cached.verified ? 'Like verified successfully (cached)' : 'Like not found (cached).'
        };
      }

      // Use user's access token to check their liked tweets
      const authHeader = userAccessToken 
        ? `Bearer ${userAccessToken}`
        : `Bearer ${this.bearerToken}`;

      console.log('[verifyLike] Using user access token:', !!userAccessToken);

      // Get user's liked tweets instead of tweet's liking users
      const response = await axios.get(
        `${this.baseURL}/users/${userIdToUse}/liked_tweets`,
        {
          headers: {
            'Authorization': authHeader
          },
          params: {
            max_results: 100, // Check last 100 liked tweets
            'tweet.fields': 'id'
          }
        }
      );

      console.log('[verifyLike] Liked tweets count:', response.data.data?.length || 0);
      console.log('[verifyLike] Looking for tweet ID:', tweetId);
      
      // Log first few tweet IDs for debugging
      if (response.data.data) {
        console.log('[verifyLike] First 5 liked tweet IDs:', 
          response.data.data.slice(0, 5).map(t => t.id)
        );
      }

      const liked = response.data.data?.some(tweet => tweet.id === tweetId);
      
      console.log('[verifyLike] Like found:', liked);

      // Cache the result (only cache successful checks)
      this.likeCache.set(cacheKey, {
        verified: liked,
        timestamp: Date.now()
      });

      return {
        verified: liked,
        message: liked ? 'Like verified successfully' : 'Like not found. Please like the tweet and try again.'
      };
    } catch (error) {
      console.error('Like verification error:', error.response?.data);
      // Handle unauthorized - token expired - DON'T CACHE THIS
      if (error.response?.status === 401) {
        console.error('[verifyLike] Token expired (401)');
        if (cacheKey) this.likeCache.delete(cacheKey); // Clear any cached result
        return {
          verified: false,
          needsTokenRefresh: true,
          message: 'Twitter authentication expired. Please reconnect your account.'
        };
      }
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['x-rate-limit-reset'];
        console.error('[verifyLike] Rate limit hit. Reset at:', retryAfter);
        return {
          verified: false,
          message: 'Twitter API rate limit reached. Please wait a moment and try again.'
        };
      }
      return {
        verified: false,
        message: 'Verification failed. Please ensure you liked the tweet.'
      };
    }
  }

  // Verify if user follows an account
  async verifyFollow(username, targetUrl) {
    try {
      const targetUsername = this.extractUsername(targetUrl);
      if (!targetUsername) {
        return { verified: false, message: 'Invalid profile URL' };
      }

      const userId = await this.getUserId(username);
      const targetUserId = await this.getUserId(targetUsername);

      // Check if user follows the target
      const response = await axios.get(
        `${this.baseURL}/users/${userId}/following`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          },
          params: {
            max_results: 1000
          }
        }
      );

      const following = response.data.data?.some(user => user.id === targetUserId);

      return {
        verified: following,
        message: following ? 'Follow verified successfully' : `Please follow @${targetUsername} and try again.`
      };
    } catch (error) {
      console.error('Follow verification error:', error.response?.data);
      return {
        verified: false,
        message: 'Verification failed. Please ensure you follow the account.'
      };
    }
  }

  // Verify if user retweeted
  async verifyRetweet(username, tweetUrl) {
    try {
      const tweetId = this.extractTweetId(tweetUrl);
      if (!tweetId) {
        return { verified: false, message: 'Invalid tweet URL' };
      }

      const userId = await this.getUserId(username);

      // Check if user retweeted
      const response = await axios.get(
        `${this.baseURL}/tweets/${tweetId}/retweeted_by`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          }
        }
      );

      const retweeted = response.data.data?.some(user => user.id === userId);

      return {
        verified: retweeted,
        message: retweeted ? 'Retweet verified successfully' : 'Retweet not found. Please retweet and try again.'
      };
    } catch (error) {
      console.error('Retweet verification error:', error.response?.data);
      return {
        verified: false,
        message: 'Verification failed. Please ensure you retweeted the post.'
      };
    }
  }

  // Verify if user commented on a tweet
  async verifyComment(username, tweetUrl) {
    try {
      const tweetId = this.extractTweetId(tweetUrl);
      if (!tweetId) {
        return { verified: false, message: 'Invalid tweet URL' };
      }

      const userId = await this.getUserId(username);

      // Search for replies to the tweet by the user
      const response = await axios.get(
        `${this.baseURL}/tweets/search/recent`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          },
          params: {
            query: `conversation_id:${tweetId} from:${username}`,
            max_results: 10
          }
        }
      );

      const commented = response.data.meta?.result_count > 0;

      return {
        verified: commented,
        message: commented ? 'Comment verified successfully' : 'Comment not found. Please comment on the tweet and try again.'
      };
    } catch (error) {
      console.error('Comment verification error:', error.response?.data);
      return {
        verified: false,
        message: 'Verification failed. Please ensure you commented on the tweet.'
      };
    }
  }

  // Main verification method
  async verifyTask(taskType, username, targetUrl, userAccessToken = null, userId = null) {
    if (!this.bearerToken && !userAccessToken) {
      return {
        verified: false,
        message: 'Twitter API not configured. Please contact support.'
      };
    }

    const cleanUsername = username.replace('@', '');

    switch (taskType.toLowerCase()) {
      case 'like':
        return await this.verifyLike(cleanUsername, targetUrl, userAccessToken, userId);
      
      case 'follow':
        return await this.verifyFollow(cleanUsername, targetUrl, userAccessToken);
      
      case 'retweet':
      case 'share':
        return await this.verifyRetweet(cleanUsername, targetUrl, userAccessToken);
      
      case 'comment':
        return await this.verifyComment(cleanUsername, targetUrl, userAccessToken);
      
      default:
        return {
          verified: false,
          message: 'Unsupported task type'
        };
    }
  }
}

const twitterVerification = new TwitterVerificationService();
export default twitterVerification;
