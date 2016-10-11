var Eventer = require('../../../common/event_emitter');
var x = require('../../../common/utils');

var replayFactory = function (options) {
  var opts = x.extend({
    document: null,
    $container: null
  }, options);

  var vReplay = Eventer({
    init: function () {
      // create dom
      var $next  = opts.document.createElement('div');
      var $reset = opts.document.createElement('div');

      $next.innerText   = 'Next';
      $reset.innerText  = 'Reset';
      $next.className   = 'replay-next';
      $reset.className  = 'replay-reset'

      opts.$container.appendChild($reset);
      opts.$container.appendChild($next);

      // bind events and emit event 'next' and 'reset'
      $next.addEventListener('click', function (ev) {
        vReplay.emit('next');
      });
      $reset.addEventListener('click', function (ev) {
        vReplay.emit('reset');
      });
    }
  });

  return vReplay;
}

module.exports = replayFactory;
