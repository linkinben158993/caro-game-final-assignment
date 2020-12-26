const express = require('express');
const passport = require('passport');
// eslint-disable-next-line no-unused-vars
const passportConfig = require('../middlewares/passport');
const Matches = require('../models/mMatches');

const router = express.Router();

router.get('/my', passport.authenticate('jwt', { session: false }), (req, res) => {
  Matches.getMatchByEmail(req.user.email, (err, document) => {
    if (err) {
      res.status(500).json({ message: { msgBody: 'An Error Has Occurred!', msgError: true } });
    } else {
      res
        .status(200)
        .json({ success: true, message: 'Retrieved all matches from user!', data: document });
    }
  });
});

router.get('/my/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  Matches.getMatchById(req.params.id, (err, document) => {
    if (err) {
      res.status(500).json({ message: { msgBody: 'An Error Has Occurred!', msgError: true } });
    } else {
      res.status(200).json({ success: true, message: 'Retrieved match by id!', data: document });
    }
  });
});

module.exports = router;
