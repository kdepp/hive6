var db = require('../db/mongo');
var ERROR = require('../common/error_code');
var id = function (x) { return x };

module.exports = {
  findById: function (id) {
    return db.users.findById(id);
  },
  findByUserName: function (username) {
    return db.users.findOne({username: username});
  },
  login: function (username, password) {

  },
  register: function (username, password, retype) {
    return new Promise(function (resolve, reject) {
      if (!username) {
        throw ERROR.REGISTER.NO_USERNAME;
      }

      if (password !== retype) {
        throw ERROR.REGISTER.PASSWORD_NOT_EQUAL;
      }

      if (password.length < 6) {
        throw ERROR.REGISTER.PASSWORD_TOO_SHORT;
      }

      if ([
        /[a-z]/.test(password),
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[~!@#$%^&*()_+=-[\]{}'";:/?.>,<`]/.test(password)
      ].filter(id).length < 4) {
        throw ERROR.REGISTER.PASSWORD_TOO_SIMPLE;
      }

      db.users.insertOne({
        username: username,
        password: password
      })
      .then(
        function (r) {
          var user = r.ops[0];
          resolve(user);
        },
        function (err) {
          throw ERROR.REGISTER.USERNAME_EXISTED;
        }
      );
    });
  }
};
