const socket = io();

// Simple client auth handling using localStorage token
let token = localStorage.getItem('chat_token');
let username = localStorage.getItem('chat_username');
let currentRoom = 'general';

const messagesEl = document.getElementById('messages');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const roomsList = document.getElementById('roomsList');
const roomTitle = document.getElementById('roomTitle');
const currentUserEl = document.getElementById('currentUser');
const onlineList = document.getElementById('onlineList');
const typingIndicator = document.getElementById('typingIndicator');
const logoutBtn = document.getElementById('logoutBtn');

if (!token) {
  // Simple redirect to login page for brevity
  window.location.href = '/login.html';
} else {
  currentUserEl.textContent = username;
}

// Authenticate socket
socket.emit('auth', { token });

socket.on('unauthorized', () => {
  localStorage.removeItem('chat_token');
  localStorage.removeItem('chat_username');
  window.location.href = '/login.html';
});

socket.on('onlineUsers', list => {
  onlineList.innerHTML = '';
  list.forEach(u => {
    const li = document.createElement('li'); li.textContent = u.username; onlineList.appendChild(li);
  });
});

// Join default room
joinRoom(currentRoom);

roomsList.addEventListener('click', e => {
  const li = e.target.closest('li');
  if (!li) return;
  const room = li.dataset.room;
  if (room === currentRoom) return;
  document.querySelectorAll('.room').forEach(r => r.classList.remove('active'));
  li.classList.add('active');
  joinRoom(room);
});

function joinRoom(room){
  currentRoom = room;
  roomTitle.textContent = `# ${room}`;
  messagesEl.innerHTML = '';
  socket.emit('joinRoom', { room });
}

socket.on('roomHistory', msgs => {
  msgs.forEach(addMessage);
  scrollBottom();
});

socket.on('newMessage', msg => {
  addMessage(msg);
  scrollBottom();
});

socket.on('typing', ({ username: u }) => {
  typingIndicator.textContent = `${u} is typing...`;
});
socket.on('stopTyping', () => typingIndicator.textContent = '');

messageForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;
  socket.emit('sendMessage', { token, room: currentRoom, text });
  messageInput.value = '';
  socket.emit('stopTyping', { room: currentRoom, username });
});

let typingTimeout;
messageInput.addEventListener('input', () => {
  socket.emit('typing', { room: currentRoom, username });
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => socket.emit('stopTyping', { room: currentRoom, username }), 700);
});

function addMessage(msg){
  const li = document.createElement('li');
  const isMe = msg.username === username;
  li.className = isMe ? 'msg-right' : 'msg-left';
  const meta = document.createElement('div'); meta.className = 'msg-meta'; meta.textContent = `${msg.username} • ${new Date(msg.createdAt).toLocaleTimeString()}`;
  const body = document.createElement('div'); body.textContent = msg.text;
  li.appendChild(meta); li.appendChild(body);
  messagesEl.appendChild(li);
}

function scrollBottom(){ messagesEl.scrollTop = messagesEl.scrollHeight; }

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('chat_token');
  localStorage.removeItem('chat_username');
  window.location.href = '/login.html';
});
