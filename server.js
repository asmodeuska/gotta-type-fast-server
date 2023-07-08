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

});

app.get('/generate', async (req, res) => {
    res.send(paragraph( Math.floor(Math.random() * 5) + 1, { paragraphLowerBound: 3, paragraphUpperBound: 7 }));
});

server.listen(port, function () {
    console.log(`Listening on port ${port}`);
});
