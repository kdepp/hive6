var x = require('../../common/utils');

var replayPlayer = function (options) {
  var opts = x.extend({
    chair: null
  }, options);

  if (!opts.chair) {
    throw new Error('Replay Player: chair is required');
  }

  return {
    prepareMove: function () {
      //
    },
    wait: function () {
      // Replay do nothing in wait
    },
    gameOver: function () {
      // Replay do nothing in gameOver
    },
    move: function (src, dst) {
      if (!opts.chair.canMove()) return;
      return opts.chair.move(src, dst);
    },
    place: function (roleId, dst) {
      if (!opts.chair.canMove()) return;
      return opts.chair.place(roleId, dst);
    }
  };
};

module.exports = replayPlayer;
