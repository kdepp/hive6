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
    destroy: function () {
      // socket.close();
    }
  };
};

var httpIntervalPull = function (gameId, interval, callback) {
  var timestamp = 0;
  var timer = setInterval(function () {
    request.get('/api/v1/game/' + gameId + '/check?timestamp=' + timestamp)
           .then(function (obj) {
             var result = JSON.parse(obj.text);

             if (result.error_code !== 0) {
               throw new Error('error_code', data);
             }

             if (!result.data.expired)  return;

             if (result.data.coordinates && result.data.movements) {
               // emit board data to board_view
               // player.emit('REMOTE_LOADED',
               callback && callback({
                 coordinates: result.data.coordinates,
                 movements: result.data.movements
               });
             }

             var data = result.data;
             var lastMove = x.last(data.movements);

             if (!lastMove || !lastMove.createTime) {
               throw new Error('no last move');
             }

             // update last movement timestamp
             timestamp = new Date(lastMove.createTime) * 1;
           })
           .catch(function (err) {
             console.log(err.stack);
           })
  }, interval);

  return {
    post: function (gameId, lastMove, coordinates) {
      return request.post('/api/v1/game/' + gameId + '/move')
        .type('form')
        .send(Object.assign({
          coordinates: JSON.stringify(coordinates)
        }, lastMove))
        .then(
          function (data) { console.log(data) },
          function (err)  { console.log(err.stack) }
        );
    },
    destroy: function () {
      clearInterval(timer);
    }
  };
};

var connect = function (opts) {
  var ret;

  if (checkWebSocket()) {
    // use websocket
    ret = useWebSocket(opts.gameId, opts.onUpdate);
  } else {
    // user http interval pull
    ret = httpIntervalPull(opts.gameId, opts.checkInterval, opts.onUpdate);
  }

  return ret;
};

var remotePlayer = function (options) {
  var opts = Object.assign({
    chair: null,
    gameId: null,
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
