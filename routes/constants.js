module.exports = {
  TOKEN_OPTIONS: {
    expires: new Date(Date.now() + 14 * 1000 * 60 * 60 * 24),
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  },
};
