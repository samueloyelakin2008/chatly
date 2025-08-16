const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  room: { type: String, default: 'general' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  text: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
