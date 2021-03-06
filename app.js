const createError = require('http-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');

const app = express();

dotenv.config();

app.use(
  session({
    secret: process.env.secretOrKey,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  }),
);

// For later research
app.use(passport.initialize());
app.use(passport.session());

app.enable('trust proxy');
// app.options('*', cors());
// Add your front-end domain name here!
// app.use(
//   cors({
//     credentials: true,
//     origin: [
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'https://caro-game-user.vercel.app',
//       'https://caro-game-admin.vercel.app',
//       // Online users
//       'https://caro-game-user-git-an-onine-users.1712480.vercel.app',
//       // Fullname issues
//       'https://caro-game-user-git-an-fix-fullname-field.1712480.vercel.app',
//     ],
//   }),
// );
app.use(
  cors({
    credentials: true,
  }),
);

const http = require('http');
const socket = require('./middlewares/socket-io');

const server = http.createServer(app);
socket.startSocketServer(server);

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const matchesRouter = require('./routes/matches');

// Mongo configuration
mongoose
  .connect(process.env.URI || 'localhost:27017', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Mongo is connecting');
  })
  .catch((err) => {
    console.log(err);
  });

mongoose.connection.on('connected', () => {
  console.log('Mongo is successfully connected');
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongo is disconnected');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.secretOrKey));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/matches', matchesRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = { app, server };
