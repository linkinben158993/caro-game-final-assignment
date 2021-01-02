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

const createAccount = (req, res, email, password, fullName, otp, isNormalFlow) => {
  const newUser = new Users({
    email,
    password,
    role: 0,
    fullName,
    otp,
    activated: false,
  });
  newUser.save(async (err1) => {
    if (err1) {
      res.status(500).json(CONSTANT.SERVER_ERROR);
    } else {
      const result = await nodeMailer.registerByMail(email, otp);
      if (!result.success) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      } else {
        res.status(201).json({
          message: {
            msgBody: 'An Account Has Been Created',
            msgError: false,
            info: {
              email,
              otp,
            },
            isNormalFlow,
          },
        });
      }
    }
  });
};

module.exports = {
  signToken,
  createAccountNormal: (req, res, email, password, fullName, isNormalFlow) => {
    Users.createUserWithOTP(email, (err, callBack) => {
      if (err) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      }
      if (callBack.message) {
        res.status(501).json({
          message: {
            msgBody: 'User With Email Exists!',
            msgError: true,
          },
        });
      } else {
        createAccount(req, res, email, password, fullName, callBack.otp, isNormalFlow);
      }
    });
  },

  createAccountByGmail: (req, res, email, password, fullName, isNormalFlow) => {
    Users.createUserWithOTP(email, (err, callBack) => {
      if (err) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      }
      if (callBack.message) {
        if (callBack.message.msgBody === 'User Exists') {
          if (!isNormalFlow) {
            const token = signToken(callBack.user._id);
            res.status(200).json({
              isAuthenticated: true,
              user: {
                email: callBack.user.email,
                role: callBack.user.role,
                fullName: callBack.user.fullName,
              },
              access_token: token,
            });
          } else if (!callBack.user.activated && callBack.user.otp !== -1) {
            res.status(501).json({
              message: { msgBody: 'User has not been activated', msgError: true, isNormalFlow },
            });
          } else {
            res.status(501).json({
              message: {
                msgBody: 'User With Email Exists!',
                msgError: true,
              },
            });
          }
        }
      } else {
        // If user register with normal flow
        createAccount(req, res, callBack.email, password, fullName, callBack.otp, isNormalFlow);
      }
    });
  },
};
