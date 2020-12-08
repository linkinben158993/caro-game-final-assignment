const socketIO = require('socket.io');

module.exports = {
  startSocketServer(server) {
    const io = socketIO(server, {
      cors: true,
      origin: '*:*',
    });

    const activeSockets = [];
    const onlineUsers = [];

    console.log('Current active sockets:', activeSockets.length);
    console.log('Current online users:', onlineUsers.length);

    io.on('connection', (socket) => {
      if (activeSockets.map((id) => id.id).indexOf(socket.id) === -1) {
        activeSockets.push(socket);
      }

      console.log('Current active sockets after connect:', activeSockets.length);
      console.log('Current online users after connect:', onlineUsers.length);

      // Refresh on disconnect, connect and other stuff if necessary
      socket.on('refresh-signal', (refreshSignal) => {
        if (refreshSignal.refresh) {
          io.sockets.emit('refresh-response', { refresh: true });
        }
      });

      socket.on('client-login', (response) => {
        // On refresh onlineUsers may be duplicated
        if (onlineUsers.map((item) => item.email).indexOf(response.user.email) === -1) {
          onlineUsers.push({ email: response.user.email, fullName: response.user.fullName });
        }
        console.log('Current active sockets after client-login:', activeSockets.length);
        console.log('Current online users after client-login:', onlineUsers.length);

        socket.emit('online-users', onlineUsers);
      });

      socket.on('client-logout', (response) => {
        const logoutUser = onlineUsers.map((item) => item.email).indexOf(response.user.email);
        onlineUsers.splice(logoutUser, 1);
        console.log('Current active sockets after logout:', activeSockets.length);
        console.log('Current online users after logout:', onlineUsers.length);

        socket.emit('online-users', onlineUsers);
      });

      socket.on('disconnect', () => {
        const inactiveSockets = activeSockets.map((id) => id.id).indexOf(socket.id);
        activeSockets.splice(inactiveSockets, 1);
        console.log('Current active sockets after disconnect:', activeSockets.length);
        console.log('Current online users after disconnect:', onlineUsers.length);
      });
    });
  },
};
