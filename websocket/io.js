var SocketIO = require('socket.io');
var mGame = require('../models/game');
var u = require('../common/utils');

var io;
var init = function (options) {
  var opts = Object.assign({
    middlewares: []
  }, options);

  io = SocketIO(3000);

  opts.middlewares.forEach(function (mid) {
    io.use(function (socket, next) {
      mid(socket.request, socket.request.res, next);
    });
  });

  io.on('connection', function (socket) {
    console.log('a user connected');
    // console.log(socket.request.session);
    var userId = socket.request.session.passport.user;

    if (!userId)  return;

    socket.on('JOIN', function (gameId) {
      console.log(gameId);
      mGame.findById(gameId)
      .then(
        function (game) {
          socket.join(gameId);
          socket.emit('LOADED', game);
        },
        function (e) {
          console.log(u.errText(e));
        }
      );
    });

    socket.on('WIN', function (data) {
      mGame.end(data.gameId, data.sideId)
      .catch(function (e) {
        console.log(u.errText(e));
      });
    });

    socket.on('NEW_MOVE', function (data) {
      mGame.move(
        data.gameId, userId,
        data.type, data.sideId,
        data.roleId, data.src,
        data.dst, data.coordinates
      )
      .then(
        function () {
          return mGame.findById(data.gameId)
          .then(function (game) {
            console.log('to broadcast to room');
            socket.to(data.gameId).emit('UPDATED', game);
            console.log('SOCKETIO:NEW_MOVE done');
          }, function (e) {console.log(u.errText(e))});
        },
        function (e) {
          console.log(u.errText(e));
        }
      )
      .catch(function (e) {
        console.log(e);
      });
    });
  });
};

module.exports = init;
