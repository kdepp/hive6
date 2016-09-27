var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var mUser = require('../models/user');

passport.use(new Strategy(function (username, password, done) {
  mUser.findByUserName(username)
  .then(function (user) {
    if (!user)  {
      return done(null, false, {message: 'username does not exist'});
    }
    if (user.password !== password) {
      return done(null, false, {message: 'password not correct'});
    }

    return done(null, user);
  })
  .catch(function (err) {
    done(err);
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
