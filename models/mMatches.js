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
      winner: {
        type: String,
      },
      status: {
        type: Number,
        default: 0,
        // -1: Unfinished, 0: In progress, 1: Finished
        enum: [-1, 0, 1],
      },
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
});

MatchSchema.statics.updateMoves = function (roomId, matchId, move, callBack) {
  this.findOne({ roomId }, { match: { $elemMatch: { _id: matchId } } })
    .then((document) => {
      document.match[0].moves.push(move);
      document
        .save()
        .then(() => {
          callBack(null, true);
        })
        .catch((err) => callBack(err));
    })
    .catch((err) => callBack(null, err));
};

MatchSchema.statics.getMatchByEmail = function (email, callBack) {
  this.find({
    $or: [{ host: email }, { opponent: email }],
  })
    .then((document) => {
      if (document.length === 0) {
        // User hasn't played any match
        return callBack(null, 0);
      }
      // User has more than one match and stuff
      return callBack(null, document);
    })
    .catch((err) => callBack(err));
};

module.exports = mongoose.model('Match', MatchSchema);
