var x  = require('../../../common/utils');
var pu = require('../../../common/point_utils');
var cu = require('../../../common/canvas_utils');
var CG = require('../../../constant/game');
var CC = require('../../../constant/coordinate');

var ROLE = CG.ROLE;
var SIDE = CG.SIDE;

var boardFactory = function (_opts) {
  var opts = Object.assign({
    dnd: null,
    game: null,
    samples: null,
    radius: 30,
    points: [[[0, 0], [0, 0]]],
    pinfos: [{ role: ROLE.BEE.ID, side: SIDE.ME.ID, zIndex: 1, links: []}]
  }, _opts);
  var radius = opts.radius;
  var origin = [[ctx.canvas.width / 2, 0], [ctx.canvas.height / 2, 0]];

  /*
   * Board Status
   */
  var points = relocate(opts.points);
  var pinfos = opts.pinfos;
  var d3Index = pu.convert.ns3InfoListToD3(points, pinfos);
  var availables = [];
  var isDragging = false;

  /*
   * Board Helper Functions
   */
  var transform = x.compose(
    pu.convert.ns3ToD2,
    pu.ns3.addPoint(origin),
    x.map(x.map(x.multi(radius * CC.RADIUS_FACTOR)))
  );

  var _init = function () {
    opts.dnd.addSource({
      $dom: opts.canvas,
      onDragStart: function (ev) {
        var found = points.find(function (point) {
          return pu.d2.inHexagon(transform(point), radius, [ev.localX, ev.localY]);
        });

        if (!found) return;
        var pinfo = pu.d3.getPoint(d3Index, pu.convert.ns3ToD3(found));
        var index = pinfos.findIndex(function (item) { return pinfo == item });

        if (!opts.game.check({
          sideId: pinfo.side,
          roleId: pinfo.role
        })) {
          return;
        }

        pinfo.isDragging = true;
        setTimeout(_render);

        return [
          opts.samples[pinfo.side][pinfo.role],
          {
            sideId: pinfo.side,
            roleId: pinfo.role,
            from: 'board',
            originPos: points[index],
            boardIndex: index
          }
        ];
      },
      onDragEnd: function (ev) {
        pinfos[ev.dragging.type.boardIndex].isDragging = false;
        isDragging = false;
        setTimeout(_render);
      }
    });

    opts.dnd.addTarget({
      $dom: opts.canvas,
      onMove: function (ev) {
        if (!ev.dragging) return;
        if (isDragging) return;
        isDragging = true;

        var type = ev.dragging.type;
        var onSide = x.partial(function (sideId, item, i) {
          return pinfos[i].side === sideId;
        });

        if (type.boardIndex === undefined) {

          // Dragging from toolbar
          if (points.length === 0) {

            availables = [[0, 0, 0]].map(convertTo2d);

          } else if (points.filter(onSide(type.sideId)).length === 0) {

            availables = x.compose(pu.d3.uniquePoints, x.flatten)(
              points.map(pu.convert.ns3ToD3).map(pu.d3.around)
            ).map(pu.convert.d3ToNs3);

          } else {

            availables = x.compose(pu.d3.uniquePoints, x.flatten)(
              points.filter(onSide(type.sideId)).map(pu.convert.ns3ToD3).map(pu.d3.around)
            ).filter(function (coord) {
              if (!!pu.d3.getPoint(d3Index, coord)) return false;
              return ! pu.d3.around(coord).find(function (subCoord) {
                var pinfo = pu.d3.getPoint(d3Index, subCoord);
                return pinfo && pinfo.side === 1 - type.sideId;
              })
            }).map(pu.convert.d3ToNs3);

          }

        } else {

          // Dragging from board
          availables = movement(type.roleId, convertTo3d(type.originPos), d3Index);

        }

        _render();
      },
      onDragLeave: function (ev) {
        isDragging = false;
        _render();
      },
      onDrop: function (ev) {
        var destInfo;
        var found = availables.find(function (point) {
          return pu.d2.inHexagon(transform(point), radius, [ev.localX, ev.localY]);
        });

        isDragging = false;
        if (!found) {
          _render();
          return false;
        }

        if (!ev.dragging) return false;

        if (ev.dragging.type.boardIndex !== undefined) {

          points[ev.dragging.type.boardIndex] = found.slice();
          destInfo = pu.d3.getPoint(d3Index, pu.convert.ns3ToD3(found));

          pinfos[ev.dragging.type.boardIndex].zIndex = destInfo ? destInfo.zIndex + 1 : 1
          createD3Index(points, pinfos);
          _render();
          checkWin();

        } else {

          addOne(found, {
            zIndex: 1,
            role: ev.dragging.type.roleId,
            side: ev.dragging.type.sideId,
            links: []
          });

          if (ev.dragging.type.roleId === ROLE.BEE.ID) {
            opts.game[['whiteBeeOnBoard', 'blackBeeOnBoard'][ev.dragging.type.sideId]]();
          }
        }

        opts.game.next();
        return true;
      }
    });
  };

  var checkWin = function () {
    var beeIndex, isBeeSurrounded;

    [0, 1].forEach(function (sideId) {
      beeIndex = pinfos.findIndex(function (pinfo) {
        return pinfo.role === ROLE.BEE.ID && pinfo.side === sideId;
      });

      isBeeSurrounded = pu.d3.around(pu.convert.ns3ToD3(points[beeIndex])).filter(function (point) {
        return !pu.d3.getPoint(d3Index, point);
      }).length === 0;

      if (isBeeSurrounded) {
        opts.game.win(1 - sideId);
      }
    });
  };

  var _render = function () {
    cu.clearCanvas(optx.ctx);

    points.map(function (p, i) {
      return i;
    }).sort(function (a, b) {
      return pinfos[a].zIndex - pinfos[b].zIndex;
    }).forEach(function (i) {
      var point = points[i];
      var pinfo = pinfos[i];
      var side  = x.findValue(SIDE, 'ID', pinfo.side);
      var role  = x.findValue(ROLE, 'ID', pinfo.role);

      cu.marginHexagon(opts.ctx, {
        center: transform(point),
        radius: radius,
        margin: 1,
        fillStyle: pinfo.isDragging ? 'rgba(149, 145, 145, 0.5)' : side.COLOR,
        image: pinfo.isDragging ? null : x.sprintf(role.IMG, {side: side.ID ? 'op' : 'me'}),
        imageSize: role.IMGSIZE,
        text: i
      });
    });

    if (!isDragging)  return;

    availables.forEach(function (point) {
      cu.marginHexagon(opts.ctx, {
        center: transform(point),
        radius: radius,
        margin: 1,
        fillStyle: 'rgba(186, 250, 66, 0.5)'
      });
    });
  };

  var _relocate = function () {
    points = relocate(points);
    _render();
  };

  var wrap = function (fn, context) {
    return function () {
      return fn.apply(context, arguments) && _render();
    };
  };

  var addOne = wrap(function (point, pinfo) {
    var index = points.length;
    points.push(point);
    pinfos.push(pinfo);
    createD3Index(points, pinfos);
    return true;
  });

  var createD3Index = function (points, pinfos) {
    d3Index = pu.convert.ns3InfoListToD3(points, pinfos);
  };

  /*
   * instance returned
   */
  return {
    init: function () {
      _init();
      _render();
    },
    render: function () {
      _render();
    },
    relocate: function () {
      _relocate();
    },
    serialize: function () {
      // console.log(JSON.stringify(points));
    },
    onClick: function (pos) {
      /*
      var found = points.find(function (point) {
        return inHexagon(transform(point), radius, pos);
      });

      if (found) {
        removeOne(found);
      }

      return;

      var found = arounds.find(function (around) {
        return inHexagon(transform(around), radius, pos);
      });

      if (found)  {
        addOne(found, {
          side: Math.round((Math.random() * 100)) % Object.keys(SIDE).length,
          role: Math.round((Math.random() * 100)) % Object.keys(ROLE).length,
          zIndex: 1
        });
      }
      */
    }
  };
};

module.exports = boardFactory;
