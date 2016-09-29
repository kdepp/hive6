var x  = require('../../../common/utils');
var du = require('../../../common/dom_utils');
var cu = require('../../../common/canvas_utils');
var CG = require('../../../constant/game');

var SIDE = CG.SIDE;
var ROLE = CG.ROLE;

var sampleChesses = x.product(Object.keys(SIDE), Object.keys(ROLE)).reduce(function (prev, tuple, i) {
  var CANVAS_WIDTH = 60;
  var CANVAS_HEIGHT = 60;
  var side = SIDE[tuple[0]];
  var role = ROLE[tuple[1]];

  var $canvas = document.createElement('canvas');
  var ctx = $canvas.getContext('2d');
  $canvas.width  = CANVAS_WIDTH;
  $canvas.height = CANVAS_HEIGHT;
  du.setStyle($canvas, {
    pointerEvents: 'none',
    position: 'absolute',
    display: 'none',
    top: '0',
    left: CANVAS_WIDTH * i + 'px',
    width: CANVAS_WIDTH + 'px',
    height: CANVAS_HEIGHT + 'px'
  });
  document.body.appendChild($canvas);

  cu.marginHexagon(ctx, {
    center: [CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2],
    radius: CANVAS_WIDTH / 2,
    fillStyle: side.COLOR,
    margin: 1,
    image: x.sprintf(role.IMG, {side: side.ID ? 'op' : 'me'}),
    imageSize: role.IMGSIZE
  });

  prev[side.ID][role.ID] = $canvas;
  return prev;
}, [new Array(Object.keys(ROLE).length), new Array(Object.keys(ROLE).length)]);

module.exports = sampleChesses;
