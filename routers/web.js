var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var passport = require('../common/passport');
var ERROR = require('../common/error_code');
var mUser = require('../models/user');
var mGame = require('../models/game');
var u = require('../common/utils');
var apiRouter = require('./api');

var ensureLogin = ensureLoggedIn('/login');

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

var webRouter = [
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
        message: '' + ERROR.USER.LOGIN.USERNAME_PASSWORD_UNMATCHED
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
  , {
    method: 'get', url: '/game/:id',
    callback: [
      ensureLogin,
      function (req, res) {
        var gameId = req.params.id;

        mGame.findById(gameId)
        .then(
          function (game) {
            var data = userAndError(req, game);
            res.render('game_detail', data);
          },
          function (error_code) {
            console.log(error_code);
            res.redirect('/games?fr=game_detail');
          }
        )
      }
    ]
  }
  , {
    method: 'get', url: '/games',
    callback: function (req, res) {
      res.send('games');
    }
  }
  , {
    method: 'post', url: '/game/create',
    callback: function (req, res) {
      var user = req.user;

      if (!user)  return res.redirect('/login');

      var post = req.body;
      var sideId = req.sideId;

      mGame.create(user._id.toString(), sideId)
      .then(
        function (game) {
          res.redirect('/game/' + game._id.toString());
        },
        function (error_code) {
          console.log(error_code);
          res.redirect('/?fr=game_create');
        }
      )
    }
  }
  , {
    method: 'post', url: '/game/:id/join',
    callback: function (req, res) {
      if (!req.res) return res.redirect('/login');

      var gameId = req.params.id;
      var password = req.body.password;
      var userId = req.user._id.toString();

      mGame.join(gameId, userId, password)
      .then(
        function (data) {
          res.redirect('/game/' + gameId);
        },
        function (error_code) {
          console.log(error_code);
          res.redirect('/games');
        }
      )
    }
  }
];

module.exports = webRouter;
