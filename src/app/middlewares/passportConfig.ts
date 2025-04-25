
// src/app/middlewares/passportConfig.ts

import passport from 'passport';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import dotenv from 'dotenv';

dotenv.config();

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5000/auth/facebook/callback',
},
(accessToken, refreshToken, profile, done) => {
    // Aquí puedes implementar la lógica para buscar o crear un usuario en tu base de datos.
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user as any);
});

export default passport;
