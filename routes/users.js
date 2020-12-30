const express = require('express');
const passport = require('passport');
const signTokenHelper = require('./helper');
// eslint-disable-next-line no-unused-vars
const passportConfig = require('../middlewares/passport');
const Users = require('../models/mUsers');
const nodeMailer = require('../middlewares/node-mailer');
const CONSTANT = require('./constants');

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('Should I Do This Route?');
});

router.post('/register', (req, res) => {
  const { username, password, name } = req.body;
  Users.findOne({ email: username }, (err, user) => {
    if (err) {
      res.status(500).json(CONSTANT.SERVER_ERROR);
    }
    if (user) {
      res.status(400).json({ message: { msgBody: 'Username Existed!', msgError: true } });
    } else {
      const newUser = new Users({
        email: username,
        password,
        role: 0,
        fullName: name,
      });
      newUser.save((err1) => {
        if (err1) {
          res.status(500).json(CONSTANT.SERVER_ERROR);
        } else {
          res
            .status(201)
            .json({ message: { msgBody: 'An Account Has Been Created', msgError: false } });
        }
      });
    }
  });
});

router.post('/register-email', (req, res) => {
  const { email } = req.body;
  Users.createUserWithOTP(email, (err, callBack) => {
    if (err) {
      res.status(500).json(CONSTANT.SERVER_ERROR);
    }
    if (callBack.message) {
      res.status(400).json(callBack);
    } else {
      const newUser = new Users({
        email: callBack.email,
        password: 'default-password',
        role: 0,
        fullName: callBack.email,
        otp: callBack.otp,
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
});

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  if (req.isAuthenticated()) {
    if (req.user.message) {
      const { message } = req.user;
      res.status(501).json({ isAuthenticated: false, message });
    } else {
      const { _id, email, role, fullName } = req.user;
      const token = signTokenHelper.signToken(_id);
      res.cookie('access_token', token, CONSTANT.TOKEN_OPTIONS);
      res
        .status(200)
        .json({ isAuthenticated: true, user: { email, role, fullName }, access_token: token });
    }
  }
});

router.post('/info/edit', passport.authenticate('jwt', { session: false }), (req, res) => {
  // Avatar can be done later
  const { fullName, avatar } = req.body;
  const updateUser = req.user;
  console.log(updateUser);
});

router.post('/info/password', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { oldPassword, newPassword } = req.body;
  req.user.changePassword(req.user, oldPassword, newPassword, (err, callBack, isMatch) => {
    if (err) {
      res.status(500).json(err);
    } else if (callBack.message) {
      // User error should be bad request
      res.status(400).json(callBack);
    } else {
      isMatch.set({ password: callBack });
      isMatch
        .save()
        .then(() => {
          res.status(200).json({
            message: { msgBody: 'Change Password Successfully!', msgError: false },
          });
        })
        .catch((errSave) => {
          res.status(500).json({
            message: { msgBody: 'Change Password Failed!', msgError: true, err: errSave },
          });
        });
    }
  });
});

router.post('/info/fullname', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { fullName } = req.body;
  const newUser = req.user;
  newUser.set({ fullName });
  newUser
    .save()
    .then(() => {
      res.status(200).json({
        message: { msgBody: 'Change Full Name Successfully!', msgError: false },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json(CONSTANT.SERVER_ERROR);
    });
});

router.get('/all', passport.authenticate('jwt', { session: false }), (req, res) => {
  if (req.user.role !== 1) {
    res.status(400).json({
      message: {
        msgBody: 'Must be admin to view page!',
        msgError: true,
      },
    });
  } else {
    Users.find({ role: 0 }, { password: 0 })
      .exec()
      .then((value) => {
        res.status(200).json({
          success: true,
          message: 'Retrieved all users success!',
          data: value,
        });
      })
      .catch((reason) => {
        res.status(500).json({
          message: 'Retrieved all users failed, server error!',
          data: reason,
        });
      });
  }
});

module.exports = router;
