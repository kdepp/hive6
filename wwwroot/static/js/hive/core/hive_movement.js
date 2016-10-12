var x  = require('../../common/utils');
var pu = require('../../common/point_utils');
var CC = require('../../constant/coordinate');
var CG = require('../../constant/game');

var d3 = pu.d3;
var convert = pu.convert;
var ROLE = CG.ROLE;

var d3UnitCenterDistance = CC.NS3_UNIT_CENTER_OFFSETS.map(convert.ns3ToD3);

var aroundDirections = function (d3point, d3Index) {
  var isOccupied = function (point) {
    return !!d3.getPoint(d3Index, point);
  };

  return d3.around(d3point)
          .filter(isOccupied)
          .map(d3.addPoint(d3.negPoint(d3point)));
};

var brokenAroundDirectionCombinations = function (d3point, d3Index) {
  var existedDirectionIndexes = aroundDirections(d3point, d3Index)
                                .map(function (direction) {
                                  return d3UnitCenterDistance.findIndex(function (d) {
                                    return d3.samePoint(direction, d);
                                  });
                                })
                                .sort();

  console.log('aroundDirection in broken', aroundDirections(d3point, d3Index));
  console.log('d3Unit', d3UnitCenterDistance);

  var grouped = existedDirectionIndexes.reduce(function (prev, cur) {
    var lastGroup  = prev[prev.length - 1];
    var firstGroup = prev[0];
    var last       = lastGroup && lastGroup[lastGroup.length - 1];
    var first      = firstGroup && firstGroup[0];

    console.log('first, last', first, last);
    if (lastGroup === undefined) return [[cur]];
    if (last  === cur - 1) {
      lastGroup.push(cur);
      return prev;
    }

    if (first === (cur + 1) % d3UnitCenterDistance.length) {
      firstGroup.push(cur);
      return prev;
    }

    return prev.concat([[cur]]);
  }, []);

  console.log('grouped', grouped);

  grouped = x.pluck(0, grouped);

  return x.combination2(
    grouped.map(function (index) { return d3UnitCenterDistance[index] })
  );
};

var brokenAroundPointCombinations = function (d3point, d3Index) {
  var result = brokenAroundDirectionCombinations(d3point, d3Index);
  return !result.length ? [] : x.map(x.map(d3.addPoint(d3point)))(result);
};

var filterKeepOneHive = x.time('filterKeepOneHive', function (d3Index, d3origin, availables) {
  console.log('!!!!!!!!!!!! filterKeepOneHive !!!!!!!!!!');
  console.log('availables, ', availables);
  var __d3GetPoint = function (data, triple, level) {
    if (!triple)  return null;

    var ret = triple.reduce(function (prev, cur) {
      return prev && prev[cur];
    }, data);

    return ret && ret[level || 0];
  };

  // pretend that the movement is complete
  var _d3GetPoint = function (d3Index, d3point, d3target) {
    if (d3.samePoint(d3point, d3target)) return __d3GetPoint(d3Index, d3origin);
    if (d3.samePoint(d3point, d3origin)) return __d3GetPoint(d3Index, d3origin, 1);
    return __d3GetPoint(d3Index, d3point);
  };

  var isConnected = function (d3p1, d3p2, d3target) {
    var isOccupied = function (d3point) {
      return !!_d3GetPoint(d3Index, d3point, d3target);
    };
    var aroundOccupied = function (d3point) {
      return d3.around(d3point).filter(isOccupied);
    };

    var helper = function (current, target, visited) {
      // console.log('helper', arguments);
      if (d3.samePoint(current, target)) return true;
      visited.push(current);

      return x.or(aroundOccupied(current).filter(function (point) {
        return !visited.find(function (p) {
          return d3.samePoint(p, point);
        });
      }).map(function (point) {
        return helper(point, target, visited);
      }));
    };

    return helper(d3p1, d3p2, []);
  };

  var brokenCombinations = brokenAroundPointCombinations(d3origin, d3Index);
  if (brokenCombinations.length === 0)  return availables;

  var check = function (d3target) {
    return x.and(brokenCombinations.map(function (tuple) {
      console.log('????????????? in brokenCombinations loop ???????????');
      return isConnected(tuple[0], tuple[1], d3target);
    }));
  };

  if (check(null))  return availables;
  return availables.filter(check);
});

