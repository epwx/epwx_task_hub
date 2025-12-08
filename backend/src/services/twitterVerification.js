const axios = require('axios');

class TwitterVerificationService {
  constructor() {
    this.bearerToken = process.env.TWITTER_BEARER_TOKEN;
    this.baseURL = 'https://api.twitter.com/2';
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
  async verifyLike(username, tweetUrl) {
    try {
      const tweetId = this.extractTweetId(tweetUrl);
      if (!tweetId) {
        return { verified: false, message: 'Invalid tweet URL' };
      }

      const userId = await this.getUserId(username);

      // Check if user liked the tweet
      const response = await axios.get(
        `${this.baseURL}/tweets/${tweetId}/liking_users`,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`
          }
        }
      );

      const liked = response.data.data?.some(user => user.id === userId);
      
      return {
        verified: liked,
        message: liked ? 'Like verified successfully' : 'Like not found. Please like the tweet and try again.'
      };
    } catch (error) {
      console.error('Like verification error:', error.response?.data);
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
  async verifyTask(taskType, username, targetUrl) {
    if (!this.bearerToken) {
      return {
        verified: false,
        message: 'Twitter API not configured. Please contact support.'
      };
    }

    const cleanUsername = username.replace('@', '');

    switch (taskType.toLowerCase()) {
      case 'like':
        return await this.verifyLike(cleanUsername, targetUrl);
      
      case 'follow':
        return await this.verifyFollow(cleanUsername, targetUrl);
      
      case 'retweet':
      case 'share':
        return await this.verifyRetweet(cleanUsername, targetUrl);
      
      case 'comment':
        return await this.verifyComment(cleanUsername, targetUrl);
      
      default:
        return {
          verified: false,
          message: 'Unsupported task type'
        };
    }
  }
}

module.exports = new TwitterVerificationService();
