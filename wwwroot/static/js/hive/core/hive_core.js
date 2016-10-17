var Eventer = require('../../common/event_emitter');
var x = require('../../common/utils');
var pu = require('../../common/point_utils');
var m = require('./hive_movement');
var CG = require('../../constant/game');

var d3 = pu.d3;

var calcInventory = function (board, coordinates, extension) {
  var initial = x.repeat(2, [1, 3, 3, 2, 2, 1, 1, 1]);

  coordinates.forEach(function (c) {
    initial[c.sideId][c.roleId] --;

    if (initial[c.sideId][c.roleId] < 0) {
      throw new Error('calcInventory: inventory cannot be negative number');
    }
  });

  return initial;
};

var coreFactory = function (store, options) {
  var data = x.extend({
    movements: null,
    coordinates: null
  }, store);
  var opts = x.extend({
    extension: false
  }, options);
  var coordinates, board;

  var movements = data.movements || [];
  var inventories = [];
  var registered = [];
  var status = null;

  var setCoordinates = function (coords) {
    coordinates = coords || [];
    board = pu.convert.ns3InfoListToD3(
      x.pluck('point', coordinates),
      coordinates
    );
    status = coordinates.length > 0 ? CG.GAME_STATUS.IN_PROGRESS : CG.GAME_STATUS.INITIAL;
  };

  var checkWin = function () {
    var winners = [];

    [0, 1].forEach(function (sideId) {
      var bee = coordinates.find(function (coord) {
        return coord.roleId === CG.ROLE.BEE.ID && coord.sideId === sideId;
      });

      if (!bee) return;

      var isBeeSurrounded = pu.d3.around(bee.point).filter(function (point) {
        return !pu.d3.getPoint(board, point);
      }).length === 0;

      if (isBeeSurrounded)  winners.push(1 - sideId);
    });

    if (winners.length > 0) {
      status = CG.GAME_STATUS.OVER;
      notifyBoard('GAME_OVER', { winner: winners.length > 1 ? winners : winners[0] });
    }
  };

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

  var notify = function (sideId, isPlace) {
    notifyBoard('NEW_MOVEMENT', cloneData());
    notifyPlayer(sideId,     'TOGGLE_YOUR_TURN', x.extend({on: true},  cloneData()));
    notifyPlayer(1 - sideId, 'TOGGLE_YOUR_TURN', x.extend({on: false}, cloneData()));
    if (isPlace) {
      notifyPlayer(1 - sideId, 'INVENTORY_UPDATE', { inventory: inventories[1 - sideId] });
      notifyPlayer(sideId, 'INVENTORY_UPDATE', { inventory: inventories[sideId] });
    }
  };

  var reset = function (_coordinates, _movements) {
    movements = _movements || [];
    setCoordinates(_coordinates);
    checkWin();
    inventories = calcInventory(board, coordinates, opts.extension);

    var nextMoveSideId = movements.length === 0 ? 0 : (1 - x.last(movements).sideId);
    notify(nextMoveSideId, true);
  };

  var fns = {
    inventory: function (sideId) {
      return inventories[sideId];
    },
    canMove: function (sideId, point) {
      if ([CG.GAME_STATUS.IN_PROGRESS, CG.GAME_STATUS.INITIAL].indexOf(status) === -1)  return false;
      if (registered.length !== 2)  return false;
      if (stepCount() === 0)        return sideId === 0;

      var lastMove = x.last(movements);

      // if last move is pillbug special move and you are moving it again now
      if (lastMove.type === 2 && d3.samePoint(lastMove.dst, point)) {
        return false;
      }

      // Move next players chess, or move last players chess next to your own pillbug
      if (lastMove.sideId === 1 - sideId) {
        return true;
      } else {
        return (point && m.allowPillbugCarry(board, coordinates, movements, sideId, point));
      }
    },
    possiblePlacement: function (sideId, roleId) {
      if (!fns.canMove(sideId)) return null;
      return m.guessPlace(board, coordinates, movements, sideId, roleId);
    },
    possibleMovement: function (sideId, src) {
      if (!fns.canMove(sideId, src)) return null;
      var roleId = d3.getPoint(board, src).roleId;
      return m.guessMove(board, coordinates, movements, src, sideId, roleId);
    },
    place: function (sideId, roleId, dst) {
      if (!fns.canMove(sideId)) {
        throw new Error('CANNOT MOVE');
      }

      if (!m.checkPlace(board, sideId, dst)) {
        throw new Error('INVALID PLACEMENT');
      }

      if (inventories[sideId][roleId] <= 0) {
        throw new Error('OUT OF INVENTORY');
      }

      // modify board
      var info   = pu.d3.getPoint(board, dst);
      var zIndex = info ? (info.zIndex + 1) : 1;

      inventories[sideId][roleId]--;
      coordinates.push({
        sideId: sideId,
        roleId: roleId,
        zIndex: zIndex,
        point:  dst
      });
      setCoordinates(coordinates);

      // update movements
      movements.push({
        type: 0,
        sideId: sideId,
        roleId: roleId,
        src: null,
        dst: dst
      });

      notify(1 - sideId, true);
      checkWin();
    },
    move: function (sideId, src, dst) {
      if (!fns.canMove(sideId, src)) {
        throw new Error('CANNOT MOVE');
      }

      if (!m.checkMove(board, sideId, src, dst)) {
        throw new Error('INVALID MOVEMENT');
      }

      var isMovedByPillbug = m.isMovedByPillbug(board, coordinates, movements, src, dst);

      // modify board
      var info     = pu.d3.getPoint(board, dst);
      var zIndex   = info ? (info.zIndex + 1) : 1;
      var coord    = pu.d3.getPoint(board, src);

      coord.point  = dst;
      coord.zIndex = zIndex;
      setCoordinates(coordinates);

      // update movements
      var nextSideId = 1 - x.last(movements).sideId;

      movements.push({
        type: isMovedByPillbug ? 2 : 1,
        sideId: nextSideId,
        roleId: coord.roleId,
        src: src,
        dst: dst
      });

      notify(1 - nextSideId, false);
      checkWin();
    }
  };

  var core = Eventer({
    reset: reset,
    coordinates: function () {
      return x.deepClone(coordinates);
    },
    canMove: function (sideId, point) {
      return fns.canMove(sideId, point);
    },
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

  reset(data.coordinates, data.movements);
  return core;
};

module.exports = coreFactory;
