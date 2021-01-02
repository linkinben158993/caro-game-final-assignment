const JWT = require('jsonwebtoken');
const Users = require('../models/mUsers');
const CONSTANT = require('./constants');
const nodeMailer = require('../middlewares/node-mailer');

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

  createAccountByGmail: (req, res, email, password, fullName) => {
    Users.createUserWithOTP(email, (err, callBack) => {
      if (err) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      }
      if (callBack.message) {
        res.status(400).json(callBack);
      } else {
        const newUser = new Users({
          email: callBack.email,
          password,
          role: 0,
          fullName,
          otp: callBack.otp,
          activated: false,
        });
        newUser.save(async (err1) => {
          if (err1) {
            res.status(500).json(CONSTANT.SERVER_ERROR);
          } else {
            const result = await nodeMailer.registerByMail(callBack.email, callBack.otp);
            if (!result.success) {
              res.status(500).json(CONSTANT.SERVER_ERROR);
            } else {
              res.status(201).json({
                message: {
                  msgBody: 'An Account Has Been Created',
                  msgError: false,
                  info: {
                    email: callBack.email,
                    otp: callBack.otp,
                  },
                },
              });
            }
          }
        });
      }
    });
  },
};
