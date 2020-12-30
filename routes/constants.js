module.exports = {
  TOKEN_OPTIONS: {
    expires: new Date(Date.now() + 14 * 1000 * 60 * 60 * 24),
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  },
  SERVER_ERROR: { message: { msgBody: 'An Error Has Occurred!', msgError: true } },
};
