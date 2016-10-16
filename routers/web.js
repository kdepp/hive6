/* eslint camelcase: 0, comma-style: 0, object-property-newline: 0 */
var path = require('path');
var crypto = require('crypto');
var child_process = require('child_process');
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var x = require('kd-utils');

var passport = require('../common/passport');
var ERROR = require('../common/error_code');
var mUser = require('../models/user');
var mGame = require('../models/game');
var u = require('../common/utils');

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

var formatDate = function (date) {
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  ].join('-');
};

var webRouter = [
  {
    method: 'get', url: '/',
    callback: function (req, res) {
      var data = userAndError(req)
      res.render('home', data);
    }
  }
  , {
    method: 'get', url: '/rules',
    callback: function (req, res) {
      var data  = userAndError(req);
      res.render('rules', data);
    }
  }
  , {
    method: 'get', url: '/about',
    callback: function (req, res) {
      var data  = userAndError(req);
      res.render('about', data);
    }
  }
  , {
    method: 'get', url: '/login',
    callback: function (req, res) {
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
            if (err)  console.log(err);
            res.redirect('/');
          });
        },
        function (error_code) {
          backToRegister(error_code);
        }
      )
    }
  }
  , {
    method: 'get', url: '/games',
    callback: function (req, res) {
      res.render('game');
    }
  }
  , {
    method: 'get', url: '/game/create',
    callback: [
      ensureLogin,
      function (req, res) {
        var data = userAndError(req)
        res.render('game_create', data);
      }
    ]
  }
  , {
    method: 'post', url: '/game/create',
    callback: function (req, res) {
      var user = req.user;

      if (!user)  return res.redirect('/login');

      var sideId = parseInt(req.body.sideId);

      mGame.create(user._id.toString(), sideId)
      .then(
        function (game) {
          res.redirect('/game/' + game._id.toString());
        },
        function (error_code) {
          console.log(u.errText(error_code));
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
          console.log(u.errText(error_code));
          req.flash('error_code', error_code);
          res.redirect('/game/' + gameId);
        }
      )
    }
  }
  , {
    method: 'get', url: '/game/:id/replay',
    callback: function (req, res) {
      var gameId = req.params.id;

      mGame.findByIdWithUserInfo(gameId)
      .then(
        function (game) {
          if (!game || game.status !== 2) {
            req.flash('error_code', ERROR.GAME.REPLAY.GAME_NOT_END_YET);
          }
          return game;
        },
        function (error_code) {
          req.flash('error_code', error_code);
        }
      )
      .then(function (game) {
        var data = Object.assign({
          playerNames: x.pluck('username', game.players)
        }, game);

        data = userAndError(req, data);
        res.render('game_replay', data);
      })
    }
  }
  , {
    method: 'get', url: '/game/:id',
    callback: [
      ensureLogin,
      function (req, res) {
        var gameId = req.params.id;
        var userId = req.user._id.toString();

        mGame.findByIdWithUserInfo(gameId)
        .then(
          function (game) {
            var data;

            if (game.status === 2) {
              return res.redirect('/game/' + gameId + '/replay');
            }

            var comein = game.players.filter(function (item) {
              return item === null || item === undefined;
            }).length > 0;

            var found  = game.players.find(function (user) {
              return user && user._id === userId;
            });

            if (comein) {
              if (found) {
                data = Object.assign({
                  sharePassword: true
                }, game);
              } else {
                data = {
                  needPassword: true,
                  _id: game._id.toString()
                };
              }
            } else {
              if (!found) {
                data = {
                  authorized: false
                };
              } else {
                data = Object.assign({
                  authorized: true,
                  sideId: game.players.indexOf(found),
                  playerTypes: game.players.map(function (player) {
                    return player._id === userId ? 0 : 1
                  }),
                  playerNames: x.pluck('username', game.players)
                }, game);
              }
            }

            data = userAndError(req, data);
            res.render('game', data);
          },
          function (error_code) {
            console.log(error_code);
            res.redirect('/games?fr=game_detail');
          }
        )
        .catch(function (e) { console.log(e, e.stack); });
      }
    ]
  }
  , {
    method: 'get', url: '/game/vs/local',
    callback: function (req, res) {
      var data  = userAndError(req);
      res.render('game_local', data);
    }
  }
  , {
    method: 'get', url: '/my/games',
    callback: [
      ensureLogin,
      function (req, res) {
        var userId = req.user._id.toString();

        mGame.findByUserId(userId)
        .then(function (games) {
          var data = userAndError(req, {
            games: games.map(function (game) {
              return Object.assign(game, {
                statusName: ['尚未开始', '进行中', '已结束'][game.status],
                createTime: formatDate(game.createTime),
                updateTime: formatDate(game.updateTime)
              });
            })
          });
          res.render('my_games', data);
        })
        .catch(function (e) {
          console.log(e.stack);
        });
      }
    ]
  }
  , {
    method: 'post', url: '/workflow/hook',
    callback: function (req, res) {
      var gEvent = req.get('X-GitHub-Event');
      var gSignature = req.get('X-Hub-Signature');
      var payload = req.body;
      var githubHmacHex = function (payload) {
        var hmac = crypto.createHmac('sha1', 'online.hive6');
        hmac.update(JSON.stringify(payload));
        return 'sha1=' + hmac.digest('hex');
      };
      var pullAndRestart = function () {
        var arg = {
          cwd: path.join(__dirname, '..')
        };
        var pull = child_process.spawn('git', ['pull'], arg);

        pull.on('close', function (code) {
          if (code !== 0) return;
          child_process.spawn('pm2', ['restart', 'index.js'], arg);
        });
      };

      if (gEvent === 'push' && gSignature === githubHmacHex(payload)) {
        pullAndRestart();
      }
    }
  }
];

module.exports = webRouter;
