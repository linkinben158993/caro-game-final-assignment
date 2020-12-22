const JWT = require('jsonwebtoken');

module.exports = {
  signToken: (userID) => {
    const token = JWT.sign(
      {
        iss: process.env.secretOrKey,
        sub: userID,
      },
      process.env.secretOrKey,
      { expiresIn: 14 * 1000 * 60 * 60 * 24 },
    );
    return token;
  },
};
