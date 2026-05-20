const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const connectDb = require('./db');

const port = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});


app.use('/api', require('./routes/iaRoutes'));

app.listen(port, () => {
  connectDb();
  console.log(`Server running at http://localhost:${port}`);
});