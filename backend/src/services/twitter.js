const axios = require('axios');

const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * Get Twitter user info
 */
async function getTwitterUser(accessToken) {
  try {
    const response = await axios.get(`${TWITTER_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Twitter user:', error);
    throw error;
  }
}

/**
 * Verify tweet like
 */
async function verifyTweetLike(tweetId, userId, bearerToken) {
  try {
    const response = await axios.get(
      `${TWITTER_API_BASE}/tweets/${tweetId}/liking_users`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );
    
    const likers = response.data.data || [];
    return likers.some(user => user.id === userId);
  } catch (error) {
    console.error('Error verifying tweet like:', error);
    return false;
  }
}

/**
 * Verify retweet
 */
async function verifyRetweet(tweetId, userId, bearerToken) {
  try {
    const response = await axios.get(
      `${TWITTER_API_BASE}/tweets/${tweetId}/retweeted_by`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );
    
    const retweeters = response.data.data || [];
    return retweeters.some(user => user.id === userId);
  } catch (error) {
    console.error('Error verifying retweet:', error);
    return false;
  }
}

/**
 * Verify follow
 */
async function verifyFollow(targetUserId, followerUserId, bearerToken) {
  try {
    const response = await axios.get(
      `${TWITTER_API_BASE}/users/${followerUserId}/following`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`
        }
      }
    );
    
    const following = response.data.data || [];
    return following.some(user => user.id === targetUserId);
  } catch (error) {
    console.error('Error verifying follow:', error);
    return false;
  }
}

/**
 * Extract tweet ID from URL
 */
function extractTweetId(url) {
  const match = url.match(/status\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract user ID from URL
 */
function extractUserId(url) {
  const match = url.match(/twitter\.com\/([^\/]+)/);
  return match ? match[1] : null;
}

module.exports = {
  getTwitterUser,
  verifyTweetLike,
  verifyRetweet,
  verifyFollow,
  extractTweetId,
  extractUserId
};
