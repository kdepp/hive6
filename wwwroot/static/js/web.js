/* global globalPlayerTypes globalGameId alert */

require('es6-shim');
require('./common/custom_modenizr');

var gameFactory = require('./hive/web_game');

if (!window.Modernizr.canvas || !window.Modernizr.websockets) {
  alert([
    '您的浏览器过时了，可以考虑使用以下浏览器访问昆虫棋网',
    '- Chrome 49+',
    '- Firefox 47+',
    '- Safari 9.1+',
    '- IE 11+'
  ].join('\n'));
}

window.initGame = function (opts) {
  gameFactory({
    document: document,
    $boardContainer: document.getElementById('canvas_container'),
    $replayContainer: document.getElementById('replay_container'),
    $toolbarContainers: [
      document.getElementById('bar1'),
      document.getElementById('bar2')
    ],
    playerTypes: opts.playerTypes,
    playerNames: opts.playerNames,
    gameId: opts.gameId
  });
};
