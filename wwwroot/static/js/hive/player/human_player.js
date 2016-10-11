var Eventer = require('../../common/event_emitter');
var x = require('../../common/utils');

var humanPlayer = function (options) {
  var opts = x.extend({
    chair: null
  }, options);

  if (!opts.chair) {
    throw new Error('Human Player: chair is required');
  }

  var player = Eventer({
    mayMove: function (src) {
      if (!opts.chair.canMove()) return;
      var availables = opts.chair.possibleMovement(src);
      player.emit('UPDATE_POSSIBLE_MOVE', {availables: availables});
    },
    mayPlace: function (roleId) {
      if (!opts.chair.canMove()) return;
      var availables = opts.chair.possiblePlacement(roleId);
      player.emit('UPDATE_POSSIBLE_MOVE', {availables: availables});
    },
    prepareMove: function () {
      // Human do nothing in prepareMove
    },
    wait: function () {
      // Human do nothing in wait
    },
    gameOver: function (sideId) {
      // Human do nothing in gameOver
    },
    move: function (src, dst) {
      if (!opts.chair.canMove()) return;
      return opts.chair.move(src, dst);
    },
    place: function (roleId, dst) {
      if (!opts.chair.canMove()) return;
      return opts.chair.place(roleId, dst);
    }
  });

  return player;
};

module.exports = humanPlayer;
