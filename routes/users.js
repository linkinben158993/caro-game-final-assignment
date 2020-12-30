const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const signTokenHelper = require('./helper');
// eslint-disable-next-line no-unused-vars
const passportConfig = require('../middlewares/passport');
const Users = require('../models/mUsers');

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('Should I Do This Route?');
});

router.post('/register', (req, res) => {
  const { username, password, name } = req.body;
  console.log(name);
  Users.findOne({ username }, (err, user) => {
    if (err) {
      console.log('Error!');
      res.status(500).json({ message: { msgBody: 'An Error Has Occurred!', msgError: true } });
    }
    if (user) {
      console.log('User Existed', user);
      res.status(500).json({ message: { msgBody: 'Username Existed!', msgError: true } });
    } else {
      const newUser = new Users({
        email: username,
        password,
        role: 0,
        fullName: name,
      });
      newUser.save((err1) => {
        if (err1) {
          res.status(500).json({ message: { msgBody: 'An Error Has Occurred!', msgError: true } });
        } else {
          res
            .status(201)
            .json({ message: { msgBody: 'An Account Has Been Created', msgError: false } });
        }
      });
    }
  });
});

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  const options = {
    expires: new Date(Date.now() + 14 * 1000 * 60 * 60 * 24),
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  };
  if (req.isAuthenticated()) {
    if (req.user.message) {
      const { message } = req.user;
      res.status(501).json({ isAuthenticated: false, message });
    } else {
      const { _id, email, role, fullName } = req.user;
      const token = signTokenHelper.signToken(_id);
      res.cookie('access_token', token, options);
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
      res.status(400).json(callBack.message);
    } else {
      isMatch.set({ password: callBack });
      isMatch
        .save()
        .then(() => {
          res.status(200).json({
            success: true,
            message: { msgBody: 'Change Password Successfully!', msgError: false },
          });
        })
        .catch((errSave) => {
          res.status(200).json({
            success: false,
            message: { msgBody: 'Change Password Failed!', msgError: true, err: errSave },
          });
        });
    }
  });
});

router.get('/all', passport.authenticate('jwt', { session: false }), (req, res) => {
  if (req.user.role !== 1) {
    res.json({
      success: false,
      message: 'Must be admin to view page!',
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
          success: false,
          message: 'Retrieved all users failed, server error!',
          data: reason,
        });
      });
  }
});

module.exports = router;
