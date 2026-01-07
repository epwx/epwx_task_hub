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




  // Removed Twitter strategy and logic
}
export default passport;
