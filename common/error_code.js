var n = 1;
var inc = function () {
  return n++;
};

module.exports = {
  REGISTER: {
    NO_USERNAME: inc(),
    USERNAME_EXISTED: inc(),
    PASSWORD_TOO_SHORT: inc(),
    PASSWORD_TOO_SIMPLE: inc(),
    PASSWORD_NOT_EQUAL: inc()
  },
  LOGIN: {
    USERNAME_PASSWORD_UNMATCHED: inc()
  },
};
