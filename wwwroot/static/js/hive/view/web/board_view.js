var x  = require('../../../common/utils');
var pu = require('../../../common/point_utils');
var cu = require('../../../common/canvas_utils');
var du = require('../../../common/dom_utils');
var CG = require('../../../constant/game');
var CC = require('../../../constant/coordinate');
var Eventer = require('../../../common/event_emitter');

var ROLE = CG.ROLE;
var SIDE = CG.SIDE;

var boardFactory = function (_opts) {
  var opts = Object.assign({
    document: null,
    $container: null,
    dnd: null,
    samples: null,
    radius: 30,
    coordinates: null,
    canMove: null
  }, _opts);
  var radius = opts.radius;

  var origin        = null;
  var $canvas       = null;
  var ctx           = null;
  var humanSideIds  = [];
  var availables    = [];
  var coordinates   = null;

  var update = function (data, noRender) {
    coordinates = data.coordinates || [];
    if (!noRender)  _render();
  };

  update({ coordinates: opts.coordinates }, true);
  /*
   * Board Helper Functions
   */
  var transform = null;

  var _init = function () {
    var width  = parseInt(du.getStyle(opts.$container, 'width'), 10);
    var height = parseInt(du.getStyle(opts.$container, 'height'), 10);
    $canvas = opts.document.createElement('canvas');
    $canvas.width  = width;
    $canvas.height = height;
    du.setStyle($canvas, {
      width:  width + 'px',
      height: height + 'px'
    });
    ctx    = $canvas.getContext('2d');
    origin = [[width / 2, 0], [height / 2, 0]];
    opts.$container.appendChild($canvas);

    transform = x.compose(
      pu.convert.ns3ToD2,
      pu.ns3.addPoint(origin),
      x.map(x.map(x.multi(radius * CC.RADIUS_FACTOR))),
      pu.convert.d3ToNs3
    );

    opts.dnd.addSource({
      $dom: $canvas,
      onDragStart: function (ev) {
        var index = coordinates.findIndex(function (coord) {
          return pu.d2.inHexagon(transform(coord.point), radius, [ev.localX, ev.localY]);
        });
        var found = coordinates[index];

        if (!found) return false;
        if (!opts.canMove(found.sideId))  return false;

        vBoard.emit('START_MOVE_' + found.sideId, { src: found.point });
        found.isDragging = true;
        setTimeout(_render);

        return [
          opts.samples[found.sideId][found.roleId],
          {
            sideId: found.sideId,
            roleId: found.roleId,
            from: 'board',
            originPos: found.point,
            boardIndex: index
          }
        ];
      },
      onDragEnd: function (ev) {
        coordinates[ev.dragging.type.boardIndex].isDragging = false;
        setTimeout(_render);
      }
    });

    opts.dnd.addTarget({
      $dom: $canvas,
      onMove: function (ev) {
        /*
        if (!ev.dragging) return;
        if (isDragging) return;
        isDragging = true;

        var type = ev.dragging.type;
        var onSide = x.partial(function (sideId, item, i) {
          return coordinates[i].side === sideId;
        });

        if (type.boardIndex === undefined) {
          // Dragging from toolbar
          if (points.length === 0) {
            availables = [[0, 0, 0]].map(pu.convert.d3ToNs3);
          } else if (points.filter(onSide(type.sideId)).length === 0) {
            availables = x.compose(pu.d3.uniquePoints, x.flatten)(
              points.map(pu.convert.ns3ToD3).map(pu.d3.around)
            ).map(pu.convert.d3ToNs3);
          } else {
            availables = x.compose(pu.d3.uniquePoints, x.flatten)(
              points.filter(onSide(type.sideId)).map(pu.convert.ns3ToD3).map(pu.d3.around)
            ).filter(function (coord) {
              if (pu.d3.getPoint(d3Index, coord)) return false;
              return !pu.d3.around(coord).find(function (subCoord) {
                var pinfo = pu.d3.getPoint(d3Index, subCoord);
                return pinfo && pinfo.side === 1 - type.sideId;
              })
            }).map(pu.convert.d3ToNs3);
          }
        } else {
          // Dragging from board
          availables = movement(type.roleId, pu.convert.ns3ToD3(type.originPos), d3Index);
        }

        _render();
        */
      },
      onDragLeave: function (ev) {
        // isDragging = false;
        // _render();
      },
      onDrop: function (ev) {
        var dst = availables.find(function (point) {
          return pu.d2.inHexagon(transform(point), radius, [ev.localX, ev.localY]);
        });

        if (!dst) {
          _render();
          return false;
        }

        if (!ev.dragging) return false;
        if (humanSideIds.indexOf(ev.dragging.type.sideId) === -1) return false;

        if (ev.dragging.type.boardIndex !== undefined) {
          vBoard.emit('MOVE_' + ev.dragging.type.sideId, {
            src: ev.dragging.type.originPos,
            dst: dst
          });
        } else {
          vBoard.emit('PLACE_' + ev.dragging.type.sideId, {
            roleId: ev.dragging.type.roleId,
            dst: dst
          });
        }

        availables = [];
        setTimeout(_render);
        return true;
      }
    });
  };

  var _render = function () {
    cu.clearCanvas(ctx);

    coordinates.map(function (coord, i) {
      return i;
    }).sort(function (a, b) {
      return coordinates[a].zIndex - coordinates[b].zIndex;
    }).forEach(function (i) {
      var coord = coordinates[i];
      var side  = x.findValue(SIDE, 'ID', coord.sideId);
      var role  = x.findValue(ROLE, 'ID', coord.roleId);

      cu.marginHexagon(ctx, {
        center: transform(coord.point),
        radius: radius,
        margin: 1,
        marginStyle: '#2e3134',
        fillStyle: coord.isDragging ? 'rgba(149, 145, 145, 0.5)' : side.COLOR,
        image: coord.isDragging ? null : x.sprintf(role.IMG, {side: side.ID ? 'op' : 'me'}),
        imageSize: role.IMGSIZE,
        text: i
      });
    });

    availables.forEach(function (point) {
      cu.marginHexagon(ctx, {
        center: transform(point),
        radius: radius,
        margin: 1,
        fillStyle: 'rgba(186, 250, 66, 0.5)'
      });
    });
  };

  /*
   * instance returned
   */
  var vBoard = Eventer({
    init: function () {
      _init();
      _render();
    },
    render: function () {
      _render();
    },
    update: function (data) {
      return update(data);
    },
    setAvailables: function (list) {
      availables = list;
      _render();
    },
    addHumanControl: function (sideId) {
      humanSideIds.push(sideId);
    }
  });

  return vBoard;
};

module.exports = boardFactory;
