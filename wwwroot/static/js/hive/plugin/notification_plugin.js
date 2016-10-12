var x = require('../../common/utils');

var factory = function () {
  if (window.Notification && window.Notification.permission !== 'granted') {
    window.Notification.requestPermission();
  }

  return function (options) {
    if (!window.Notification) return;
    if (window.Notification.permission !== "granted") {
      window.Notification.requestPermission();
      return;
    }

    var opts = x.extend({
      title: '',
      body: '',
      icon: '/static/img/logo.png',
      closeInterval: 3000
    }, options);

    var notif = new window.Notification(opts.title, {
      body: opts.body,
      icon: opts.icon
    });

    notif.onshow = function () {
      setTimeout(function () {
        notif.close();
      }, opts.closeInterval);
    };

    notif.onclick = function () {
      window.focus();
      this.cancel();
    };
  };
};

module.exports = factory;
