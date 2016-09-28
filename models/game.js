var db = require('../db/mongo');
var ERROR = require('../common/error_code');
var mUser = require('./user');

var id = function (x) { return x };

var randomPassword = function (n) {
  var str = '';
  var i;

  for (i = 0; i < n; i++) {
    str += (Math.floor(Math.random() * 1000) % 16).toString(16);
  }

  return str;
};

var checkPosition = function (pos) {
  if (!pos) return false;
  if (pos.length !== 3) return false;

  pos.forEach(function (x) {
    if (typeof x !== 'number')  return false;
  });

  return true;
};

var makeGame = function (userId, sideId, extra) {
  return Object.assign({
    createTime: new Date(),
    updateTime: new Date(),
    players: sideId ? [null, userId] : [userId, null],
    movement: [],
    board: [],
    owner: userId,
    password: '888888',
    status: 0,
    winner: null
  }, extra);
};

var makeMovement = function (type, sideId, roleId, src, dst) {
  return {
    type: type,
    sideId: sideId,
    roleId: roleId,
    src: src,
    dst: dst,
    createTime: new Date()
  };
};

var checkNextSide = function (sideId, movement) {
  return true;
};

var checkRoleCount = function (sideId, roleId, board) {
  return true;
};

var checkMovement = function (oldBoard, board, type, sideId, roleId, src, dst) {
  return true;
};

var checkWinnerSide = function (sideId, board) {
  return true;
};

var mGame = {
  findById: function (id) {
    return db.games.findById(id)
    .then(function (game) {
      if (!game) {
        throw ERROR.GAME.FIND_BY_ID.GAME_NOT_EXIST;
      }
      return game;
    });
  },
  create: function (userId, sideId) {
    if (!userId) {
      return Promise.reject(ERROR.GAME.USER_ID_EMPTY);
    }

    if ([0, 1].indexOf(sideId) === -1) {
      return Promise.reject(ERROR.GAME.CREATE.SIDE_EMPTY);
    }

    return mUser.findById(userId)
    .then(function (user) {
      var data = makeGame(userId, sideId, {password: randomPassword(6)});

      return db.games.insertOne(data)
      .then(function (r) {
        var game = r.ops[0];
        return game;
      });
    });
  },
  join: function (gameId, userId, password) {
    if (!gameId) {
      return Promise.reject(ERROR.GAME.GAME_ID_EMPTY);
    }

    if (!userId) {
      return Promise.reject(ERROR.GAME.USER_ID_EMPTY);
    }

    if (!password) {
      return Promise.reject(ERROR.GAME.JOIN.PASSWORD_EMPTY);
    }

    var p1 = mGame.findById(gameId);
    var p2 = mUser.findById(userId);

    return Promise.all([p1, p2])
    .then(function (tuple) {
      var game = tuple[0];

      if (game.players && game.players.filter(id).length >= 2) {
        throw ERROR.GAME.JOIN.PLAYERS_FULL;
      }

      if (game.players && game.players.filter(id).length == 0) {
        throw ERROR.GAME.JOIN.NO_OPPONENT;
      }

      if (password !== game.password) {
        throw ERROR.GAME.JOIN.WRONG_PASSWORD;
      }

      var players = game.players;
      var index   = players.indexOf(null);

      players.splice(index, 1, userId);

      return db.games.updateById(gameId, {
        $set: {players: players}
      })
      .then(function (r) {
        return { modifiedCount: r.modifiedCount };
      });
    });
  },
  end: function (gameId, winnerSideId) {
    if (!gameId) {
      throw ERROR.GAME.GAME_ID_EMPTY;
    }

    if ([0, 1].indexOf(winnerSideId) === -1) {
      throw ERROR.GAME.END.INVALID_SIDE;
    }

    return mGame.findById(gameId)
    .then(function (game) {
      if (game.status !== 1) {
        throw ERROR.GAME.END.INVALID_GAME_STATUS;
      }

      if (!checkWinnerSide(winnerSideId, game.board)) {
        throw ERROR.GAME.END.INVALID_WIN;
      }

      return db.games.updateById(gameId, {
        $set: {
          status: 2,
          winner: {
            sideId: winnerSideId,
            userId: game.players[winnerSideId]
          }
        }
      });
    });
  },
  move: function (gameId, userId, type, sideId, roleId, src, dst, board) {
    if (!gameId) {
      return Promise.reject(ERROR.GAME.GAME_ID_EMPTY);
    }

    if (!userId) {
      return Promise.reject(ERROR.GAME.USER_ID_EMPTY);
    }

    if ([0, 1].indexOf(type) === -1) {
      return Promise.reject(ERROR.GAME.MOVE.INVALID_TYPE);
    }

    if ([0, 1].indexOf(sideId) === -1) {
      return Promise.reject(ERROR.GAME.MOVE.INVALID_SIDE);
    }

    if ([0, 1, 2, 3, 4].indexOf(roleId) === -1) {
      return Promise.reject(ERROR.GAME.MOVE.INVALID_ROLE);
    }

    if (!checkPosition(dst)) {
      return Promise.reject(ERROR.GAME.MOVE.INVALID_DESTINATION_POSITION);
    }

    if (type === 1 && !checkPosition(src)) {
      return Promise.reject(ERROR.GAME.MOVE.INVALID_SOURCE_POSITION);
    }

    if (!board) {
      return Promise.reject(ERROR.GAME.MOVE.BOARD_EMPTY);
    }

    return mGame.findById(gameId)
    .then(function (game) {
      if (game.players[sideId] !== userId) {
        throw ERROR.GAME.MOVE.USER_NOT_THE_PLAYER;
      }

      if (!checkNextSide(sideId, game.movement)) {
        throw ERROR.GAME.MOVE.NOT_YOUR_TURN;
      }

      if (type === 0 && !checkRoleCount(sideId, roleId, game.board)) {
        throw ERROR.GAME.MOVE.INVALID_ROLE_COUNT;
      }

      if (!checkMovement(game.board, board, type, sideId, roleId, src, dst)) {
        throw ERROR,GAME.MOVE.INVALID_MOVEMENT;
      }

      return db.games.updateById(gameId, {
        $push: {movement: makeMovement(type, sideId, roleId, src, dst)},
        $set:  {board: board, updateTime: new Date()}
      });
    });
  }
};

module.exports = mGame;
