var x = require('./utils');
var CC = require('../constant/coordinate');

var sign = function (a) {
  return a === 0 ? 0 : (a > 0 ? 1 : -1);
};

// Note: use hash table to remove duplicates for performance
var uniquePoints = function (points) {
  var result = [];
  var dict = {};
  var hash = function (point) { return x.flatten(point).join('-'); };

  points.forEach(function (point) {
    var key = hash(point);
    if (!dict[key]) {
      dict[key] = true;
      result.push(point);
    }
  });

  return result;
};

var ns3 = {
  addPoint: x.zipWith2(x.zipWith2(x.add)),

  negPoint: x.map(x.map(x.multi(-1))),

  samePoint: x.partial(function (p1, p2) {
    return x.and(x.zipWith2(function (xs, ys) {
      return x.and(x.zipWith2(x.equal, xs, ys))
    }, p1, p2));
  }),

  uniquePoints: uniquePoints
};

var d2 = {
  addPoint: x.zipWith2(x.add),

  negPoint: x.map(x.multi(-1)),

  uniquePoints: uniquePoints,

  /*
   * Test whether a point is in a hexagon
   */

  inHexagon: function (d2Center, radius, pos) {
    var lineFx = function (p1, p2) {
      var k = (p2[1] - p1[1]) / (p2[0] - p1[0]);

      if (Math.abs(k) === Infinity) return p2[0];

      var x1 = p1[0];
      var y1 = p1[1];

      return function (x) {
        return k * x + (y1 - k * x1);
      };
    };

    var test = x.partial(function (point, fx, predicate) {
      if (typeof fx === 'number')  return predicate === sign(point[0] - fx);
      return predicate === sign(point[1] - fx(point[0]));
    });

    var adjusted = x.compose(
      d2.negPoint,
      x.map(x.multi(2 / radius)),
      d2.addPoint(d2.negPoint(d2Center))
    )(pos);

    var d2HexagonPoints = x.map(convert.ns3ToD2, CC.NS3_UNIT_HEXAGON_POINTS);
    var fxs = x.zipWith(
      lineFx,
      x.loop(d2HexagonPoints, 1),
      d2HexagonPoints
    );
    var predicates = [-1, -1, -1, 1, 1, 1];
    var result = x.zipWith(test(adjusted), fxs, predicates);

    return x.and(result);
  }
};

/*
 * 3 Dimension Hexagon Axis Functions
 * eg. [x, y, z]
 *
 *       X  --------  -Z
 *         /        \
 *    -Y  /          \  Y
 *        \          /
 *         \        /
 *       Z  --------  -X
 *
 */

var d3 = {
  addPoint: x.zipWith2(x.add),

  negPoint: x.map(x.multi(-1)),

  samePoint: x.partial(function (p1, p2) {
    if (!p1 || !p2) return false;
    return x.and(x.zipWith2(x.equal, p1, p2));
  }),

  uniquePoints: uniquePoints,

  around: function (triple) {
    return x.permute([-1, 0, 1]).map(x.zipWith2(x.add, triple));
  },

  setPoint: function (data, triple, value) {
    var entry = data;

    triple.forEach(function (index, i) {
      if (i < 2) {
        entry[index] = entry[index] || {};
        entry = entry[index];
      } else {
        // sort by zIndex
        entry[index] = entry[index] ? entry[index].concat([value]) : [value];
        entry[index] = entry[index].sort(function (a, b) {
          return b.zIndex - a.zIndex;
        });
      }
    });
  },

  getPoint: x.partial(function (data, triple) {
    if (!triple)  return null;

    var ret = triple.reduce(function (prev, cur) {
      return prev && prev[cur];
    }, data);

    // return the topmost element;
    return ret && ret[0];
  })
};

var convert = {
  ns3ToD2: function (point) {
    return x.map(function (z) {
      return z[0] + z[1] * Math.sqrt(3);
    }, point);
  },

  ns3ToD3: function (point2d) {
    var x = point2d[0][0];
    var y = point2d[1][1];
    return [
      (x / 3 + y) / (-2),
      x / 3,
      (y - x / 3) / 2
    ];
  },

  d3ToNs3: function (point3d) {
    var x = point3d[0];
    var y = point3d[1];
    // var z = point3d[2];

    return [[3 * y, 0], [0, -2 * x - y]];
  },

  ns3InfoListToD3: function (points, pinfos) {
    var ret = {};
    points.forEach(function (point, i) {
      d3.setPoint(ret, point, pinfos[i]);
    });
    return ret;
  }
};

module.exports = {
  ns3: ns3,
  d3: d3,
  d2: d2,
  convert: convert
};
