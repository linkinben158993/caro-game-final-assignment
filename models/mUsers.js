const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    min: 6,
    max: 50,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    min: 6,
    max: 100,
  },
  name: {
    type: String,
    required: true,
    default: 'username',
  },
  avatar: {
    type: String,
    require: false,
    default: 'https://toppng.com/uploads/preview/hackerman-11556286446gid8lfj2ce.png',
  },
  role: {
    type: Number,
    // -1: guest, 0: user, 1: admin
    enum: [-1, 0, 1],
  },
});

UserSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  bcrypt.hash(this.password, 10, (err, passwordHashed) => {
    if (err) {
      return next(err);
    }
    this.password = passwordHashed;
    return next();
  });
});

UserSchema.methods.checkPassword = function (password, callBack) {
  bcrypt.compare(password, this.password, (err, isMatch) => {
    if (err) {
      return callBack(err);
    }

    if (!isMatch) {
      return callBack(null, isMatch);
    }

    return callBack(null, this);
  });
};

module.exports = mongoose.model('User', UserSchema);
