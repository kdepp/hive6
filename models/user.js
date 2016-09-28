var crypto = require('crypto');
var db = require('../db/mongo');
var ERROR = require('../common/error_code');
var id = function (x) { return x };

var rsaEncrypt = function (str) {
  return crypto.createHash('RSA-SHA256').update(str).digest('hex');
};

module.exports = {
  findById: function (id) {
    return db.users.findById(id)
    .then(function (user) {
      if (!user) {
        throw ERROR.USER.FIND_BY_ID.USER_NOT_EXIST;
      }
      return user;
    });
  },
  login: function (username, password) {
    return new Promise(function (resolve, reject) {
      if (!username) {
        throw ERROR.USER.LOGIN.USERNAME_EMPTY;
      }

      if (!password) {
        throw ERROR.USER.LOGIN.PASSWORD_EMPTY;
      }

      db.users.findOne({username: username})
      .then(function (user) {
        console.log('found', user);
        if (!user)  {
          return reject(ERROR.USER.LOGIN.USER_NOT_EXIST);
        }

        if (user.password !== rsaEncrypt(password)) {
          return reject(ERROR.USER.LOGIN.USERNAME_PASSWORD_UNMATCHED);
        }

        delete user.password;
        resolve(user);
      })
      .catch(function (err) {
        console.log(err.stack);
      })
    });
  },
  register: function (username, password, retype) {
    return new Promise(function (resolve, reject) {
      if (!username) {
        throw ERROR.USER.REGISTER.NO_USERNAME;
      }

      if (password !== retype) {
        throw ERROR.USER.REGISTER.PASSWORD_NOT_EQUAL;
      }

      if (password.length < 6) {
        throw ERROR.USER.REGISTER.PASSWORD_TOO_SHORT;
      }

      if ([
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[~!@#$%^&*()_+=-[\]{}'";:/?.>,<`]/.test(password)
      ].filter(id).length < 4) {
        throw ERROR.USER.REGISTER.PASSWORD_TOO_SIMPLE;
      }

      db.users.insertOne({
        username: username,
        password: rsaEncrypt(password)
      })
      .then(
        function (r) {
          var user = r.ops[0];
          delete user.password;
          resolve(user);
        },
        function (err) {
          throw ERROR.USER.REGISTER.USERNAME_EXISTED;
        }
      );
    });
  }
};
