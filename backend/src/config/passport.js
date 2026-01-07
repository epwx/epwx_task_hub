import passport from 'passport';
// Removed passport-oauth2 import
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

// Removed Twitter OAuth 2.0 Strategy and logic
export default passport;
