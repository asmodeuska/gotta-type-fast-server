const rooms = [];
const users = [];
require('dotenv').config();
cors = require('cors');
const fetch = require('node-fetch');
const app = require('express')();
app.use(cors());

const { paragraph } = require('txtgen/dist/cjs/txtgen.js')

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});
const crypt = require('crypto');
const port = process.env.PORT || 3001;

io.on("connection", (socket) => {

    socket.on("joinRoom", (data) => {
      console.log(data);
      socket.join(data.roomName);
      socket.joinedRoom = data.roomName;
      socket.ready = false;
      socket.progress = 0;
      if (rooms[data.roomName]) {
        const existingPlayer = rooms[data.roomName].players.find(player => player.username === socket.username);
        if (!existingPlayer) {
          addPlayerToRoom(data.roomName, socket.username, socket.ready, socket.progress);
        }
        socket.emit("roomJoined", data.roomName, rooms[data.roomName].players, rooms[data.roomName].text);
        socket.to(data.roomName).emit("playerUpdated", rooms[data.roomName].players);
        return;
      }
      addPlayerToRoom(data.roomName, socket.username, socket.ready, socket.progress);
      rooms[data.roomName].text = generateParagraphs();
      socket.emit("roomJoined", data.roomName, rooms[data.roomName].players, rooms[data.roomName].text);
    });
  
    socket.on("leaveRoom", () => {
      if (!socket.joinedRoom) return;
      const tempRoomName = socket.joinedRoom;
      removePlayerFromRoom(socket.joinedRoom, socket.username);
      socket.leave(socket.joinedRoom);
      socket.joinedRoom = null;
      socket.ready = false;
      socket.progress = 0;
      socket.in(tempRoomName).emit("playerUpdated", rooms[tempRoomName]?.players || []);
      socket.emit("leaveRoom");
    });
  
    socket.on("ready", () => {
      if (!socket.joinedRoom) return;
      socket.ready = true;
      rooms[socket.joinedRoom]?.players.forEach(player => {
        if (player.username === socket.username) {
          player.ready = true;
        }
      });
      console.log(rooms[socket.joinedRoom]?.players);
      socket.in(socket.joinedRoom).emit("playerUpdated", rooms[socket.joinedRoom]?.players || []);
    });
  
    socket.on("progress", (data) => {
      if (!socket.joinedRoom) return;
      socket.progress = data;
      socket.in(socket.joinedRoom).emit("playerUpdated", rooms[socket.joinedRoom]?.players || []);
    });
  
    socket.on("saveUsername", (data) => {
      socket.userID = crypt.randomBytes(16).toString("hex");
      socket.username = data + '#' + socket.userID.slice(socket.userID.length - 4);
      users[socket.userID] = { username: socket.username, userID: socket.userID };
      socket.emit("userChecked", true, socket.username, socket.userID);
    });
  
    socket.on("checkUser", (data) => {
      if (users[data.userID] && users[data.userID].username === data.username) {
        socket.username = data.username;
        socket.userID = data.userID;
        socket.emit("userChecked", true, socket.username, socket.userID);
        return;
      }
      socket.emit("userChecked", false);
    });
  
    socket.on("disconnect", () => {
      if (socket.joinedRoom) {
        removePlayerFromRoom(socket.joinedRoom, socket.username);
        socket.in(socket.joinedRoom).emit("playerUpdated", rooms[socket.joinedRoom]?.players || []);
      }
    });
  
  });
  
  function generateParagraphs() {
    return paragraph(Math.floor(Math.random() * 4) + 1, { paragraphLowerBound: 3, paragraphUpperBound: 7 });
  }
  
  function addPlayerToRoom(roomName, username, ready, progress) {
    if (!rooms[roomName]) {
      rooms[roomName] = { players: [] };
    }
  
    rooms[roomName].players.push({
      username: username,
      ready: ready,
      progress: progress
    });
  }
  
  function removePlayerFromRoom(roomName, username) {
    if (!rooms[roomName]) return;
    rooms[roomName].players = rooms[roomName].players.filter(player => player.username !== username);
  }
  
  
  app.get('/generate', async (req, res) => {
    res.send(generateParagraphs());
  });
  
  server.listen(port, function () {
    console.log(`Listening on port ${port}`);
  });
  

