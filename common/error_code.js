var n = 1;
var inc = function () {
  return n++;
};

module.exports = {
  USER: {
    NEED_LOGIN: inc(),
    REGISTER: {
      NO_USERNAME: inc(),
      USERNAME_EXISTED: inc(),
      PASSWORD_TOO_SHORT: inc(),
      PASSWORD_TOO_SIMPLE: inc(),
      PASSWORD_NOT_EQUAL: inc()
    },
    LOGIN: {
      USERNAME_PASSWORD_UNMATCHED: inc(),
      USER_NOT_EXIST: inc(),
      USERNAME_EMPTY: inc(),
      PASSWORD_EMPTY: inc()
    },
    FIND_BY_ID: {
      USER_NOT_EXIST: inc()
    }
  },
  GAME: {
    GAME_ID_EMPTY: inc(),
    USER_ID_EMPTY: inc(),
    CREATE: {
      SIDE_EMPTY: inc(),
    },
    FIND_BY_ID: {
      GAME_NOT_EXIST: inc(),
    },
    JOIN: {
      PASSWORD_EMPTY: inc(),
      PLAYERS_FULL: inc(),
      NO_OPPONENT: inc(),
      WRONG_PASSWORD: inc(),
    },
    END: {
      INVALID_GAME_STATUS: inc(),
      INVALID_WIN: inc(),
    },
    MOVE: {
      INVALID_TYPE: inc(),
      INVALID_SIDE: inc(),
      INVALID_ROLE: inc(),
      INVALID_DESTINATION_POSITION: inc(),
      INVALID_SOURCE_POSITION: inc(),
      BOARD_EMPTY: inc(),
      USER_NOT_THE_PLAYER: inc(),
      NOT_YOUR_TURN: inc(),
      INVALID_ROLE_COUNT: inc(),
      INVALID_MOVEMENT: inc()
    }
  }
};
