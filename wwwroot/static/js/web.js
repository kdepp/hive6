var gameFactory = require('./hive/web_game');

var game = gameFactory({
  document: document,
  $boardContainer: document.getElementById('canvas_container'),
  $toolbarContainers: [
    document.getElementById('bar1'),
    document.getElementById('bar2')
  ]
});

console.log(game);
