var request = require('superagent');
var x = require('../../common/utils');
var Eventer = require('../../common/event_emitter');

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
  }

  var timestamp = 0;
  var timer = setInterval(function () {
    request.get('/api/v1/game/' + opts.gameId + '/check?timestamp=' + timestamp)
           .then(function (obj) {
             var result = JSON.parse(obj.text);

             if (result.error_code !== 0) {
               throw new Error('error_code', data);
             }

             if (!result.data.expired)  return;

             if (result.data.coordinates && result.data.movements) {
               // emit board data to board_view
               player.emit('REMOTE_LOADED', {
                 coordinates: result.data.coordinates,
                 movements: result.data.movements
               })
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
  }, opts.checkInterval);

  var player = Eventer({
    prepareMove: function (data) {
      var lastMove = x.last(data.movements);

      if (!lastMove) {
        throw new Error('Remote Player: movements should not be empty')
      }

      if (!data.coordinates) {
        throw new Error('Remote Player: coordinates required');
      }

      request.post('/api/v1/game/' + opts.gameId + '/move')
             .type('form')
             .send(Object.assign({
               coordinates: JSON.stringify(data.coordinates)
             }, lastMove))
             .then(
               function (data) { console.log(data) },
               function (err)  { console.log(err.stack) }
             );
    },
    wait: function () {

    },
    destroy: function () {
      if (timer)  clearInterval(timer);
    }
  });

  return player;
};

module.exports = remotePlayer;
