var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var passport = require('../common/passport');
var ERROR = require('../common/error_code');
var mUser = require('../models/user');
var u = require('../common/utils');

var ensure = ensureLoggedIn('/login');

var userAndError = function (req, data) {
  var user = req.user;
  var error = req.flash('error_code');

  return Object.assign({
    username: user ? user.username : 'newbie',
    isLogined: !!user,
    error: error.length && {
      code: error[0],
      msg: u.errText(parseInt(error[0]))
    }
  }, data);
};

module.exports = [
  {
    method: 'get', url: '/',
    callback: function (req, res) {
      var user = req.user;
      var data = userAndError(req)
      res.render('home', data);
    }
  }
  , {
    method: 'get', url: '/login',
    callback: function (req, res) {
      var user  = req.user;
      var error = req.flash('error');
      var data  = userAndError(req);

      res.render('login', data);
    }
  }
  , {
    method: 'get', url: '/logout',
    callback: function (req, res) {
      req.logout();
      res.redirect('/');
    }
  }
  , {
    method: 'get', url: '/register',
    callback: function (req, res) {
      var data = userAndError(req);
      res.render('register', data);
    }
  }
  , {
    method: 'post', url: '/login',
    callback: passport.authenticate('local', {
      successReturnToOrRedirect: '/',
      failureRedirect: '/login',
      failureFlash: {
        type: 'error_code',
        // passportjs only support message of string type
        message: '' + ERROR.LOGIN.USERNAME_PASSWORD_UNMATCHED
      }
    })
  }
  , {
    method: 'post', url: '/register',
    callback: function (req, res, next) {
      var backToRegister = function (code) {
        req.flash('error_code', code);
        res.redirect('/register');
      };
      var post = req.body;

      mUser.register(post.username, post.password, post.retype)
      .then(
        function (user) {
          req.login(user, function (err) {
            res.redirect('/');
          });
        },
        function (error_code) {
          console.log(error_code);
          backToRegister(error_code);
        }
      )
    }
  }
];
