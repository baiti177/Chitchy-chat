const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*", // izinkan akses dari semua domain (penting untuk Railway)
    methods: ["GET", "POST"]
  }
});
const path = require('path');

// Menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Menyimpan data user dan socket
let users = {};    // { socket.id: username }
let sockets = {};  // { username: socket.id }

// Ketika user terhubung
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User memilih username
  socket.on('set username', (username) => {
    users[socket.id] = username;
    sockets[username] = socket.id;
    io.emit('user list', Object.values(users)); // Kirim daftar user ke semua
    console.log(`${username} bergabung ke obrolan`);
  });

  // Pesan umum (semua pengguna)
  socket.on('chat message', (msg) => {
    const username = users[socket.id] || 'Anonim';
    io.emit('chat message', { user: username, text: msg });
  });

  // Pesan pribadi (hanya ke satu user)
  socket.on('private message', ({ to, msg }) => {
    const from = users[socket.id];
    const targetSocketId = sockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('private message', { from, msg });
      console.log(`Pesan pribadi dari ${from} ke ${to}: ${msg}`);
    }
  });

  // Ketika user keluar
  socket.on('disconnect', () => {
    const username = users[socket.id];
    console.log('User disconnected:', username || socket.id);
    delete sockets[username];
    delete users[socket.id];
    io.emit('user list', Object.values(users));
  });
});

// ================================
// 🔧 PORT SETUP untuk Railway / Lokal
// ================================
const PORT = process.env.PORT || 3000;

// Jalankan server
http.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server berjalan di port ${PORT}`);
});
