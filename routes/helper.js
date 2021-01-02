const JWT = require('jsonwebtoken');
const Users = require('../models/mUsers');
const CONSTANT = require('./constants');
const nodeMailer = require('../middlewares/node-mailer');

const signToken = (userID) => {
  const token = JWT.sign(
    {
      iss: process.env.secretOrKey,
      sub: userID,
    },
    process.env.secretOrKey,
    { expiresIn: 14 * 1000 * 60 * 60 * 24 }
  );
  return token;
};

module.exports = {
  signToken,
  createAccountByGmail: (req, res, email, password, fullName) => {
    Users.createUserWithOTP(email, (err, callBack) => {
      if (err) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      }
      if (callBack.message) {
        const token = signToken(callBack.user._id);
        if (!callBack.user.activated && callBack.user.otp !== -1) {
          res
            .status(501)
            .json({ message: { msgBody: 'User has not been activated', msgError: true } });
        } else {
          res.status(200).json({
            isAuthenticated: true,
            user: {
              email: callBack.user.email,
              role: callBack.user.role,
              fullName: callBack.user.fullName,
            },
            access_token: token,
          });
        }
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
