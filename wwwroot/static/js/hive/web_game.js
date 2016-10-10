var coreFactory    = require('./core/hive_core');
var humanPlayer    = require('./player/human_player');
var remotePlayer   = require('./player/remote_player');
var boardFactory   = require('./view/web/board_view');
var toolbarFactory = require('./view/web/toolbar_view');
var sampleChesses  = require('./view/web/sample_chesses');

var x           = require('../common/utils');
var dnd         = require('../dnd/dnd_core');
var dndBackend  = require('../dnd/dnd_backend_mouse');

var CG = require('../constant/game');

var gameFactory = function (options) {
  var opts = Object.assign({
    document: null,
    $boardContainer: null,
    $toolbarContainers: [],
    playertypes: [CG.PLAYER_TYPE.HUMAN.ID, CG.PLAYER_TYPE.HUMAN.ID],
    gameId: null
  }, options);

  if (opts.playertypes.length !== 2) {
    throw new Error('Game Factory: must have two players');
  }

  if (!x.and(opts.playertypes.map(function (type) {
    return [0, 1, 2].indexOf(type) !== -1;
  }))) {
    throw new Error('Game Factory: invalid player type');
  }

  // initialize dnd
  var dndInstance = dnd({$container: opts.document.body});
  dndInstance.backend(dndBackend());

  // initialize core
  var core = coreFactory({
    coordinates: opts.coordinates
  }, {
    extension: false
  });

  // initialize board view
  var vBoard = boardFactory({
    document: opts.document,
    $container: opts.$boardContainer,
    dnd: dndInstance,
    game: null,
    samples: sampleChesses,
    radius: 30,
    coordinates: core.coordinates(),
    canMove: function (sideId) {
      return core.canMove(sideId);
    }
  });

  core.on('NEW_MOVEMENT', function (data) {
    vBoard.update(data);
  });

  core.on('GAME_OVER', function (data) {
    alert(JSON.stringify(data));
  })

  vBoard.init();

  // initialize players
  var participants  = [];
  var vToolbars     = [];

  opts.playertypes.map(function (type, sideId) {
    var chair = core.register(sideId);
    var vToolbar = toolbarFactory({
      document: opts.document,
      $container: opts.$toolbarContainers[sideId],
      dnd: dndInstance,
      samples: sampleChesses,
      sideId: sideId,
      inventory: chair.inventory(),
      isYourTurn: sideId === 0,
      canMove: function () {
        return chair.canMove();
      }
    });
    var player;

    if (type === CG.PLAYER_TYPE.HUMAN.ID) {
      player = humanPlayer({
        chair: chair,
        sideId: sideId
      });

      player.on('UPDATE_POSSIBLE_MOVE', function (data) {
        vBoard.setAvailables(data.availables);
      });
      vToolbar.on('END_PLACE', function () {
        vBoard.setAvailables([]);
      });
      vToolbar.on('START_PLACE_' + sideId, function (data) {
        player.mayPlace(data.roleId);
      });
      vBoard.on('START_MOVE_' + sideId, function (data) {
        player.mayMove(data.src);
      });
      vBoard.on('MOVE_' + sideId, function (data) {
        player.move(data.src, data.dst);
      });
      vBoard.on('PLACE_' + sideId, function (data) {
        player.place(data.roleId, data.dst);
      });
      vBoard.addHumanControl(sideId);
      vToolbar.addHumanControl(sideId);
    } else if (type === CG.PLAYER_TYPE.REMOTE.ID) {
      player = remotePlayer({
        chair: chair,
        gameId: opts.gameId
      });

      player.on('REMOTE_LOADED', function (data) {
        core.reset(data.coordinates, data.movements);
      });
    } else if (type === CG.PLAYER_TYPE.AI.ID) {
      player = null;
    }

    chair.on('TOGGLE_YOUR_TURN', function (data) {
      if (data.on) {
        player.prepareMove(data);
        vToolbars[sideId].enable();
      } else {
        player.wait(data);
        vToolbars[sideId].disable();
      }
    });

    chair.on('INVENTORY_UPDATE', function (data) {
      vToolbar.setInventory(data.inventory);
    });

    participants.push({
      player: player,
      chair: chair
    });

    vToolbars.push(vToolbar);

    vToolbar.init();
  });

  return {
    vBoard: vBoard,
    vToolbars: vToolbars,
    participants: participants,
    core: core
  };
};

module.exports = gameFactory;
