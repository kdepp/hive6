
var coreFactory    = require('./core/hive_core');
var humanPlayer    = require('./player/human_player');
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
    playertypes: [CG.PLAYER_TYPE.HUMAN.ID, CG.PLAYER_TYPE.HUMAN.ID]
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

  // initialize player toolbars
  var vToolbars = [0, 1].map(function (sideId, i) {
    var vToolbar = toolbarFactory({
      $container: opts.$toolbarContainers[i],
      dnd: dndInstance,
      samples: sampleChesses,
      canMove: function () {
        return core.canMove(sideId);
      }
    });

    return vToolbar;
  });

  // initialize players
  var participants = opts.playertypes.map(function (type, sideId) {
    var chair = core.register(sideId);
    var player;

    if (type === CG.PLAYER_TYPE.HUMAN.ID) {
      player = humanPlayer({
        prepare: function () {
          return;
        }
      });
      vBoard.addHumanControl(sideId);
      vBoard.on('START_MOVE_' + sideId, function (src) {
        player.mayMove(src);
      });
      vBoard.on('START_PLACE_' + sideId, function (roleId) {
        player.mayPlace(roleId);
      });
      vBoard.on('MOVE_' + sideId, function (src, dst) {
        player.move(src, dst);
      });
      vBoard.on('PLACE_' + sideId, function (roleId, dst) {
        player.place(roleId, dst);
      })
    } else if (type === CG.PLAYER_TYPE.REMOTE.ID) {
      player = null;
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

    return {
      player: player,
      chair: chair
    };
  });

  return {
    vBoard: vBoard,
    vToolbars: vToolbars,
    participants: participants,
    core: core
  };
};

module.exports = gameFactory;
