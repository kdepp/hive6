var io = require('socket.io-client');

var request = require('superagent');
var x = require('../../common/utils');
var Eventer = require('../../common/event_emitter');

var checkWebSocket = function () {
  return 'WebSocket' in window;
};

var useWebSocket = function (gameId, callback) {
  var socket = io('http://localhost:3000');
  var onLoad = x.partial(function (isInitial, data) {
    if (data.coordinates && data.movements) {
      // emit board data to board_view
      callback && callback({
        coordinates: data.coordinates,
        movements: data.movements
      });
    }
  });

  socket.on('UPDATED', onLoad(false));
  socket.on('LOADED', onLoad(true));
  socket.on('connect', function () {
    socket.emit('JOIN', gameId);
  });

  return {
    post: function (gameId, lastMove, coordinates) {
      if (!socket) {
        throw new Error('Failed to post msg. WebSocket is already closed.')
      }

      socket.emit('NEW_MOVE', Object.assign({
        gameId: gameId,
        coordinates: JSON.stringify(coordinates)
      }, lastMove));
    },
    win: function (gameId, sideId) {
      if (!socket) {
        throw new Error('Failed to post msg. WebSocket is already closed.')
      }

      socket.emit('WIN', {
        gameId: gameId,
        sideId: sideId
      });
    },
    destroy: function () {
      // socket.close();
    }
  };
};

var connect = function (opts) {
  // use websocket
  return useWebSocket(opts.gameId, opts.onUpdate);
};

var remotePlayer = function (options) {
  var opts = Object.assign({
    chair: null,
    gameId: null,
    sideId: null,
    checkInterval: 5000
  }, options);

  var initialMovementCount;

  if (!opts.chair) {
    throw new Error('Remote Player: chair is required');
  }

  if (!opts.gameId) {
    throw new Error('Remote Player: gameId is required');
  };

  var player = Eventer({
    prepareMove: function (data) {
      var lastMove = x.last(data.movements);

      if (data.movements.length === initialMovementCount) {
        return;
      }

      if (!lastMove) {
        throw new Error('Remote Player: movements should not be empty')
      }

      if (!data.coordinates) {
        throw new Error('Remote Player: coordinates required');
      }

      connection.post(opts.gameId, lastMove, data.coordinates);
    },
    wait: function () {

    },
    gameOver: function (sideId) {
      if (sideId === opts.sideId) {
        debugger
        connection.win(opts.gameId, opts.sideId);
      }
    },
    destroy: function () {
      connection.destroy();
    }
  });

  var connection = connect(Object.assign({
    onUpdate: function (data) {
      if (initialMovementCount === undefined) {
        initialMovementCount = data.movements.length;
      }

      player.emit('REMOTE_LOADED', data);
    },
    socketCallback: function () {

    }
  }, opts));

  return player;
};

module.exports = remotePlayer;
