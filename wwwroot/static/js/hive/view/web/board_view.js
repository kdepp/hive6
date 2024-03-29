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
  var opts = x.extend({
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
  var lastMove      = null;

  var canvasWidth   = null;
  var canvasHeight  = null;

  var update = function (data, noRender) {
    coordinates = data.coordinates || [];
    lastMove    = data.movements[data.movements.length - 1];
    if (!noRender)  _adjustCanvasAndRender();
  };

  update({ coordinates: opts.coordinates, movements: [] }, true);
  /*
   * Board Helper Functions
   */
  var d3ToD2 = x.partial(function (origin, d3point) {
    return x.compose(
      pu.convert.ns3ToD2,
      pu.ns3.addPoint(origin),
      x.map(x.map(x.multi(radius * CC.RADIUS_FACTOR))),
      pu.convert.d3ToNs3
    )(d3point);
  });

  var transform = function (d3point) {
    return d3ToD2(origin, d3point);
  };

  var _init = function () {
    var width     = parseInt(du.getStyle(opts.$container, 'width'), 10);
    var height    = parseInt(du.getStyle(opts.$container, 'height'), 10);
    canvasWidth   = width;
    canvasHeight  = height;
    $canvas       = opts.document.createElement('canvas');
    $canvas.width  = width;
    $canvas.height = height;
    du.setStyle($canvas, {
      width:  width + 'px',
      height: height + 'px'
    });
    ctx    = $canvas.getContext('2d');
    origin = [[width / 2, 0], [height / 2, 0]];
    opts.$container.appendChild($canvas);

    opts.dnd.addSource({
      $dom: $canvas,
      onDragStart: function (ev) {
        var found = coordinates.sort(function (a, b) {
          return b.zIndex - a.zIndex;
        }).find(function (coord) {
          return pu.d2.inHexagon(transform(coord.point), radius, [ev.localX, ev.localY]);
        });
        var index = coordinates.findIndex(function (item) {
          return item === found;
        });

        if (!found) return false;
        if (!opts.canMove(found.sideId, found.point))  return false;

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
        vBoard.setAvailables([]);
      }
    });

    opts.dnd.addTarget({
      $dom: $canvas,
      onMove: function (ev) {
        //
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

        _adjustCanvasAndRender();
        vBoard.setAvailables([]);
        return true;
      }
    });
  };

  var _adjustCanvasAndRender = function () {
    var maxLeft   = Infinity;
    var maxTop    = Infinity;
    var maxRight  = -Infinity;
    var maxBtm    = -Infinity;

    if (!coordinates.length) {
      return _render();
    }

    coordinates.forEach(function (coordinate) {
      var d2point = d3ToD2([[0, 0], [0, 0]], coordinate.point);
      var x = d2point[0];
      var y = d2point[1];

      if (x < maxLeft)  maxLeft   = x;
      if (x > maxRight) maxRight  = x;
      if (y < maxTop)   maxTop    = y;
      if (y > maxBtm)   maxBtm    = y;
    });

    // max of left right
    // max of top bottom
    var maxLeftRight  = Math.max(Math.abs(maxLeft), Math.abs(maxRight));
    var maxTopBtm     = Math.max(Math.abs(maxTop),  Math.abs(maxBtm));

    // current width height
    var curWidth = canvasWidth;
    var curHeight = canvasHeight;

    // current scroll
    var curScrollLeft = opts.$container.scrollLeft;
    var curScrollTop  = opts.$container.scrollTop;

    // delta of width height
    var targetWidth   = Math.max(curWidth,  maxLeftRight * 2 * 1.6);
    var targetHeight  = Math.max(curHeight, maxTopBtm * 2 * 1.6);
    var deltaWidth    = targetWidth  - curWidth;
    var deltaHeight   = targetHeight - curHeight;

    console.log('deltaWidth, deltaHeight', deltaWidth, deltaHeight);
    if (deltaWidth <= 0 && deltaHeight <= 0)  {
      return _render();
    }

    // modify $canvas width height
    $canvas.width     = targetWidth;
    $canvas.height    = targetHeight;
    du.setStyle($canvas, {
      width: targetWidth + 'px',
      height: targetHeight + 'px'
    });
    canvasWidth   = targetWidth;
    canvasHeight  = targetHeight;

    // modify origin
    origin = [[targetWidth / 2, 0], [targetHeight / 2, 0]];

    // scroll in opts.$container
    opts.$container.scrollLeft = curScrollLeft + deltaWidth / 2;
    opts.$container.scrollTop  = curScrollTop  + deltaHeight / 2;

    _render();
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
      var sizeRatio = Math.pow(0.8, coord.zIndex - 1)
      var alphaRatio = Math.pow(0.6, coord.zIndex - 1)

      cu.marginHexagon(ctx, {
        center: transform(coord.point),
        radius: x.multi(sizeRatio)(radius),
        alpha: alphaRatio,
        margin: 1,
        marginStyle: '#2e3134',
        fillStyle: coord.isDragging ? 'rgba(149, 145, 145, 0.5)' : side.COLOR,
        image: coord.isDragging ? null : x.sprintf(role.IMG, {side: side.ID ? 'op' : 'me'}),
        imageSize: x.map(x.multi(sizeRatio))(role.IMGSIZE),
        text: i
      });
    });

    // draw lastMove;
    if (lastMove && (!availables || !availables.length)) {
      if (lastMove.type === 0) {
        cu.marginHexagon(ctx, {
          center: transform(lastMove.dst),
          radius: radius,
          margin: 3,
          marginStyle: '#ff0',
          fillStyle: 'transparent'
        });
      } else {
        cu.marginHexagon(ctx, {
          center: transform(lastMove.dst),
          radius: radius,
          margin: 3,
          marginStyle: '#0f0',
          fillStyle: 'transparent'
        });

        cu.marginHexagon(ctx, {
          center: transform(lastMove.src),
          radius: radius,
          margin: 3,
          marginStyle: '#f00',
          fillStyle: 'transparent'
        });
      }
    }

    // draw availables
    availables.forEach(function (point) {
      cu.marginHexagon(ctx, {
        center: transform(point),
        radius: radius,
        margin: 1,
        marginStyle: '#2e3134',
        fillStyle: 'rgba(186, 250, 66, 0.6)'
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
