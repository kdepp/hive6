var webRouter = require('./web');
var apiRouter = require('./api');

module.exports = [].concat(webRouter, apiRouter);