var directionBesides = function (direction) {
  var index = d3UnitCenterDistance.findIndex(d3.samePoint(direction));

  if (index === -1) {
    throw new Error('direction invalid', direction);
  }

  var len = d3UnitCenterDistance.length;
  var prevIndex = (index - 1 + len) % len;
  var nextIndex = (index + 1) % len;

  return [d3UnitCenterDistance[prevIndex], d3UnitCenterDistance[nextIndex]];
};

var walkOneStep = function (options) {
  var opts = options || {};
  console.log('walkOneStep', opts);

  return function (base, d3point, d3Index, options) {
    var neighbors = d3.around(d3point).filter(function (point) {
      return !!d3.getPoint(d3Index, point);
    });

    return d3.around(d3point).filter(function (point) {
      if (d3.getPoint(d3Index, point)) return false;

      var arounds = d3.around(point);
      var shareNeighbors = arounds.filter(function (subPoint) {
        if (d3.samePoint(subPoint, base))  return false;
        return neighbors.find(function (neighbor) {
          return d3.samePoint(subPoint, neighbor);
        });
      });

      if (shareNeighbors < 1) return false;
      if (opts.skipNarrow)    return true;

      // test narrow
      var direction  = d3.addPoint(point, d3.negPoint(d3point));
      var besides    = directionBesides(direction);
      var inNarrow   = x.compose(
        function (list) { return x.and(list); },
        x.map(
          x.compose(
            function (info) { return !!info },
            d3.getPoint(d3Index),
            // should not count basePoint as a narrow boundary
            function (point) { return d3.samePoint(base, point) ? null : point },
            d3.addPoint(d3point)
          )
        )
      )(besides);

      return !inNarrow;
    });
  };
};

var climbOneStep = function () {
  return function (base, d3point, d3Index) {
    return d3.around(d3point).filter(function (point) {
      if (d3.samePoint(point, base)) return false;
      return !!d3.getPoint(d3Index, point);
    });
  };
};

var guess = function (oneStep, d3point, d3Index, options) {
  var opts = x.extend({
    step: 1
  }, options);
  var helper = function (oneStep, base, d3point, d3Index, step, result) {
    if (step === 0) return result;

    var list = oneStep(base, d3point, d3Index).filter(function (point) {
      return !result.find(function (item) {
        return item.list.find(function (found) {
          return d3.samePoint(found, point);
        });
      })
    });

    if (list.length === 0)  return result;
    result = result.concat([{left: step - 1, list: list}]);

    list.forEach(function (point) {
      result = helper(oneStep, base, point, d3Index, step - 1, result);
    });

    return result;
  };

  var ret = helper(oneStep, d3point, d3point, d3Index, opts.step, []);
  return ret;
};

var MOVEMENT = {
  WALK: function (opts, d3point, d3Index) {
    var result = guess(walkOneStep(), d3point, d3Index, opts);
    if (opts.exact) result = result.filter(function (item) { return item.left === 0; });
    return x.flatten(x.pluck('list', result));
  },
  JUMP: function (options, d3point, d3Index) {
    return d3UnitCenterDistance.map(function (forward) {
      var next = d3.addPoint(d3point, forward);
      var bank = null;

      while (d3.getPoint(d3Index, next)) {
        bank = next;
        next = d3.addPoint(next, forward);
      }

      return bank ? next : null;
    }).filter(function (item) { return item; });
  },
  CLIMB: function (options, d3point, d3Index) {
    var opts = x.extend({
      step: 1
    }, options);
    var pinfo = d3.getPoint(d3Index, d3point);
    console.log('climb zIndex', pinfo.zIndex, pinfo.role);

    var result1 = guess(climbOneStep(), d3point, d3Index, opts);
    var result2 = guess(walkOneStep({skipNarrow: pinfo.zIndex > 1}),  d3point, d3Index, opts);

    return [].concat(
      x.flatten(x.pluck('list', result1)),
      x.flatten(x.pluck('list', result2))
    );
  }
};

