module.exports = {
  setStyle: function ($dom, style) {
    Object.keys(style).forEach(function (key) {
      $dom.style[key] = style[key];
    });
  },

  getStyle: function (dom, styleName) {
    if (!dom)   throw new Error('getStyle: dom not exist');
    return getComputedStyle(dom)[styleName];
  },

  mousePosition: function (dom, ev) {
    var rect = dom.getBoundingClientRect();
    return [
      ev.clientX - rect.left,
      ev.clientY - rect.top
    ];
  }
}
