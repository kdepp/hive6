var x  = require('../../../common/utils');
var pu = require('../../../common/point_utils');
var cu = require('../../../common/canvas_utils');
var du = require('../../../common/dom_utils');
var CG = require('../../../constant/game');
var Eventer = require('../../../common/event_emitter');

var ROLE = CG.ROLE;
var SIDE = CG.SIDE;

var toolbarFactory = function (options) {
  var opts = Object.assign({
    dnd: null,
    samples: null,
    $container: null,
    inventory: null,
    sideId: null
  }, options);
  var inventory = opts.inventory;
  var $canvas   = null;
  var ctx       = null;
  var playerCommonStyle = {
    position: 'absolute',
    top: '15px',
    width: '150px',
    height: '560px',
    border: '1px solid #ccc'
  };
  var playerConfig = { style: { left: '15px' }, title: '方方' };
  var offsetX = 30;
  var offsetY = 80;
  var radius = 30;
  var centers = inventory.map(function (c, index) {
    return [offsetX + radius, offsetY + 2 * radius * index];
  });

  var pos2roleId = function (x, y) {
    return centers.findIndex(function (center) {
      return pu.d2.inHexagon(center, radius, [x, y]);
    });
  };

  var _init = function () {
    $canvas = (function () {
      var $dom = document.createElement('canvas');
      du.setStyle($dom, Object.assign({}, playerCommonStyle, playerConfig.style));
      opts.$container.appendChild($dom);

      opts.dnd.addSource({
        $dom: $dom,
        onDragStart: function (ev) {
          if (!opts.canMove())  return null;

          var roleId = pos2roleId(ev.localX, ev.localY);
          if (roleId === -1) return null;
          if (inventory[roleId] <= 0) return null;

          vToolbar.emit('START_PLACE_' + opts.sideId, {roleId: roleId});

          return [
            opts.samples[opts.sideId][roleId],
            {
              sideId: opts.sideId,
              roleId: roleId,
              from: 'toolbar',
              originPos: null
            }
          ];
        },
        onDragEnd: function (ev) {
          // if (!ev.success || !ev.dragging) return;
          // opts.inventory[i][ev.dragging.type.roleId] --;
          // _renderPlayers();
        }
      });

      return $dom;
    })();

    ctx = $canvas.getContext('2d');
    _renderPlayer();
  };

  var _renderPlayer = function () {
    var reset;

    ctx.canvas.width  = parseInt(playerCommonStyle.width, 10);
    ctx.canvas.height = parseInt(playerCommonStyle.height, 10);

    var isYourTurn = opts.sideId === SIDE.ME.ID ||
                     opts.sideId === SIDE.OP.ID;

    du.setStyle(ctx.canvas, {
      backgroundColor: isYourTurn ? 'rgb(203, 249, 186)' : 'transparent'
    });

    // Render Title
    reset = cu.setContext(ctx, [
      ['font', '20px serif'],
      ['fillStyle', '#333']
    ]);

    ctx.fillText(playerConfig.title, 10, 30);
    reset();

    // Render Available Chess
    inventory.forEach(function (count, roleId) {
      var side = x.findValue(SIDE, 'ID', opts.sideId);
      var role = x.findValue(ROLE, 'ID', roleId);

      cu.marginHexagon(ctx, {
        center: centers[roleId],
        radius: radius,
        fillStyle: count > 0 ? side.COLOR : '#ccc',
        image: x.sprintf(role.IMG, {side: side.ID ? 'op' : 'me'}),
        imageSize: role.IMGSIZE
      });

      var reset = cu.setContext(ctx, [
        ['fillStyle', count > 0 ? '#f00' : '#ccc'],
        ['font', ' 20px bold']
      ]);

      ctx.fillText('x ' + count, centers[roleId][0] + radius + 20, centers[roleId][1] + 10);
      reset();
    });
  };

  var vToolbar = Eventer({
    init: function () {
      return _init();
    },
    setInventory: function (_inventory) {
      inventory = _inventory;
      _renderPlayer();
    }
  });

  return vToolbar;
};

module.exports = toolbarFactory;
