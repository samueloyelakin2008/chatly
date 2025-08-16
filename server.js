require('dotenv').config();
const express = require('express');
const http = require('http');   // use http, not https
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/messages');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);  
const io = socketio(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Online users map
const onlineUsers = new Map();

io.on('connection', socket => {
  console.log('socket connected', socket.id);

  socket.on('auth', async ({ token }) => {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select('username');
      if (!user) return socket.emit('unauthorized');

      onlineUsers.set(socket.id, { userId: user._id.toString(), username: user.username });
      io.emit('onlineUsers', Array.from(onlineUsers.values()).map(u => ({ username: u.username })));
    } catch (err) {
      socket.emit('unauthorized');
    }
  });

  socket.on('joinRoom', async ({ room }) => {
    socket.join(room);
    socket.currentRoom = room;
    const msgs = await Message.find({ room }).sort({ createdAt: 1 }).limit(200).lean();
    socket.emit('roomHistory', msgs);
  });

  socket.on('typing', ({ room, username }) => {
    socket.to(room).emit('typing', { username });
  });

  socket.on('stopTyping', ({ room, username }) => {
    socket.to(room).emit('stopTyping', { username });
  });

  socket.on('sendMessage', async ({ token, room, text }) => {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(payload.id).select('username');
      if (!user) return socket.emit('unauthorized');

      const message = new Message({ room, user: user._id, username: user.username, text });
      await message.save();

      const msgForClient = { 
        _id: message._id, room, user: user._id, 
        username: user.username, text, createdAt: message.createdAt 
      };

      io.to(room).emit('newMessage', msgForClient);
    } catch (err) {
      socket.emit('error', 'Message failed');
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.values()).map(u => ({ username: u.username })));
    console.log('socket disconnected', socket.id);
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
