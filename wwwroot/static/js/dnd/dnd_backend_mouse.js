var du = require('../common/dom_utils');

var dndBackendMouse = function () {
  // Note: Getter returns an array of triples, triples as [$dom, fn, fn], while fn is called with eventObject
  var sourceGetter, targetGetter;
  var onDragMove, onDragEnd;
  var $container;
  var unbind;

  var inDom = function ($top, $holder, $sub) {
    var $dom = $sub;

    while ($dom) {
      if ($dom === $holder)  return true;
      if ($sub === $top) return false;
      $dom = $dom.parentNode;
    }

    return false;
  };
  var onMouseDown = function (ev) {
    ev.preventDefault();

    var i, len, pos, $dom, onDragStart;
    var triples = sourceGetter && sourceGetter();

    if (!triples) return;

    for (i = 0, len = triples.length; i < len; i++) {
      $dom = triples[i][0];
      onDragStart = triples[i][1];

      if (inDom($container, $dom, ev.target)) {
        pos = du.mousePosition($dom, ev);
        ev.localX = pos[0];
        ev.localY = pos[1];
        onDragStart(ev);
        break;
      }
    }
  };
  var onMouseUp = function (ev) {
    ev.preventDefault();

    var i, len, pos, $dom, onDrop;
    var triples = targetGetter && targetGetter();

    if (!triples) return;

    for (i = 0, len = triples.length; i < len; i++) {
      $dom = triples[i][0];
      onDrop = triples[i][2];

      if (inDom($container, $dom, ev.target)) {
        pos = du.mousePosition($dom, ev);
        ev.localX = pos[0];
        ev.localY = pos[1];
        onDrop(ev);
        break;
      }
    }

    onDragEnd(ev);
  };
  var $lastOver = null;
  var onMouseMove = function (ev) {
    ev.preventDefault();

    var i, len, pos, $dom, onMove, onDragLeave, found;
    var triples = targetGetter && targetGetter();
    if (!triples) return;

    for (i = 0, len = triples.length; i < len; i++) {
      $dom = triples[i][0];
      onMove = triples[i][1];
      onDragLeave = triples[i][3];

      if (inDom($container, $dom, ev.target)) {
        pos = du.mousePosition($dom, ev);
        ev.localX = pos[0];
        ev.localY = pos[1];
        found = true;
        $lastOver = $dom;
        onMove(ev);
      } else if ($lastOver === $dom) {
        $lastOver = null;
        onDragLeave && onDragLeave(ev);
      }
    }

    if (found)  return;
    onDragMove(ev);
  };

  return {
    bindEvent: function (_$container, _onDragMove, _onDragEnd, _sourceGetter, _targetGetter) {
      unbind && unbind();
      sourceGetter = _sourceGetter;
      targetGetter = _targetGetter;
      onDragMove = _onDragMove;
      onDragEnd  = _onDragEnd;
      $container = _$container;
      _$container.addEventListener('mousedown', onMouseDown);
      _$container.addEventListener('mouseup', onMouseUp);
      _$container.addEventListener('mousemove', onMouseMove);
      unbind = function () {
        _$container.removeEventListener('mousedown', onMouseDown);
        _$container.removeEventListener('mouseup', onMouseUp);
        _$container.removeEventListener('mousemove', onMouseMove);
      };
      return unbind;
    }
  };
};

module.exports = dndBackendMouse;
