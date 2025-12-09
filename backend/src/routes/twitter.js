const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { User } = require('../models');

/**
 * GET /api/twitter/connect/start?walletAddress=0x...
 * Start X/Twitter OAuth flow
 */
router.get('/connect/start', (req, res, next) => {
  const { walletAddress } = req.query;

  if (!walletAddress) {
    return res.status(400).send('Wallet address required');
  }

  // Validate wallet address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).send('Invalid wallet address');
  }

  // Store wallet address in session for callback
  req.session.walletAddress = walletAddress;

  // Pass walletAddress as query param through OAuth flow
  passport.authenticate('twitter', {
    state: JSON.stringify({ walletAddress })
  })(req, res, next);
});

/**
 * GET /api/twitter/callback
 * Twitter OAuth callback
 */
router.get('/callback', 
  passport.authenticate('twitter', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?error=twitter_auth_failed`,
    session: false
  }),
  function(req, res) {
    console.log('OAuth callback route HIT');
    console.log('OAuth callback: session.walletAddress:', req.session.walletAddress);
    console.log('OAuth callback: state param:', req.query.state);

    // If walletAddress is missing in session, try to get it from state param
    if (!req.session.walletAddress && req.query.state) {
      try {
        const stateObj = JSON.parse(req.query.state);
        if (stateObj.walletAddress) {
          req.session.walletAddress = stateObj.walletAddress;
          console.log('OAuth callback: walletAddress set from state param:', stateObj.walletAddress);
        }
      } catch (e) {
        console.log('OAuth callback: failed to parse state param:', req.query.state);
      }
    }

    // Fallback: try to get walletAddress from query param (if present)
    if (!req.session.walletAddress && req.query.walletAddress) {
      req.session.walletAddress = req.query.walletAddress;
      console.log('OAuth callback: walletAddress set from query param:', req.query.walletAddress);
    }

    // Success - redirect to dashboard
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?twitter_connected=true`);
  }
);

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
