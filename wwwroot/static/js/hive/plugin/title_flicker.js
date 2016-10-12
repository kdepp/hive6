var x = require('../../common/utils');


var titleFlicker = function (options) {
  var opts = x.extend({
    document: null,
    defaultInterval: 1000,
    titles: []
  }, options);

  var timer = null;
  var oldTitle = opts.document.title;

  if (!opts.titles.length) {
    throw new Error('titleFlicker: titles is empty');
  }

  opts.titles.forEach(function (title) {
    if (typeof title !== 'string' && !Array.isArray(title)) {
      throw new Error('titleFlicker: a title object should be either an array or a string');
    }

    if (Array.isArray(title) && title.length !== 2) {
      throw new Error('titleFlicker: array-like title should have exactly two elements (title:string, period:number)');
    }
  });

  return function (isOn) {
    if (!isOn) {
      if (timer)  clearTimeout(timer)
      opts.document.title = oldTitle;
      return;
    }

    var index = 0;
    var run = function () {
      var title, period;

      if (!Array.isArray(opts.titles[index])) {
        title = opts.titles[index];
        period = opts.defaultInterval;
      } else {
        title = opts.titles[index][0];
        period = opts.titles[index][1];
      }

      index = (index + 1) % opts.titles.length;
      opts.document.title = title;
      timer = setTimeout(run, period);
    };

    run();

    return function () {
      if (timer)  clearTimeout(timer);
    };
  };
};

module.exports = titleFlicker;
