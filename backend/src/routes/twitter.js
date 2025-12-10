const express = require('express');
const router = express.Router();
const { User } = require('../models');
const axios = require('axios');
const crypto = require('crypto');

// Store for PKCE verifiers (in production, use Redis)
const pkceStore = new Map();

/**
 * GET /api/twitter/connect/start?walletAddress=0x...
 * Start X/Twitter OAuth 2.0 flow manually
 */
router.get('/connect/start', (req, res) => {
  const { walletAddress } = req.query;

  if (!walletAddress) {
    return res.status(400).send('Wallet address required');
  }

  // Validate wallet address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).send('Invalid wallet address');
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  
  // Generate state parameter with wallet address
  const state = crypto.randomBytes(16).toString('hex');
  
  // Store verifier and wallet address with state
  pkceStore.set(state, { 
    codeVerifier, 
    walletAddress,
    timestamp: Date.now()
  });
  
  // Clean up old entries (older than 10 minutes)
  for (const [key, value] of pkceStore.entries()) {
    if (Date.now() - value.timestamp > 10 * 60 * 1000) {
      pkceStore.delete(key);
    }
  }

  // Build Twitter OAuth 2.0 authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TWITTER_CLIENT_ID,
    redirect_uri: process.env.TWITTER_CALLBACK_URL || 'http://localhost:4000/api/twitter/callback',
    scope: 'tweet.read users.read like.read follows.read offline.access',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  const authUrl = `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
  
  console.log('[Twitter OAuth] Redirecting to:', authUrl);
  res.redirect(authUrl);
});

/**
 * GET /api/twitter/callback
 * Twitter OAuth 2.0 callback - handle authorization code
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    console.log('[Twitter OAuth Callback] Received:', { code: !!code, state, error });
    
    if (error) {
      console.error('[Twitter OAuth Callback] Error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=twitter_auth_failed`);
    }
    
    if (!code || !state) {
      console.error('[Twitter OAuth Callback] Missing code or state');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=missing_params`);
    }
    
    // Retrieve stored data using state
    const storedData = pkceStore.get(state);
    if (!storedData) {
      console.error('[Twitter OAuth Callback] Invalid or expired state');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=invalid_state`);
    }
    
    const { codeVerifier, walletAddress } = storedData;
    pkceStore.delete(state); // Clean up
    
    console.log('[Twitter OAuth Callback] Exchanging code for token...');
    
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://api.twitter.com/2/oauth2/token', 
      new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: process.env.TWITTER_CLIENT_ID,
        redirect_uri: process.env.TWITTER_CALLBACK_URL || 'http://localhost:4000/api/twitter/callback',
        code_verifier: codeVerifier
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );
    
    const { access_token, refresh_token } = tokenResponse.data;
    console.log('[Twitter OAuth Callback] Got access token');
    
    // Fetch user profile from Twitter API v2
    const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const twitterUser = userResponse.data.data;
    console.log('[Twitter OAuth Callback] Twitter user:', twitterUser);
    
    // Find or create user
    let user = await User.findOne({ where: { walletAddress } });
    if (!user) {
      user = await User.create({
        walletAddress,
        twitterId: twitterUser.id,
        twitterUsername: twitterUser.username,
        twitterAccessToken: access_token,
        twitterRefreshToken: refresh_token
      });
      console.log('[Twitter OAuth Callback] Created new user');
    } else {
      await user.update({
        twitterId: twitterUser.id,
        twitterUsername: twitterUser.username,
        twitterAccessToken: access_token,
        twitterRefreshToken: refresh_token
      });
      console.log('[Twitter OAuth Callback] Updated existing user');
    }
    
    // Success - redirect to dashboard
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?twitter_connected=true`);
    
  } catch (error) {
    console.error('[Twitter OAuth Callback] Error:', error.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=twitter_callback_failed`);
  }
});

/**
 * GET /api/twitter/status
 * Check if wallet has connected X/Twitter account
 */
router.get('/status/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    console.log('[Twitter status] Checking status for walletAddress:', walletAddress);
    const user = await User.findOne({ 
      where: { walletAddress },
      attributes: ['twitterId', 'twitterUsername']
    });
    console.log('[Twitter status] User found:', user ? user.toJSON() : null);
    if (!user || !user.twitterId) {
      return res.json({
        success: true,
        connected: false,
        twitterUsername: null
      });
    }
    res.json({
      success: true,
      connected: true,
      twitterUsername: user.twitterUsername
    });
  } catch (error) {
    console.error('Twitter status check error:', error);
    res.status(500).json({ error: 'Failed to check Twitter status' });
  }
});

/**
 * POST /api/twitter/disconnect
 * Disconnect X/Twitter account
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }
    
    const user = await User.findOne({ where: { walletAddress } });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Clear Twitter credentials
    await user.update({
      twitterId: null,
      twitterUsername: null,
      twitterAccessToken: null,
      twitterRefreshToken: null
    });
    
    res.json({
      success: true,
      message: 'X/Twitter account disconnected'
    });
  } catch (error) {
    console.error('Twitter disconnect error:', error);
    res.status(500).json({ error: 'Failed to disconnect Twitter' });
  }
});

module.exports = router;
