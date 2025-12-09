// Debug: Print callback URL at runtime
console.log('TWITTER_CALLBACK_URL at runtime:', process.env.TWITTER_CALLBACK_URL);
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const { User } = require('../models');
const axios = require('axios');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Twitter OAuth 2.0 Strategy
if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
  passport.use('twitter', new OAuth2Strategy({
      authorizationURL: 'https://twitter.com/i/oauth2/authorize',
      tokenURL: 'https://api.twitter.com/2/oauth2/token',
      clientID: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:4000/api/twitter/callback',
      scope: ['tweet.read', 'users.read', 'offline.access'],
      state: true,
      pkce: true,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, params, profile, done) => {
      try {
        // Get wallet address from session
        const walletAddress = req.session.walletAddress;
        
        if (!walletAddress) {
          return done(new Error('No wallet address in session'), null);
        }

        // Fetch user profile from Twitter API v2
        const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const twitterUser = userResponse.data.data;

        // Find or create user
        let user = await User.findOne({ where: { walletAddress } });
        
        if (!user) {
          user = await User.create({
            walletAddress,
            twitterId: twitterUser.id,
            twitterUsername: twitterUser.username,
            twitterAccessToken: accessToken,
            twitterRefreshToken: refreshToken
          });
        } else {
          await user.update({
            twitterId: twitterUser.id,
            twitterUsername: twitterUser.username,
            twitterAccessToken: accessToken,
            twitterRefreshToken: refreshToken
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Twitter OAuth error:', error);
        return done(error, null);
      }
    }
  ));
  console.log('✅ Twitter OAuth 2.0 configured');
} else {
  console.warn('⚠️  Twitter OAuth not configured - missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET');
}

module.exports = passport;
