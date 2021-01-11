const Users = require('./mUsers');
const Matches = require('./mMatches');

module.exports = {
  getUserStats: async (userId, callBack) => {
    let foundUser;
    try {
      foundUser = await Users.findOne({ _id: userId });
      Matches.getMatchByUserId(userId, (err, document) => {
        if (err) {
          return callBack(err);
        }
        const createdTimestamp = foundUser._id.getTimestamp().getTime();
        foundUser.createdTimeStamp = createdTimestamp;
        const sumUserMatches = document.length;
        const userWonMatches = document.filter((data) => data.winner === foundUser.email).length;

        return callBack(null, {
          user: { email: foundUser.email, fullName: foundUser.fullName },
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
