var request = require('superagent');

var lastGameId = null;
var instance = null;

var singleton = function (gameId) {
  if (instance && lastGameId === gameId) {
    return instance;
  }
  lastGameId = gameId;

  var players = [null, null];
  var movementIndex = -1;
  var movements = null;
  var promise = request.get('/api/v1/game/' + gameId + '/replay')
  .then(function (obj) {
    var result = JSON.parse(obj.text);

    if (result.error_code !== 0) {
      throw new Error('error_code', result);
    }

    if (result.data.coordinates && result.data.movements) {
      movements = result.data.movements;
    }
  });

  instance = {
    next: function () {
      return promise.then(function () {
        if (!players[0] || !players[1]) {
          throw new Error('Replay Players -> next: players not ready');
        }

        if (movementIndex >= movements.length - 1) {
          console.warn('Replay Players -> next: no more movements');
        }

        var movement = movements[++movementIndex];
        var player = players[movement.sideId];

        if (movement.type === 0) {
          player.place(movement.roleId, movement.dst);
        } else {
          // include type === 1 and type === 2 (moved by pillbug)
          player.move(movement.src, movement.dst);
        }
      });
    },
    reset: function () {
      movementIndex = -1;
    },
    setPlayer: function (sideId, player) {
      if (sideId < 0 || sideId > 1) {
        throw new Error('Replay Player -> setPlayer: invalid sideId');
      }

      players[sideId] = player;
    }
  };

  return instance;
};

module.exports = singleton;
