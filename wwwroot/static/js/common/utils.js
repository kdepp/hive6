var partial = function (fn) {
  var len = fn.length;
  var arbitary;

  arbitary = function (curArgs, leftArgCnt) {
    return function () {
      var args = [].slice.apply(arguments);

      if (args.length >= leftArgCnt) {
        return fn.apply(null, curArgs.concat(args));
      }

      return arbitary(curArgs.concat(args), leftArgCnt - args.length);
    }
  };

  return arbitary([], len);
};

var x = {
  compose: function () {
    var fns = [].slice.apply(arguments);
    return fns.reduceRight(function (prev, cur) {
      return function (arg) {
        return cur(prev(arg));
      };
    })
  },

  partial: partial,

  last: function (list) {
    if (!list) {
      throw new Error('Last: not a list');
    }

    return list[list.length - 1];
  },

  map: partial(function (fn, list) {
    return list.map(fn);
  }),

  filter: partial(function (predicate, list) {
    return list.filter(predicate);
  }),

  zipWith: function (fn) {
    var lists = [].slice.call(arguments, 1);
    var len   = Math.min.apply(null, lists.map(function (list) { return list.length; }));
    var ret   = [];

    for (var i = 0; i < len; i++) {
      ret.push(fn.apply(null, lists.map(function (list) { return list[i]; })));
    }

    return ret;
  },

  zipWith2: partial(function (fn, list1, list2) {
    return x.zipWith(fn, list1, list2);
  }),

  pluck: partial(function (key, list) {
    return list.map(function (item) { return item[key]; });
  }),

  repeat: function (n, x) {
    var ret = [];
    var duplicate = function (item) {
      if (Array.isArray(item))  return item.slice();
      return item;
    };

    for (var i = 0; i < n; i++) {
      ret.push(duplicate(x));
    }
    return ret;
  },

  loop: function (list, count) {
    count = count || 1;
    return list.slice(count).concat(list.slice(0, count));
  },

  equal: function (x, y) {
    return x === y;
  },

  and: function (args) {
    return args.reduce(function (prev, cur) {
      return prev && cur;
    }, true);
  },

  or: function (args) {
    return args.reduce(function (prev, cur) {
      return prev || cur;
    }, false);
  },

  multi: partial(function (x, y) {
    return x * y;
  }),

  add: partial(function (x, y) {
    return x + y;
  }),

  flatten: function (list) {
    return [].concat.apply([], list);
  },

  time: function (comment, fn) {
    return function () {
      var args = [].slice.apply(arguments);
      var start, duration;

      start = new Date() * 1;
      var result = fn.apply(null, args);
      duration = new Date() * 1 - start;
      console.log(comment, duration, 'ms');
      return result;
    };
  },

  sprintf: function (str, data) {
    return Object.keys(data).reduce(function (prev, cur) {
      return prev.replace(new RegExp('\\$\\{' + cur + '\\}', 'g'), data[cur]);
    }, str);
  },

  maxBy: function (options) {
    var opts = Object.assign({
      compare: function (a, b) { return a < b; }
    }, options);

    return opts.list.reduce(function (prev, cur, i) {
      if (!opts.predicate(cur)) return prev;
      if (opts.compare(prev.ret, opts.getter(cur, i))) return {ret: cur, index: i};
      return prev;
    }, {ret: null, index: -1});
  },

  product: function () {
    var args = [].slice.apply(arguments);
    var promiseArray = function (item) {
      return Array.isArray(item) ? item : [item];
    };
    var flatten = function (list) {
      return [].concat.apply([], list);
    };

    return args.reduce(function (prev, cur) {
      return !prev ? cur : flatten(prev.map(function (item1) {
        return cur.map(function (item2) {
          return promiseArray(item1).concat(promiseArray(item2));
        });
      }));
    }, null);
  },

  permute: function (list) {
    var permutation = function (n) {
      var helper = function (n, seq, result) {
        if (seq.length >= n) {
          result.push(seq);
          return result;
        }

        for (var i = 0; i < n; i++) {
          if (seq.indexOf(i) === -1) {
            result = helper(n, seq.concat([i]), result);
          }
        }

        return result;
      };
      return helper(n, [], []);
    };

    return permutation(list.length).map(function (seq) {
      return seq.map(function (index) {
        return list[index];
      });
    });
  },

  // C (2, N)
  combination2: function (list) {
    var len = list.length;
    var ret = [];
    var i, j;

    for (i = 0; i < len - 1; i++) {
      for (j = i + 1; j < len; j++) {
        ret.push([list[i], list[j]]);
      }
    }

    return ret;
  },

  findValue: function (object, path, value) {
    var tokens = path.split('.');
    var follow = function (object, keys) {
      return  keys.reduce(function (prev, cur) {
        return prev && prev[cur];
      }, object);
    };

    return Object.keys(object).reduce(function (prev, cur) {
      return prev || (follow(object[cur], tokens) === value ? object[cur] : null);
    }, null);
  },

  deepClone: function (data) {
    // FIXME: should recursively parse data
    return JSON.parse(JSON.stringify(data));
  }
};

module.exports = x;
