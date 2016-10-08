/* global WebSocket */

var request = require('superagent');
var x = require('../../common/utils');
var Eventer = require('../../common/event_emitter');

var checkWebSocket = function () {
  return 'WebSocket' in window;
};

var useWebSocket = function (gameId, callback) {
  var ws = new WebSocket('ws://localhost:3030/socketserver');

  ws.onmessage = function (ev) {
    var msg;

    try {
      msg = JSON.parse(ev.data);
    } catch (e) {
      console.log('useWebSocket: parse json data error');
      console.log(e.stack);
      return;
    }

    if (msg.type === 'NEW_MOVE') {
      if (msg.data.coordinates && msg.data.movements) {
        // emit board data to board_view
        callback && callback({
          coordinates: msg.data.coordinates,
          movements: msg.data.movements
        });
      }
    } else if (msg.type === 'GAME_OVER') {
      // do something when game over
    }
  };

  return {
    post: function (gameId, lastMove, coordinates) {
      // dosomething
      if (!ws) {
        throw new Error('Failed to post msg. WebSocket is already closed.')
      }

      ws.send(JSON.stringify({
        type: 'MOVE',
        data: Object.assign({
          coordinates: coordinates
        }, lastMove)
      }));
    },
    destroy: function () {
      ws.close();
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
    ret = useWebSocket();
  } else {
    // user http interval pull
    ret = httpIntervalPull(opts.gameId, opts.checkInterval, opts.pullCallback);
  }

  return ret;
};

var remotePlayer = function (options) {
  var opts = Object.assign({
    chair: null,
    gameId: null,
    checkInterval: 5000
  }, options);

  if (!opts.chair) {
    throw new Error('Remote Player: chair is required');
  }

  if (!opts.gameId) {
    throw new Error('Remote Player: gameId is required');
  };

  var player = Eventer({
    prepareMove: function (data) {
      var lastMove = x.last(data.movements);

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
    pullCallback: function (data) {
      player.emit('REMOTE_LOADED', data);
    },
    socketCallback: function () {

    }
  }, opts));

  return player;
};

module.exports = remotePlayer;
