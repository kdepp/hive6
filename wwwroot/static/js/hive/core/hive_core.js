var Eventer = require('../../common/event_emitter');
var x = require('../../common/utils');
var pu = require('../../common/point_utils');
var m = require('./hive_movement');

var d3 = pu.d3;

var calcInventory = function (board, coordinates, extension) {
  var initial = x.repeat(2, [1, 3, 3, 2, 2]);

  coordinates.forEach(function (c) {
    var info = d3.getPoint(board, c);
    initial[info.sideId][info.roleId] --;

    if (initial[info.sideId][info.roleId]) {
      throw new Error('calcInventory: inventory cannot be negative number');
    }
  });

  return initial;
};

var coreFactory = function (store, options) {
  var data = store || {};
  var opts = Object.assign({
    extension: false
  }, options);

  var board = data.board || [];
  var coordinates = data.coordinates || [];
  var movements = data.movements || [];
  var inventories = calcInventory(board, coordinates, opts.extension);
  var registered = [];

  var stepCount = function () {
    return movements.length;
  };

  var cloneData = function () {
    return {
      board: x.deepClone(board),
      coordinates: x.deepClone(coordinates),
      movements: x.deepClone(movements)
    };
  };

  var notifyBoard = function (name, data) {
    core.emit(name, data);
  };

  var notifyPlayer = function (sideId, name, data) {
    registered.forEach(function (side) {
      if (sideId !== side.sideId) return;
      side.emit(name, data);
    });
  };

  var notify = function (sideId) {
    notifyBoard('NEW_MOVEMENT', cloneData());
    notifyPlayer(sideId,     'TOGGLE_YOUR_TURN', Object.assign({on: true} , cloneData()));
    notifyPlayer(1 - sideId, 'TOGGLE_YOUR_TURN', Object.assign({on: false}, cloneData()));
  };

  var fns = {
    inventory: function (sideId) {
      return inventories[sideId];
    },
    canMove: function (sideId) {
      if (registered.length !== 2)  return false;
      if (stepCount() === 0)        return sideId === 0;
      return x.last(movements).sideId === 1 - sideId;
    },
    possiblePlacement: function (sideId) {
      if (!fns.canMove(sideId)) return null;
      return m.guessPlace(board, sideId);
    },
    possibleMovement: function (sideId, src) {
      if (!fns.canMove(sideId)) return null;
      var roleId = d3.getPoint(board, src).roleId;
      return m.guessMove(board, src, roleId);
    },
    place: function (sideId, roleId, dst) {
      if (!fns.canMove(sideId)) {
        throw new Error('CANNOT MOVE');
      }
      if (!m.checkPlace(board, sideId, dst)) {
        throw new Error('INVALID PLACEMENT');
      }

      // TODO: modify board
      notify(1 - sideId);
    },
    move: function (sideId, src, dst) {
      if (!fns.canMove(sideId)) {
        throw new Error('CANNOT MOVE');
      }
      if (!m.checkMove(board, sideId, src, dst)) {
        throw new Error('INVALID MOVEMENT');
      }

      // TODO: modify board
      notify(1 - sideId);
    }
  };

  var core = Eventer({
    register: function (sideId) {
      if (registered.find(function (item) { return item.sideId === sideId })) {
        throw new Error('Game Register: players already full');
      }

      if ([0, 1].indexOf(sideId) === -1) {
        throw new Error('Game Register: invalid sideId');
      }

      var obj = Object.keys(fns).reduce(function (prev, cur) {
        var fn = fns[cur];

        prev[cur] = fn.length > 1
                      ? x.partial(fn)(sideId)
                      : function () { return fn(sideId) };

        return prev;
      }, {});

      obj.sideId = sideId;
      obj = Eventer(obj);

      registered.push(obj);
      return obj;
    }
  });

  return core;
};

module.exports = coreFactory;
