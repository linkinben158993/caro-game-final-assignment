const express = require('express');
const passport = require('passport');
const Helper = require('./helper');
// eslint-disable-next-line no-unused-vars
const passportConfig = require('../middlewares/passport');
const Users = require('../models/mUsers');
const MatchUser = require('../models/mMatchUser');
const CONSTANT = require('./constants');

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('Should I Do This Route?');
});

router.post('/register', (req, res) => {
  const { username, password, fullName, isNormalFlow } = req.body;
  Helper.createAccountNormal(req, res, username, password, fullName, isNormalFlow);
});

router.post('/resend-otp', (req, res) => {
  // Should have flag OTP or Password
  const { resetAccount } = req.body;
  if (typeof resetAccount === 'undefined') {
    res.status(405).json({
      message: {
        msgBody: 'Method not supported!',
        msgError: true,
      },
    });
  } else if (!resetAccount) {
    const { email } = req.body;
    Helper.resetOTPAccountActivate(req, res, email);
  } else {
    const { email } = req.body;
    Helper.resetOTPForPassword(req, res, email);
  }
});

router.post('/check-otp', (req, res) => {
  const { email, otp, password } = req.body;
  // Flow activate otp
  if (!password) {
    console.log('Flow activate account!');
    Users.findOne({ email }, (err, foundUser) => {
      if (err) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      } else if (Number.parseInt(otp) === foundUser.otp) {
        foundUser.set({ otp: -1, activated: true });
        foundUser
          .save()
          .then(() => {
            res.status(200).json({
              success: true,
              message: {
                msgBody: 'Your Account Has Been Activated',
                msgError: false,
              },
            });
          })
          .catch(() => {
            res.status(500).json(CONSTANT.SERVER_ERROR);
          });
      } else {
        res.status(400).json({
          success: false,
          message: {
            msgBody: 'OTP Does Not Match',
            msgError: true,
          },
        });
      }
    });
  } else {
    // Flow reset password
    console.log('Flow reset account password!');
    Users.findOne({ email }, (err, foundUser) => {
      if (err) {
        console.log(err);
        res.status(500).json(CONSTANT.SERVER_ERROR);
      } else if (Number.parseInt(otp) === foundUser.otp) {
        console.log('OTP Match!');
        foundUser.set({ otp: -1, activated: true, password });
        foundUser
          .save()
          .then(() => {
            res.status(200).json({
              success: true,
              message: {
                msgBody: 'Your Account Has Been Reset',
                msgError: false,
              },
            });
          })
          .catch((err1) => {
            console.log(err1);
            res.status(500).json(CONSTANT.SERVER_ERROR);
          });
      }
    });
  }
});

router.post('/login', passport.authenticate('local', { session: false }), (req, res) => {
  if (req.body.isNormalFlow === 'undefined') {
    res.status(405).json({
      message: {
        msgBody: 'Method not supported',
        msgError: true,
      },
    });
  } else if (req.isAuthenticated()) {
    if (req.user.message) {
      const { message } = req.user;
      const { username, password, isNormalFlow } = req.body;
      // Login with username, password
      if (isNormalFlow) {
        res.status(501).json({ isAuthenticated: false, message });
      } else if (
        !isNormalFlow
        && message.msgBody !== 'User not found'
        && message.msgBody === 'Password not match'
      ) {
        // User press login with Google Button
        res.status(501).json({ isAuthenticated: false, message });
      } else if (!isNormalFlow && message.msgBody === 'User has been blocked by admin!') {
        // User press login with Google Button but is blocked
        res.status(501).json({ isAuthenticated: false, message });
      } else {
        const { fullName } = req.body;
        Helper.createAccountByGmail(req, res, username, password, fullName, isNormalFlow);
      }
    } else {
      const { _id, email, role, fullName } = req.user;
      const token = Helper.signToken(_id);
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

router.get('/info/stats/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  if (req.params.id === 'my') {
    MatchUser.getUserStats(req.user._id, (err, document) => {
      if (err) {
        console.log(err);
        res.status(500).json(CONSTANT.SERVER_ERROR);
      } else {
        res.status(200).json(document);
      }
    });
  } else {
    MatchUser.getUserStats(req.params.id, (err, document) => {
      if (err) {
        console.log(err);
        res.status(500).json(CONSTANT.SERVER_ERROR);
      } else {
        res.status(200).json(document);
      }
    });
  }
});

router.get('/all', passport.authenticate('jwt', { session: false }), (req, res) => {
  const queryString = req.query.query;
  if (req.user.role !== 1) {
    res.status(400).json({
      message: {
        msgBody: 'Must be admin to view page!',
        msgError: true,
      },
    });
  } else if (queryString.length > 0) {
    console.log('Find by query');
    Users.findUserByUserOrFullName(queryString, (err, document) => {
      if (err) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      } else {
        res.status(200).json({ success: true, message: 'Get all users by query!', data: document });
      }
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
        res.status(500).json(CONSTANT.SERVER_ERROR);
      });
  }
});

router.post('/admin/block', passport.authenticate('jwt', { session: false }), (req, res) => {
  if (req.user.role !== 1) {
    res.status(400).json({
      message: {
        msgBody: 'Must be admin to block!',
        msgError: true,
      },
    });
  } else {
    console.log('Admin want to block this user: ', req.body.userId);
    Users.setBlockStatus(req.body.userId, (err, callBack) => {
      if (err) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      } else {
        res.status(200).json({
          success: true,
          message: 'Block user successfully!',
        });
      }
    });
  }
});

router.post('/admin/unblock', passport.authenticate('jwt', { session: false }), (req, res) => {
  if (req.user.role !== 1) {
    res.status(400).json({
      message: {
        msgBody: 'Must be admin to unblock!',
        msgError: true,
      },
    });
  } else {
    console.log('Admin want to unblock this user: ', req.body.userId);
    Users.setBlockStatus(req.body.userId, (err, callBack) => {
      if (err) {
        res.status(500).json(CONSTANT.SERVER_ERROR);
      } else {
        res.status(200).json({
          success: true,
          message: 'Unblock user successfully!',
        });
      }
    });
  }
});

module.exports = router;
