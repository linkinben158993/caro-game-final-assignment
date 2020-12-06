const express = require('express');
const passport = require('passport');
const JWT = require('jsonwebtoken');
// eslint-disable-next-line no-unused-vars
const passportConfig = require('../middlewares/passport');
const Users = require('../models/mUsers');

const router = express.Router();

const signToken = (userID) => {
  const token = JWT.sign(
    {
      iss: process.env.secretOrKey,
      sub: userID,
    },
    process.env.secretOrKey,
    { expiresIn: 14 * 1000 * 60 * 60 * 24 },
  );
  return token;
};
/* GET users listing. */
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  Users.findOne({ username }, (err, user) => {
    if (err) {
      console.log('Error!');
      res.status(500).json({ message: { msgBody: 'An Error Has Occurred!', msgError: true } });
    }
    if (user) {
      console.log('User Existed', user);
      res.status(500).json({ message: { msgBody: 'Username Existed!', msgError: true } });
    } else {
      const newUser = new Users({ email: username, password, role: 1 });
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
    const { _id, email, role } = req.user;
    const token = signToken(_id);
    res.cookie('access_token', token, options);
    res.status(200).json({ isAuthenticated: true, user: { email, role }, access_token: token });
  }
});

router.get('/all', passport.authenticate('jwt', { session: false }), (req, res) => {
  if (req.user.role !== 1) {
    res.json({
      success: false,
      message: 'Must be admin to view page!',
    });
  } else {
    Users.find({ role: 0 })
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
