const path = require('path');
const express = require('express'); // app framework
const morgan = require('morgan'); // http request logger
const rateLimit = require('express-rate-limit');
const helmet = require('helmet'); // set http headers
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

// set up pug engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDDLEWARE
// serve static files automatically from public
app.use(express.static(path.join(__dirname, 'public')));

// set security HTTP headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// LIMIT requests from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP. Please try again in an hour.',
});

app.use('/api', limiter); // only affects all routes that start with /api

// PARSERS
app.use(express.json({ limit: '10kb' })); // body parser; reading data from body into req.body
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // for parsing data coming from url encoded form
app.use(cookieParser());

// DATA SANITIZATION
app.use(mongoSanitize()); // against NoSQL query injection; filters out all the $ and .
app.use(xss()); // against XSS

// prevent PARAMETER POLLUTION
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// API ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

// runs for all http methods
app.all('*', (req, res, next) => {
  next(new AppError(`Unable to find ${req.originalUrl} on this server.`));
});

// ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
