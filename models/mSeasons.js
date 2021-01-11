const mongoose = require('mongoose');

const SeasonSchema = new mongoose.Schema({
  minimum: {
    required: true,
    type: Number,
  },
  challenger: {
    required: true,
    type: Number,
  },
  master: {
    required: true,
    type: Number,
  },
  plat: {
    required: true,
    type: Number,
  },
});
