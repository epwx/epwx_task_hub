import passport from 'passport';
import { Strategy as OAuth2Strategy } from 'passport-oauth2';
import { User } from '../models/index.js';
import axios from 'axios';

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
        // Always extract walletAddress from state param if present
        let walletAddress = null;
        if (req.query && req.query.state) {
          try {
            const stateObj = JSON.parse(req.query.state);
            if (stateObj.walletAddress) {
              walletAddress = stateObj.walletAddress;
              console.log('[OAuth callback] walletAddress from state param:', walletAddress);
            }
          } catch (e) {
            console.error('[OAuth callback] Failed to parse state param:', req.query.state);
          }
        }
        // Fallback to session if state param is missing
        if (!walletAddress) {
          walletAddress = req.session.walletAddress;
          console.log('[OAuth callback] walletAddress from session:', walletAddress);
        }
        if (!walletAddress) {
          console.error('[OAuth callback] No wallet address in state or session');
          return done(new Error('No wallet address in state or session'), null);
        }

        // Fetch user profile from Twitter API v2
        const userResponse = await axios.get('https://api.twitter.com/2/users/me', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const twitterUser = userResponse.data.data;
        console.log('[OAuth callback] Twitter user:', twitterUser);

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
          console.log('[OAuth callback] Created new user:', user.toJSON());
        } else {
          await user.update({
            twitterId: twitterUser.id,
            twitterUsername: twitterUser.username,
            twitterAccessToken: accessToken,
            twitterRefreshToken: refreshToken
          });
          console.log('[OAuth callback] Updated existing user:', user.toJSON());
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
export default passport;
