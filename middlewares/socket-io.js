const socketIO = require('socket.io');

module.exports = {
  startSocketServer(server) {
    const io = socketIO(server, {
      cors: true,
      origin: '*:*',
    });

    const onlineUsers = [];

    io.on('connection', (socket) => {
      onlineUsers.push(socket);

      // Refresh on disconnect, connect and other stuff if necessary
      socket.on('refresh-signal', (refreshSignal) => {
        if (refreshSignal.refresh) {
          io.sockets.emit('refresh-response', { refresh: true });
        }
      });

      socket.on('disconnect', () => {
        const disconnectedUser = onlineUsers.indexOf(socket);
        onlineUsers.splice(disconnectedUser, 1);
      });
    });
  },
};
