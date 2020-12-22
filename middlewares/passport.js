const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const dotenv = require('dotenv');
const Users = require('../models/mUsers');

dotenv.config();
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.access_token;
  }
  if (req && req.headers) {
    token = req.headers.access_token;
  }
  return token;
};

// Authorization
passport.use(
  'jwt',
  new JWTStrategy(
    {
      jwtFromRequest: cookieExtractor,
      secretOrKey: process.env.secretOrKey,
    },
    (payload, done) => {
      Users.findById({ _id: payload.sub }, (err, user) => {
        // Something wrong with service provider
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        }
        return done(null, false);
      });
    },
  ),
);

// Local Strategy
passport.use(
  'local',
  new LocalStrategy((username, password, done) => {
    Users.findOne({ email: username }, (err, user) => {
      // Something happened with database
      if (err) {
        return done(err);
      }
      // User not found
      if (!user) {
        return done(null, { message: { msgBody: 'User not found', msgError: true } });
      }

      return user.checkPassword(password, done);
    });
  }),
);
