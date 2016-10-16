var x = require('kd-utils');
var ObjectID = require('mongodb').ObjectID;
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

  // for (var i = 0, len = pos.length; i < len; i++) {
  //   if (typeof pos[i] !== 'number')  return false;
  // }

  return true;
};

var makeGame = function (userId, sideId, extra) {
  return Object.assign({
    createTime: new Date(),
    updateTime: new Date(),
    players: sideId ? [null, userId] : [userId, null],
    movements: [],
    coordinates: [],
    owner: userId,
    password: '888888',
    status: 0,
    winner: null
  }, extra);
};

var makeMovement = function (type, sideId, roleId, src, dst) {
  var convertPosition = function (point) {
    if (!Array.isArray(point))  return null;
    return point.map(function (n) { return parseInt(n) });
  };

  return {
    type: type,
    sideId: sideId,
    roleId: roleId,
    src: convertPosition(src),
    dst: convertPosition(dst),
    createTime: new Date()
  };
};

var checkNextSide = function (sideId, movements) {
  return true;
};

var checkRoleCount = function (sideId, roleId, coordinates) {
  return true;
};

var checkMovement = function (oldCoordinates, coordinates, type, sideId, roleId, src, dst) {
  return true;
};

var checkWinnerSide = function (sideId, coordinates) {
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
  findByIdWithUserInfo: function (id) {
    return mGame.findById(id)
    .then(function (game) {
      var exist = function (a) { return !!a; };
      var userIds = game.players.filter(exist).map(ObjectID);

      return db.users.find({_id: {$in: userIds}})
      .then(function (users) {
        return Object.assign({}, game, {
          players: game.players.map(function (userId) {
            var found = users.find(function (user) { return user._id.toString() === userId });
            return found && {
              _id: found._id.toString(),
              username: found.username
            };
          })
        });
      });
    });
  },
  findByUserId: function (userId) {
    return db.games.find({players: userId.toString()}, {}, {sort: [['updateTime', 'desc']]})
    .then(function (games) {
      var userIds = x.deep_flatten(x.pluck('players', games)).map(ObjectID);

      if (userIds.length === 0) return [];

      return db.users.find({_id: {$in: userIds}})
      .then(function (users) {
        return games.map(function (game) {
          var opUserId = game.players.find(function (id) {
            return id !== userId;
          });
          var user = users.find(function (user) {
            return user._id.toString() === opUserId;
          });

          return Object.assign({
            gameResult: game.winner && game.winner.userId === userId ? 1 : -1,
            opponent: user && {
              username: user.username,
              _id: user._id.toString()
            }
          }, game);
        });
      });
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

      if (game.players && game.players.filter(id).length === 0) {
        throw ERROR.GAME.JOIN.NO_OPPONENT;
      }

      if (password !== game.password) {
        throw ERROR.GAME.JOIN.WRONG_PASSWORD;
      }

      var players = game.players;
      var index   = players.indexOf(null);

      players.splice(index, 1, userId);

      return db.games.updateById(gameId, {
        $set: {
          status: 1,
          players: players,
          updateTime: new Date()
        }
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

      if (!checkWinnerSide(winnerSideId, game.coordinates)) {
        throw ERROR.GAME.END.INVALID_WIN;
      }

      return db.games.updateById(gameId, {
        $set: {
          status: 2,
          winner: {
            sideId: winnerSideId,
            userId: game.players[winnerSideId]
          },
          updateTime: new Date()
        }
      });
    });
  },
  move: function (gameId, userId, type, sideId, roleId, src, dst, coordinates) {
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

    if ([0, 1, 2, 3, 4, 5, 6].indexOf(roleId) === -1) {
      return Promise.reject(ERROR.GAME.MOVE.INVALID_ROLE);
    }

    if (!checkPosition(dst)) {
      return Promise.reject(ERROR.GAME.MOVE.INVALID_DESTINATION_POSITION);
    }

    if (type === 1 && !checkPosition(src)) {
      return Promise.reject(ERROR.GAME.MOVE.INVALID_SOURCE_POSITION);
    }

    if (!coordinates) {
      return Promise.reject(ERROR.GAME.MOVE.BOARD_EMPTY);
    }

    try {
      coordinates = JSON.parse(coordinates);
    } catch (e) {
      return Promise.reject(ERROR.GAME.MOVE.BOARD_NOT_JSON);
    }

    return mGame.findById(gameId)
    .then(function (game) {
      if (game.players[sideId] !== userId) {
        throw ERROR.GAME.MOVE.USER_NOT_THE_PLAYER;
      }

      if (!checkNextSide(sideId, game.movements)) {
        throw ERROR.GAME.MOVE.NOT_YOUR_TURN;
      }

      if (type === 0 && !checkRoleCount(sideId, roleId, game.coordinates)) {
        throw ERROR.GAME.MOVE.INVALID_ROLE_COUNT;
      }

      if (!checkMovement(game.coordinates, coordinates, type, sideId, roleId, src, dst)) {
        throw ERROR.GAME.MOVE.INVALID_MOVEMENT;
      }

      return db.games.updateById(gameId, {
        $push: {movements: makeMovement(type, sideId, roleId, src, dst)},
        $set:  {coordinates: coordinates, updateTime: new Date()}
      });
    });
  },
  checkExpire: function (gameId, userId, timestamp) {
    if (!timestamp) {
      return Promise.reject(ERROR.GAME.CHECK.TIMESTAMP_EMPTY);
    }

    return mGame.findById(gameId)
    .then(function (game) {
      if (game.isPrivate && game.players.indexOf(userId) === -1) {
        throw ERROR.GAME.USER_UNAUTHORIZED;
      }

      var lastMove = game.movements[game.movements.length - 1];

      if (lastMove && lastMove.createTime > timestamp) {
        return Object.assign({expired: true}, game);
      }

      return {expired: false};
    });
  }
};

module.exports = mGame;
