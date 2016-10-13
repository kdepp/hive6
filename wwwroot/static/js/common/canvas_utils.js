/* global Image */

var x = require('./utils');
var pu = require('./point_utils');
var CC = require('../constant/coordinate');
var CG = require('../constant/game');

var setContext = function (ctx, list) {
  var old = list.map(function (tuple) {
    return [tuple[0], ctx[tuple[0]]];
  });
  var change = function (ctx, list) {
    list.forEach(function (tuple) {
      ctx[tuple[0]] = tuple[1];
    });
  };

  change(ctx, list);
  return function () {
    change(ctx, old);
  };
};

var clearCanvas = function (ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

/*
 * Draw Hexagon on Canvas, based on a N(sqrt3) center point.
 */

var hexagon = function (ctx, pCenter, radius, isStroke) {
  var points = x.map(
    x.compose(
      pu.d2.addPoint(pCenter),
      pu.convert.ns3ToD2,
      x.map(x.map(x.multi(radius * CC.RADIUS_FACTOR)))
    ),
    CC.NS3_UNIT_HEXAGON_POINTS
  );

  ctx.beginPath();
  ctx.moveTo.apply(ctx, points[points.length - 1]);

  points.forEach(function (point) {
    ctx.lineTo.apply(ctx, point);
  });

  ctx.closePath();

  if (isStroke) {
    ctx.stroke()
  } else {
    ctx.fill();
  }
};

var imgUrl = function (imageName) {
  return '/static/img/pieces/' + imageName;
};

var calcRect = function (center, sideMax, size) {
  var ratio = sideMax / Math.max.apply(null, size);
  var tsize = x.map(x.multi(ratio), size);
  return {
    top: center[1] - tsize[1] / 2,
    left: center[0] - tsize[0] / 2,
    width: tsize[0],
    height: tsize[1]
  };
};

var drawChessImage = function (ctx, center, radius, image, size) {
  var sideMax = Math.sqrt(3) * radius * 0.7;
  var rect = calcRect(center, sideMax, size);
  var $img = ROLE_IMAGES[image];
  var draw = function () {
    ctx.drawImage($img, rect.left, rect.top, rect.width, rect.height);
  };

  if ($img.loaded) {
    draw();
  } else {
    $img.addEventListener('load', draw);
  }
};

var marginHexagon = function (ctx, options) {
  var opts = x.extend({
    fillStyle: '#666',
    marginStyle: 'rgb(255, 255, 255)',
    center: [100, 100],
    radius: 50,
    margin: 3,
    image: null,
    imageSize: null,
    alpha: 1
  }, options);

  var resetStyle = setContext(ctx, [
    ['fillStyle', opts.fillStyle],
    ['strokeStyle', opts.marginStyle],
    ['lineWidth', opts.margin],
    ['globalAlpha', opts.alpha]
  ]);

  hexagon(ctx, opts.center, opts.radius);
  hexagon(ctx, opts.center, opts.radius - Math.floor(opts.margin / 2 - 0.1), true);

  /*
  if (opts.text !== undefined) {
    resetFontStyle = setContext(ctx, [['fillStyle', '#000']]);
    console.log(opts.text,  opts.center[0], opts.center[1])
    ctx.fillText(opts.text, opts.center[0], opts.center[1]);
    resetFontStyle();
  }
  */

  if (opts.image && opts.imageSize) {
    drawChessImage(ctx, opts.center, opts.radius, opts.image, opts.imageSize);
  }

  resetStyle();
};

var ROLE_IMAGES = Object.keys(CG.ROLE).reduce(function (prev, cur) {
  ['me', 'op'].forEach(function (type) {
    var imageName = x.sprintf(CG.ROLE[cur].IMG, {side: type});
    var $img = new Image();

    $img.src = imgUrl(imageName);
    $img.addEventListener('load', function () { this.loaded = true; });
    prev[imageName] = $img;
  });
  return prev;
}, {});

module.exports = {
  setContext: setContext,
  marginHexagon: marginHexagon,
  clearCanvas: clearCanvas,
  imgUrl: imgUrl
};