var beeMove = function (point, board) {
  return MOVEMENT.WALK({step: 1}, point, board);
};

var antMove = function (point, board) {
  return MOVEMENT.WALK({step: Infinity}, point, board);
};

var spiderMove = function (point, board) {
  return MOVEMENT.WALK({step: 3, exact: true}, point, board);
};

var grasshopperMove = function (point, board) {
  return MOVEMENT.JUMP({}, point, board);
};

var beetleMove = function (point, board) {
  return MOVEMENT.CLIMB({}, point, board);
};

var mosquitoMove = function (point, board) {
  var info = d3.getPoint(board, point);

  if (info.zIndex > 1)  return beetleMove(point, board);

  var rolesAround = d3.around(point)
  .filter(function (p) {
    return !!d3.getPoint(board, p);
  })
  .map(function (p) {
    return d3.getPoint(board, p).roleId;
  })
  .reduce(function (prev, cur) {
    if (prev.indexOf(cur) === -1) prev.push(cur);
    return prev;
  }, []);

  var result = x.compose(
    d3.uniquePoints,
    x.flatten,
    x.map(function (roleId) {
      return moveFnByRoleId(roleId, true)(point, board);
    })
  )(rolesAround);

  return result;
};

var moveFnByRoleId = function (roleId, isMimic) {
  switch (roleId) {
    case ROLE.BEE.ID:
      return beeMove;

    case ROLE.ANT.ID:
      return antMove;

    case ROLE.SPIDER.ID:
      return spiderMove;

    case ROLE.GRASSHOPPER.ID:
      return grasshopperMove;

    case ROLE.BEETLE.ID:
      return beetleMove;

    case ROLE.MOSQUITO.ID:
      return !isMimic ? mosquitoMove : function () { return [] };

    default:
      return beeMove;
  }
};

/*
 * Factory for Hive6 Controller
 */

var guessMove = function (board, coordinates, movements, point, sideId, roleId) {
  var hasBee = coordinates.find(function (coord) {
    return coord.sideId === sideId && coord.roleId === CG.ROLE.BEE.ID;
  });

  // No bee onboard, no movement allowed
  if (!hasBee)  return [];

  var result = moveFnByRoleId(roleId)(point, board);
  return filterKeepOneHive(board, point, result);
};

var guessPlace = function (coordinates, movements, sideId, roleId) {
  var onSide = x.partial(function (sideId, obj) {
    return obj.sideId === sideId;
  });
  var findCoord = function (point) {
    return coordinates.find(function (coord) {
      return pu.d3.samePoint(coord.point, point);
    });
  };
  var hasBee;

  // no chess on board
  if (movements.length === 0) {
    return roleId === CG.ROLE.BEE.ID ? [] : [[0, 0, 0]]
  }

  // no our side's chess on board
  if (movements.filter(onSide(sideId)).length === 0) {
    return roleId === CG.ROLE.BEE.ID ? [] : x.compose(
      pu.d3.uniquePoints,
      x.flatten,
      x.map(pu.d3.around),
      x.pluck('point')
    )(coordinates);
  }

  // must place bee onboard in 4 steps
  if ([6, 7].indexOf(movements.length) !== -1) {
    hasBee = coordinates.find(function (coord) {
      return coord.roleId === CG.ROLE.BEE.ID && coord.sideId === movements.length % 2;
    });

    if (!hasBee && roleId !== CG.ROLE.BEE.ID)  return [];
  }

  // normal cases
  return x.compose(
    x.filter(function (point) {
      return !pu.d3.around(point).find(function (sub) {
        var found = findCoord(sub);
        return found && found.sideId === 1 - sideId;
      });
    }),
    x.filter(function (point) { return !findCoord(point) }),
    pu.d3.uniquePoints,
    x.flatten,
    x.map(pu.d3.around),
    x.pluck('point'),
    x.filter(onSide(sideId))
  )(coordinates)
};

module.exports = {
  guessPlace: guessPlace,
  guessMove: guessMove,
  checkPlace: function () {
    return true;
  },
  checkMove: function () {
    return true;
  }
};
