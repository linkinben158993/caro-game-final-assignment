const socketIO = require('socket.io');
const mongoose = require('mongoose');
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
    const newGameRoomId = [];

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
          const newMatchId = mongoose.Types.ObjectId();
          const newMatch = new Matches({
            host: activeRooms[roomJoinedIndex].x.username,
            opponent: activeRooms[roomJoinedIndex].y.username,
            roomId: response.roomId,
            match: [
              {
                _id: newMatchId,
                moves: [],
              },
            ],
            chatLogs: [],
            // -1: Left room Left Room Close Browser, 0: Unfinished (), 1: Complete
          });
          newMatch.save().then(() => {
            activeRooms[roomJoinedIndex].currentMatch = newMatchId;
            io.emit('player-join-game', {
              roomId: response.roomId,
              roomDetails: activeRooms[roomJoinedIndex],
              // eslint-disable-next-line no-underscore-dangle
              matchId: newMatchId,
            });
          });
        } else {
          activeRooms[roomJoinedIndex].guests.push({
            username: response.currentUser.user.email,
            fullName: response.currentUser.user.fullName,
          });
          io.emit(`start-game-${response.roomId}`, {
            roomId: response.roomId,
            roomDetails: activeRooms[roomJoinedIndex],
          });
        }
      });

      socket.on('request-start-game', (response) => {
        io.emit(`start-game-${response.roomId}`, response);
      });

      socket.on('client-make-move', (response) => {
        const roomMakeMove = activeRooms.map((id) => id.roomId).indexOf(response.roomId);
        console.log(activeRooms[roomMakeMove]);
        Matches.updateMoves(response.roomId, response.matchId, response.move, (err, document) => {
          if (err) {
            console.log(err);
            // console.log('Update Move Failed');
          } // Update Move Successful
        });

        io.emit(`server-resp-move-${response.roomId}`, response);
      });

      socket.on('client-message', (response) => {
        console.log(response);
        io.emit(`server-response-message-${response.roomId}`, {
          username: response.username,
          message: response.message,
        });
      });

      socket.on('end-game', (response) => {
        if (!response.myTurn) {
          // Find room and match that has ended and save results into database
          Matches.findOne(
            { roomId: response.roomId },
            { match: { $elemMatch: { _id: response.matchId } } }
          )
            .then((document) => {
              Matches.updateOne(
                {
                  _id: document._id,
                  'match._id': document.match[0]._id,
                },
                {
                  $set: {
                    'match.$.winner': response.currentUser.user.email,
                    'match.$.status': 1,
                  },
                },
                {
                  upsert: true,
                },
              )
                .then((res) => {
                  // console.log('Update Game Status Successfully');
                  // console.log(res);
                })
                .catch((err) => {
                  console.log(err);
                });
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });

      // This response contains roomId only
      socket.on('new-game', (response) => {
        const roomNewGameIndex = activeRooms.map((id) => id.roomId).indexOf(response);
        // If new game signal is emit by one person only
        if (newGameRoomId.map((id) => id.roomId).indexOf(response) === -1) {
          newGameRoomId.push({
            roomId: response,
          });
        } else {
          // If two people then remove from array for another new game event
          newGameRoomId.splice(newGameRoomId.map((id) => id.roomId).indexOf(response));
          Matches.findOne({ roomId: response })
            .then((document) => {
              const newMatchId = mongoose.Types.ObjectId();
              document.match.push({
                _id: newMatchId,
                moves: [],
              });
              document
                .save()
                .then(() => {
                  activeRooms[roomNewGameIndex].currentMatch = newMatchId;
                  activeRooms[roomNewGameIndex].moves = [];
                  io.emit('player-join-game', {
                    roomId: response,
                    roomDetails: activeRooms[roomNewGameIndex],
                    // eslint-disable-next-line no-underscore-dangle
                    matchId: newMatchId,
                  });
                })
                .catch((err) => {
                  console.log(err);
                });
            })
            .catch((err) => {
              console.log(err);
            });
        }
        console.log('New Game Room Id On New Game: ', newGameRoomId);
      });

      socket.on('exit-room', (response) => {
        const deleteRoom = activeRooms.map((id) => id.roomId).indexOf(response);
        activeRooms.splice(deleteRoom, 1);
        console.log('Current active sockets after exit room:', activeSockets.length);
        console.log('Current online users after exit room:', onlineUsers.length);
        console.log('Current active rooms after exit room:', activeRooms.length);
        io.emit('active-rooms', activeRooms);
        io.emit(`exit-room-${response}`);
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
