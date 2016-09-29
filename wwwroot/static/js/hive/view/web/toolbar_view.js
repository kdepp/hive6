var x  = require('../../../common/utils');
var pu = require('../../../common/point_utils');
var cu = require('../../../common/canvas_utils');
var du = require('../../../common/dom_utils');
var CG = require('../../../constant/game');
var CC = require('../../../constant/coordinate');

var ROLE = CG.ROLE;
var SIDE = CG.SIDE;

var toolbarFactory = function (options) {
  var opts = Object.assign({
    dnd: null,
    game: null,
    samples: null,
    $container: document.body,
    inventory: x.repeat(2, [1, 3, 3, 2, 2,])
  }, options);
  var $status, $players;
  var playerCommonStyle = {
    position: 'absolute',
    top: '15px',
    width: '150px',
    height: '560px',
    border: '1px solid #ccc'
  };
  var playerConfigs = [
    { style: { left: '15px' }, title: '本方' },
    { style: { right: '15px'}, title: '对方' }
  ];
  var offsetX = 30;
  var offsetY = 80;
  var radius = 30;
  var centers = opts.inventory[0].map(function (c, index) {
    return [offsetX + radius, offsetY + 2 * radius * index];
  });

  var pos2roleId = function (x, y) {
    return centers.findIndex(function (center) {
      return pu.d2.inHexagon(center, radius, [x, y]);
    });
  };

  var _init = function () {
    $players = playerConfigs.map(function (config, i) {
      var $dom = document.createElement('canvas');
      du.setStyle($dom, Object.assign({}, playerCommonStyle, config.style));
      opts.$container.appendChild($dom);

      opts.dnd.addSource({
        $dom: $dom,
        onDragStart: function (ev) {
          var roleId = pos2roleId(ev.localX, ev.localY);
          if (roleId === -1) return null;

          if (!opts.game.check({
            sideId: i,
            roleId: roleId
          })) {
            return null;
          }

          if (opts.inventory[i][roleId] <= 0) return null;

          return [
            opts.samples[i][roleId],
            {
              sideId: i,
              roleId: roleId,
              from: 'toolbar',
              originPos: null
            }
          ];
        },
        onDragEnd: function (ev) {
          if (!ev.success || !ev.dragging) return;
          opts.inventory[i][ev.dragging.type.roleId] --;
          _renderPlayers();
        }
      });

      return $dom;
    });

    _renderPlayers();
  };

  var _renderPlayers = function () {
    $players.forEach(function (canvas, i) {
      _renderPlayer(canvas.getContext('2d'), i, playerConfigs[i], opts.inventory[i]);
    });
  };

  var _renderPlayer = function (ctx, sideId, config, inventory) {
    var reset;

    ctx.canvas.width  = parseInt(playerCommonStyle.width, 10);
    ctx.canvas.height = parseInt(playerCommonStyle.height, 10);

    var isYourTurn = sideId === SIDE.ME.ID && opts.game.whiteTurn()
                  || sideId === SIDE.OP.ID && opts.game.blackTurn();

    du.setStyle(ctx.canvas, {
      backgroundColor: isYourTurn ? 'rgb(203, 249, 186)' : 'transparent'
    });

    // Render Title
    reset = cu.setContext(ctx, [
      ['font', '20px serif'],
      ['fillStyle', '#333']
    ]);

    ctx.fillText(config.title, 10, 30);
    reset();

    // Render Available Chess
    inventory.forEach(function (count, roleId) {
      var side = x.findValue(SIDE, 'ID', sideId);
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

  opts.game.on('MOVE', _renderPlayers);

  return {
    init: function () {
      return _init();
    }
  }
};

module.exports = toolbarFactory;
