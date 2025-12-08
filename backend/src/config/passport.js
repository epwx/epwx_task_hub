const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const { User } = require('../models');

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

// Twitter OAuth Strategy
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  passport.use(new TwitterStrategy({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:4000/api/auth/twitter/callback',
      includeEmail: true,
      passReqToCallback: true
    },
    async (req, token, tokenSecret, profile, done) => {
      try {
        // Get wallet address from session (set before redirect)
        const walletAddress = req.session.walletAddress;
        
        if (!walletAddress) {
          return done(new Error('No wallet address in session'), null);
        }

        // Find or create user
        let user = await User.findOne({ where: { walletAddress } });
        
        if (!user) {
          // Create new user
          user = await User.create({
            walletAddress,
            twitterId: profile.id,
            twitterUsername: profile.username,
            twitterAccessToken: token,
            twitterRefreshToken: tokenSecret,
            email: profile.emails?.[0]?.value
          });
        } else {
          // Update existing user with X/Twitter info
          await user.update({
            twitterId: profile.id,
            twitterUsername: profile.username,
            twitterAccessToken: token,
            twitterRefreshToken: tokenSecret,
            email: profile.emails?.[0]?.value || user.email
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Twitter OAuth error:', error);
        return done(error, null);
      }
    }
  ));
  console.log('✅ Twitter OAuth configured');
} else {
  console.warn('⚠️  Twitter OAuth not configured - missing TWITTER_CONSUMER_KEY or TWITTER_CONSUMER_SECRET');
}

module.exports = passport;
