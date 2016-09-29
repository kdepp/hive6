var _EventEmitter = function (_target) {
  var target = _target || {};
  var events = {};

  var on = function (name, fn, once) {
    var removeFn = function (name, fnGetter) {
      return function () {
        if (!events[name])  return;
        var index = events[name].indexOf(fnGetter());
        events[name].splice(index, 1);
      };
    };
    var onceWrap = function (fn, remove) {
      return function () {
        var args = [].slice.apply(arguments);
        fn.apply(null, args);
        remove();
      };
    };

    var remove = removeFn(name, function () {
      return fn;
    });

    if (once) {
      fn = onceWrap(fn, remove);
    }

    events[name] = events[name] || [];
    events[name].push(fn);

    return remove;
  };

  var off = function (name) {
    events[name] = [];
  };

  var emit = function (name, ev) {
    if (!events[name])  return;
    events[name].forEach(function (fn) {
      fn(ev);
    });
  };

  return Object.assign(target, {
    on: function (name, fn) {
      return on(name, fn);
    },
    off: function (name) {
      return off(name);
    },
    once: function (name, fn) {
      return on(name, fn, true);
    },
    emit: function (name, ev) {
      return emit(name, ev);
    }
  });
};

module.exports = _EventEmitter;
