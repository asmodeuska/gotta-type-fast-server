const rooms = [];
require('dotenv').config();
const io = require('socket.io')(3001,
    {
        cors: {
            origin: "*",
        }
    });
io.on("connection", (socket) => {
    socket.on("sendProgress", (progress) => {
        io.broadcast.emit("receiveProgress", progress);
    })
    socket.on("joinRoom", async (data) => {
        for(data.roomName in socket.rooms){
            if(socket.id !== room) 
                socket.leave(room);
        }
        if (data.roomName === "") {
            socket.emit("joinRoom", "Room name is required");
            return;
        }
        else {
            let room=rooms.find(room => room.name === data.roomName);
            if(room){
                if(!room.users.find(user => user.name === socket.name)){
                    room.users.push({id: socket.id, name: data.userName, ready: false, progress: 0, finishPlace: 0});
                }
                else {
                    socket.emit("error", "User already exists");
                }
                socket.join(data.roomName);
                io.to(data.roomName).emit("joinRoom", room.text, room.users);
            }
            else{
                rooms.push({users: [{id: socket.id, name: data.userName, ready: false, progress: 0, finishPlace: 0}], gameStarted: false, finishedPlayer:0, name: data.roomName, text: data.text});
                socket.join(data.roomName);
                room=rooms.find(room => room.name === data.roomName);
                io.to(data.roomName).emit("joinRoom", room.text, room.users);
            }

        }
    })

    socket.on("playerReady", (data) => {
        let room = rooms.find(room => room.name === data.roomName);
        if (room) {
            let user = room.users.find(user => user.id === socket.id);
            if (user) {
                user.ready = true;
                io.to(data.roomName).emit("playerReady", room.users);
            }
        }
    });

    socket.on("playerProgress", (data) => {
        let room = rooms.find(room => room.name === data.roomName);
        if (room) {
            let user = room.users.find(user => user.id === socket.id);
            if (user) {
                user.progress = data.progress;
                io.to(data.roomName).emit("playerProgress", room.users);
            }
        }
    })

    socket.on("startGame", (data) => {
        rooms[data.roomName].gameStarted = true;
        io.to(data.roomName).emit("startGame");
    })

    socket.on("gameFinished", data => {
        rooms[data.roomName].gameStarted = false;
        rooms[data.roomname].users.find(user => user.id === socket.id).finishPlace = ++rooms[data.roomName].finishedPlayer;
        io.to(data.roomName).emit("gameFinished", rooms[data.roomName].users);
    })

    socket.on("leaveRoom", (data) => {
        socket.leave(data.roomName);
    })
});

