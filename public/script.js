// script.js
const socket = io();
let me = '';
const userListEl = document.getElementById('userList');
const btnRegister = document.getElementById('btn-register');
const usernameInput = document.getElementById('username');
const messagesEl = document.getElementById('messages');
const btnSend = document.getElementById('btn-send');
const inputEl = document.getElementById('input');
const targetSelect = document.getElementById('target');
const fileInput = document.getElementById('file');
const notifSound = document.getElementById('notif-sound');

// register username
btnRegister.addEventListener('click', () => {
  const name = usernameInput.value.trim();
  if (!name) { alert('Masukkan nama dulu'); return; }
  me = name;
  socket.emit('register', name);
  usernameInput.disabled = true;
  btnRegister.disabled = true;
});

// update daftar user online
socket.on('user list', (users) => {
  // update sidebar
  userListEl.innerHTML = '';
  // reset target dropdown (keep Group option)
  targetSelect.innerHTML = '<option value="All">Kirim ke: Group (Semua)</option>';
  users.forEach(u => {
    const li = document.createElement('li');
    li.textContent = u;
    li.onclick = () => {
      // pilih target dropdown saat klik nama
      if (u === me) return;
      targetSelect.value = u;
    };
    userListEl.appendChild(li);

    // add to select (except me)
    if (u !== me) {
      const opt = document.createElement('option');
      opt.value = u;
      opt.textContent = u;
      targetSelect.appendChild(opt);
    }
  });
});

// show history on connect
socket.on('history', (history) => {
  messagesEl.innerHTML = '';
  history.forEach(msg => displayMessage(msg));
});

// incoming group message
socket.on('group message', (msg) => {
  displayMessage(msg);
  if (msg.from !== me) playNotif();
});

// incoming private message
socket.on('private message', (msg) => {
  displayMessage(msg);
  if (msg.from !== me) playNotif();
});

// send message (text or image)
btnSend.addEventListener('click', sendMessage);
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
  const text = inputEl.value.trim();
  const target = targetSelect.value; // All or username
  if (!me) { alert('Silakan isi nama dan klik Masuk'); return; }

  // If image selected, send image instead
  const file = fileInput.files[0];
  if (file) {
    // read as dataURL
    const reader = new FileReader();
    reader.onload = function() {
      const dataUrl = reader.result;
      if (target === 'All') {
        socket.emit('group message', { from: me, text: dataUrl, isImage: true });
      } else {
        socket.emit('private message', { from: me, to: target, text: dataUrl, isImage: true });
      }
      fileInput.value = '';
    };
    reader.readAsDataURL(file);
    return;
  }

  if (!text) return;
  if (target === 'All') {
    socket.emit('group message', { from: me, text });
  } else {
    socket.emit('private message', { from: me, to: target, text });
  }
  inputEl.value = '';
}

// helper: tampilkan pesan
function displayMessage(msg) {
  const wrap = document.createElement('div');
  const isMe = msg.from === me;
  wrap.className = 'msg ' + (isMe ? 'me' : 'other');

  // meta: [time] from (private-> to)
  const meta = document.createElement('div');
  meta.className = 'meta';
  if (msg.type === 'private') {
    const toInfo = msg.from === me ? `-> ${msg.to}` : `(private)`;
    meta.textContent = `[${msg.time}] ${msg.from} ${toInfo}`;
  } else {
    meta.textContent = `[${msg.time}] ${msg.from}`;
  }
  wrap.appendChild(meta);

  // content (text or image)
  const content = document.createElement('div');
  if (msg.isImage && msg.text.startsWith('data:')) {
    const img = document.createElement('img');
    img.src = msg.text;
    img.style.maxWidth = '240px';
    img.style.borderRadius = '8px';
    content.appendChild(img);
  } else {
    // escape text to avoid XSS
    content.textContent = msg.text;
  }
  wrap.appendChild(content);

  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

// play notification
function playNotif() {
  if (notifSound) {
    notifSound.currentTime = 0;
    notifSound.play().catch(()=>{});
  }
}
