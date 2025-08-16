const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

router.get('/:room', async (req, res) => {
  const { room } = req.params;
  const msgs = await Message.find({ room }).sort({ createdAt: 1 }).limit(200).lean();
  res.json(msgs);
});

module.exports = router;
