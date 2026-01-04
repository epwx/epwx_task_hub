import axios from 'axios';

/**
 * Refresh Twitter OAuth 2.0 access token using refresh token
 * @param {string} refreshToken - The refresh token
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export async function refreshTwitterToken(refreshToken) {
  try {
    const response = await axios.post(
      'https://api.twitter.com/2/oauth2/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.TWITTER_CLIENT_ID
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token || refreshToken // Some providers return new refresh token
    };
  } catch (error) {
    console.error('[Token Refresh] Error:', error.response?.data || error.message);
    throw new Error('Failed to refresh Twitter token');
  }
}


