var utils = {
  setRouter: function (app, routes) {
    var checkMethod = function (method) {
      if (-1 === ['PUT', 'GET', 'HEAD', 'POST', 'DELETE'].indexOf(method.toUpperCase())) {
        throw new Error('Route method not allowed: ' + method);
      }
      return method.toLowerCase();
    };

    var checkUrl = function (url) {
      return url;
    };

    routes.forEach(function (route) {
      var method = checkMethod(route.method);
      var url = checkUrl(route.url);
      var args = Array.isArray(route.callback)
                  ? [url].concat(route.callback)
                  : [url, route.callback];

      app[method].apply(app, args);
    });
  },

  errText: function (errors, code) {
    var helper = function (errors, stack, code) {
      var keys = Object.keys(errors);
      var next = [];

      for (var i = 0, len = keys.length; i < len; i++) {
        if (typeof errors[keys[i]] === 'number') {
          if (errors[keys[i]] === code) return stack.concat([keys[i]]);
        } else {
          next.push(keys[i]);
        }
      }

      for (var i = 0, len = next.length; i < len; i++) {
        var ret = helper(errors[next[i]], stack.concat([next[i]]), code);
        if (ret !== null) return ret;
      }

      return null;
    };

    var ret = helper(errors, [], code);
    console.log('errText', ret);
    return ret && ret.join(' -> ');
  }
};

module.exports = utils;
