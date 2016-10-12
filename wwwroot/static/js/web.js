/* global globalPlayerTypes globalGameId */

require('es6-shim');
var gameFactory = require('./hive/web_game');

var game = gameFactory({
  document: document,
  $boardContainer: document.getElementById('canvas_container'),
  $replayContainer: document.getElementById('replay_container'),
  $toolbarContainers: [
    document.getElementById('bar1'),
    document.getElementById('bar2')
  ],
  playertypes: globalPlayerTypes,
  gameId: globalGameId
});

console.log(game);
