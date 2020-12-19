const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  host: {
    type: String,
    required: true,
  },
  opponent: {
    type: String,
    required: true,
  },
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  match: [
    {
      _id: {
        type: mongoose.Types.ObjectId,
      },
      moves: [
        {
          x: {
            type: Number,
            required: true,
          },
          y: {
            type: Number,
            required: true,
          },
        },
      ],
    },
  ],
  chatLogs: [
    {
      username: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
    },
  ],
  // -1: Left room Left Room Close Browser, 0: Unfinished (), 1: Complete
  status: {
    type: Number,
    // If default then show `Unfinished/In-Progress Via API-History`
    default: 0,
    enum: [-1, 0, 1],
  },
});

module.exports = mongoose.model('Match', MatchSchema);
