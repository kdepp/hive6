var ERROR = require('../common/error_code');
var mUser = require('../models/user');
var u = require('../common/utils');

var version = function (url) {
  return '/api/v1' + url;
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
      return output(res, -1, null, err.toString());
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
        wrapUnknownError(function (error_code) {
          output(res, error_code, null);
        })
      )
      .catch(function (err) {
        console.log(err.stack);
      });
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
        wrapUnknownError(function (error_code) {
          output(res, error_code, null);
        })
      )
    }
  }
];

module.exports = apiRouter;
