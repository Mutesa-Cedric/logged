require('dotenv').config();
import express = require('express');
import cors = require('cors');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');

// import { dbConnection } from './utils/dbConnection';
const PORT = process.env.PORT || 8000;

const app = express();
app.use(cors());
// dbConnection()
//   .then(() => {
//     console.log('Database connected');
//     app.listen(PORT, () => {
//       console.log(`Server is listening on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.log(err);
//   });

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

app.use(bodyParser.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  origin && res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,HEAD,OPTIONS,POST,PUT,DELETE',
  );
  res.setHeader(
    'Access-Contxprol-Allow-Headers',
    'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization',
  );
  next();
});

// log every request
app.use((req, res, next) => {
  console.log(req.originalUrl, '\t', req.method, '\t', req.url);
  next();
});

// router middlewares

app.get('/', (req, res) => {
  res.send('Hello world');
});
