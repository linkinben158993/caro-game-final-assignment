const express = require('express');
const passport = require('passport');
// eslint-disable-next-line no-unused-vars
const passportConfig = require('../middlewares/passport');
const Matches = require('../models/mMatches');
const CONSTANT = require('./constants');

const router = express.Router();

router.get('/my', passport.authenticate('jwt', { session: false }), (req, res) => {
  Matches.getMatchByEmail(req.user.email, (err, document) => {
    if (err) {
      res.status(500).json(CONSTANT.SERVER_ERROR);
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
      res.status(500).json(CONSTANT.SERVER_ERROR);
    } else {
      res.status(200).json({ success: true, message: 'Retrieved match by id!', data: document });
    }
  });
});

router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { id } = req.params;
  Matches.getMatchByUserId(id, (err, document) => {
    if (err) {
      console.log(err);
      res.status(500).json(CONSTANT.SERVER_ERROR);
    } else {
      console.log(document);
      res
        .status(200)
        .json({ success: true, message: 'Retrieved matches by user id success!', data: document });
    }
  });
});

module.exports = router;
