/* eslint camelcase: 0, comma-style: 0, object-property-newline: 0 */

var ERROR = require('../common/error_code');
var mUser = require('../models/user');
var mGame = require('../models/game');
var u = require('../common/utils');

var version = function (url) {
  return '/api/v1' + url;
};

var logError = function (err) {
  console.log(err.stack);
};

var output = function (res, error_code, data, msg) {
  var obj = {
    error_code: error_code,
    msg: msg || u.errText(error_code),
    data: data
  };

  res.send(JSON.stringify(obj));
};

var wrapUnknownError = function (res, fn) {
  return function (err) {
    if (typeof err !== 'number') {
      console.log('unknown error', err);
      return output(res, -1, null, err);
    }
    return fn(err);
  };
};

var apiRouter = [
  {
    method: 'post', url: version('/login'),
    callback: function (req, res) {
      var post = req.body;

      mUser.login(post.username, post.password)
      .then(
        function (user) {
          output(res, 0, user);
        },
        wrapUnknownError(res, function (error_code) {
          output(res, error_code, null);
        })
      )
      .catch(logError);
    }
  }
  , {
    method: 'post', url: version('/register'),
    callback: function (req, res) {
      var post = req.body;

      mUser.register(post.username, post.password, post.retype)
      .then(
        function (user) {
          output(res, 0, user);
        },
        wrapUnknownError(res, function (error_code) {
          output(res, error_code, null);
        })
      )
      .catch(logError);
    }
  }
  , {
    method: 'post', url: version('/game/:id/join'),
    callback: function (req, res) {
      var gameId = req.params.id;
      var password = req.body && req.body.password;
      var userId = req.user._id.toString();

      console.log('got it in join', gameId, password, userId);

      mGame.join(gameId, userId, password)
      .then(
        function (data) {
          output(res, 0, data);
        },
        wrapUnknownError(res, function (error_code) {
          output(res, error_code, null);
        })
      )
      .catch(logError);
    }
  }
  , {
    method: 'post', url: version('/game/create'),
    callback: function (req, res) {
      if (!req.user)  return output(res, ERROR.USER.NEED_LOGIN, null);

      var userId = req.user._id.toString();
      var sideId = parseInt(req.body.sideId);

      console.log(sideId, typeof sideId);

      mGame.create(userId, sideId)
      .then(
        function (game) {
          output(res, 0, {
            link: '/game/' + game._id.toString(),
            password: game.password
          });
        },
        wrapUnknownError(res, function (error_code) {
          output(res, error_code, null);
        })
      )
      .catch(logError);
    }
  }
  , {
    method: 'post', url: version('/game/:id/move'),
    callback: function (req, res) {
      if (!req.user)  return output(res, ERROR.USER.NEED_LOGIN, null);

      var userId = req.user._id.toString();
      var gameId = req.params.id;
      var post   = req.body;

      mGame.move(
        gameId, userId,
        parseInt(post.type), parseInt(post.sideId),
        parseInt(post.roleId), post.src,
        post.dst, post.coordinates
      )
      .then(
        function (data) {
          console.log('move done');
          output(res, 0, {
            updateTime: new Date() * 1
          });
        },
        wrapUnknownError(res, function (error_code) {
          console.log('move error');
          output(res, error_code, null);
        })
      )
      .catch(logError);
    }
  }
  , {
    method: 'get', url: version('/game/:id/check'),
    callback: function (req, res) {
      console.log('in here');
      if (!req.user)  return output(res, ERROR.USER.NEED_LOGIN, null);

      var userId = req.user._id.toString();
      var gameId = req.params.id;
      var timestamp = req.query.timestamp;

      mGame.checkExpire(gameId, userId, timestamp)
      .then(
        function (data) {
          output(res, 0, data);
        },
        wrapUnknownError(res, function (error_code) {
          output(res, error_code, null);
        })
      )
      .catch(logError);
    }
  }
];

module.exports = apiRouter;
