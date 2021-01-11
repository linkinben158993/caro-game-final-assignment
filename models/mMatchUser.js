const Users = require('./mUsers');
const Matches = require('./mMatches');

module.exports = {
  getUserStats: async (userId, callBack) => {
    let foundUser;
    try {
      foundUser = await Users.findOne({ _id: userId });
      const createdTimestamp = foundUser._id.getTimestamp().getTime();

      Matches.getMatchByUserId(userId, (err, document) => {
        if (err) {
          return callBack(err);
        }

        foundUser.createdTimeStamp = createdTimestamp;
        if (document === 0 || foundUser === null) {
          return callBack(null, {
            user: {
              email: foundUser.email,
              fullName: foundUser.fullName,
              joinTimeStamp: createdTimestamp,
            },
            stats: {
              playedGame: 0,
              winRate: 0,
            },
          });
        }

        const sumUserMatches = document.length;
        const userWonMatches = document.filter((data) => data.winner === foundUser.email).length;

        return callBack(null, {
          user: {
            email: foundUser.email,
            fullName: foundUser.fullName,
            joinTimeStamp: createdTimestamp,
          },
          stats: {
            playedGame: sumUserMatches,
            winRate: Math.round((userWonMatches / sumUserMatches) * 100),
          },
        });
      });
    } catch (err) {
      callBack(err);
    }
  },
};
