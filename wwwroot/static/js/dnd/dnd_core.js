var x = require('../common/utils');
var du = require('../common/dom_utils');

var dnd = function (opts) {
  var backend;
  var destroyBackend;
  var $inHand;
  var sources = [];
  var targets = [];
  var isDragging = false;
  var dragging = null;
  var sourceTuples;
  var targetTuples;

  var hook = function () {
    backend.bindEvent(opts.$container, onMove(null), onDragEnd(null), sourceGetter, targetGetter);
  };
  var sourceGetter = function (reset) {
    if (reset || !sourceTuples) {
      sourceTuples = sources.map(function (source) {
        return [source.$dom, onDragStart(source), onDragEnd(source)];
      });
    }
    return sourceTuples;
  };
  var targetGetter = function (reset) {
    if (reset || !targetTuples) {
      targetTuples = targets.map(function (target) {
        return [target.$dom, onMove(target), onDrop(target), onDragLeave(target)];
      });
    }
    return targetTuples;
  };
  var onDragStart = x.partial(function (source, ev) {
    var tuple, type, $tmp;

    tuple = source.onDragStart(ev);
    if (!tuple) return;

    $tmp = tuple[0];
    type = tuple[1];
    isDragging = true;

    dragging = {
      source: source,
      type: type
    };

    if ($tmp) {
      $inHand = $tmp;
      if ($inHand.parentNode.tagName.toLowerCase() !== 'body') {
        document.body.appendChild($inHand);
      }
    }
  });
  var onDragEnd = x.partial(function (source, ev) {
    var s = source || (dragging && dragging.source);

    if (!isDragging)  return;

    if ($inHand) {
      du.setStyle($inHand, {
        display: 'none'
      });
      $inHand = null;
    }

    s && s.onDragEnd(x.extend({success: false}, ev, {dragging: dragging}));

    isDragging = false;
    dragging = null;
  });
  var onMove = x.partial(function (target, ev) {
    var inHandWidth, inHandHeight;

    if ($inHand) {
      inHandWidth  = parseInt(du.getStyle($inHand, 'width'), 10);
      inHandHeight = parseInt(du.getStyle($inHand, 'height'), 10);
      du.setStyle($inHand, {
        position: 'fixed',
        zIndex: '9999',
        display: 'block',
        top: (ev.clientY - inHandWidth  / 2) + 'px',
        left: (ev.clientX - inHandHeight / 2) + 'px'
      });
    }

    if (!isDragging)  return;
    target && target.onMove(x.extend(ev, {dragging: dragging}));
  });
  var onDrop = x.partial(function (target, ev) {
    var success = target.onDrop(x.extend(ev, {dragging: dragging}));
    dragging && onDragEnd(dragging.source, x.extend(ev, {success: success}));
  });
  var onDragLeave = x.partial(function (target, ev) {
    target.onDragLeave(ev);
  });

  return {
    addSource: function (source) {
      sources.push(source);
      sourceGetter(true);
    },
    addTarget: function (target) {
      targets.push(target);
      targetGetter(true);
    },
    backend: function (_backend) {
      backend = _backend;
      destroyBackend && destroyBackend();
      destroyBackend = null;
      hook();
    }
  };
};

module.exports = dnd;
