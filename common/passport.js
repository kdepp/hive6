var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var mUser = require('../models/user');
var u = require('./utils');

passport.use(new Strategy(function (username, password, done) {
  mUser.login(username, password)
  .then(
    function (user) {
      console.log('in passport login', user);
      if (typeof user === 'number') return done(null, false);
      return done(null, user);
    },
    function (error_code) {
      if (typeof error_code === 'number') {
        done(null, false, u.makeError(error_code));
      } else {
        done(error_code);
      }
    }
  )
  .catch(function (err) {
    console.log(err.stack);
  });
}));

passport.serializeUser(function (user, done) {
  done(null, user && user._id.toString());
});

passport.deserializeUser(function(id, done) {
  mUser.findById(id)
  .then(
    function (user) { done(null, user) },
    function (err)  { done(err) }
  );
});

module.exports = passport;
