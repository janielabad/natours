const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');

// catch exceptions, e.g. reference error
process.on('uncaughtException', (err) => {
  console.log('Unhandler exception! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.set('useUnifiedTopology', true);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log(colors.bgWhite.black('Database connection successful.'));
  })
  .catch((err) =>
    console.log('Unhandled promise rejection! Failure to connect to database.')
  );

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// global handler for unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandler rejection! Shutting down...');
  console.log(err.name, err.message);
  // wait til all requests are handled
  server.close(() => {
    process.exit(1);
  });
});
