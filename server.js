const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let users = {}; // { socket.id: username }
let sockets = {}; // { username: socket.id }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('set username', (username) => {
    users[socket.id] = username;
    sockets[username] = socket.id;
    io.emit('user list', Object.values(users));
  });

  // Pesan umum (semua pengguna)
  socket.on('chat message', (msg) => {
    const username = users[socket.id] || 'Anonim';
    io.emit('chat message', { user: username, text: msg });
  });

  // Pesan pribadi
  socket.on('private message', ({ to, msg }) => {
    const from = users[socket.id];
    const targetSocketId = sockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('private message', { from, msg });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const username = users[socket.id];
    delete users[socket.id];
    delete sockets[username];
    io.emit('user list', Object.values(users));
  });
});

http.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000');
});
