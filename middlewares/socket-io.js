const socketIO = require('socket.io');
const Matches = require('../models/mMatches');

module.exports = {
  startSocketServer(server) {
    const io = socketIO(server, {
      cors: true,
      origin: '*:*',
    });

    const activeSockets = [];
    const onlineUsers = [];
    const activeRooms = [];

    console.log('Current active sockets:', activeSockets.length);
    console.log('Current online users:', onlineUsers.length);

    io.on('connection', (socket) => {
      if (activeSockets.map((id) => id.id).indexOf(socket.id) === -1) {
        activeSockets.push(socket);
      }

      console.log('Current active sockets after connect:', activeSockets.length);
      console.log('Current online users after connect:', onlineUsers.length);

      socket.on('client-login', (response) => {
        // On refresh onlineUsers may be duplicated
        if (onlineUsers.map((item) => item.email).indexOf(response.user.email) === -1) {
          onlineUsers.push({ email: response.user.email, fullName: response.user.fullName });
        }
        console.log('Current active sockets after client-login:', activeSockets.length);
        console.log('Current online users after client-login:', onlineUsers.length);

        io.emit('online-users', onlineUsers);
      });

      socket.on('client-logout', (response) => {
        const logoutUser = onlineUsers.map((item) => item.email).indexOf(response.user.email);
        onlineUsers.splice(logoutUser, 1);
        console.log('Current active sockets after logout:', activeSockets.length);
        console.log('Current online users after logout:', onlineUsers.length);

        io.emit('online-users', onlineUsers);
      });

      socket.on('get-rooms', () => {
        socket.emit('rooms', activeRooms);
      });

      socket.on('create-room', (response) => {
        response.guests = [];
        activeRooms.push(response);
        socket.emit('created-room', response);

        // socket.join(response.roomId);
        console.log('Current active sockets after create-room:', activeSockets.length);
        console.log('Current online users after create-room:', onlineUsers.length);
        console.log('Current active rooms after create-room:', activeRooms.length);

        io.emit('active-rooms', activeRooms);
      });

      socket.on('joined', (response) => {
        const roomJoinedIndex = activeRooms.map((id) => id.roomId).indexOf(response.roomId);
        if (activeRooms[roomJoinedIndex].y === null) {
          activeRooms[roomJoinedIndex].y = {
            username: response.currentUser.user.email,
            fullName: response.currentUser.user.fullName,
          };
          const newMatch = new Matches({
            matchId: activeRooms[roomJoinedIndex].roomId,
            host: activeRooms[roomJoinedIndex].x.username,
            opponent: activeRooms[roomJoinedIndex].y.username,
            match: {
              moves: [],
            },
            chatLogs: [],
            // -1: Left room Left Room Close Browser, 0: Unfinished (), 1: Complete
            status: 0,
          });
          // newMatch.save().then(() => {
          //   io.emit('player-join-game', {
          //     roomId: response.roomId,
          //     roomDetails: activeRooms[roomJoinedIndex],
          //     // eslint-disable-next-line no-underscore-dangle
          //     matchId: newMatch._id,
          //   });
          // });
          io.emit('player-join-game', {
            roomId: response.roomId,
            roomDetails: activeRooms[roomJoinedIndex],
            // // eslint-disable-next-line no-underscore-dangle
            // matchId: newMatch._id,
          });
        } else {
          activeRooms[roomJoinedIndex].guests.push({
            username: response.currentUser.user.email,
            fullName: response.currentUser.user.fullName,
          });
          io.emit(`start-game-${response.roomId}`, activeRooms[roomJoinedIndex]);
        }
      });

      socket.on('request-start-game', (response) => {
        console.log(response);
        io.emit(`start-game-${response.roomId}`, response);
      });

      socket.on('client-make-move', (response) => {
        console.log(response);
        io.emit(`server-resp-move-${response.roomId}`, response);
      });

      socket.on('client-message', (response) => {
        console.log(response);
        io.emit(`server-response-message-${response.roomId}`, {
          username: response.username,
          message: response.message,
        });
      });

      socket.on('disconnect', () => {
        const inactiveSockets = activeSockets.map((id) => id.id).indexOf(socket.id);
        activeSockets.splice(inactiveSockets, 1);
        console.log('Current active sockets after disconnect:', activeSockets.length);
        console.log('Current online users after disconnect:', onlineUsers.length);
        console.log('Current active rooms after disconnect:', activeRooms.length);
      });
    });
  },
};
