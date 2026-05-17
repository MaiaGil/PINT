const express = require('express');
const dotenv = require('dotenv').config();
const connectDb = require('./db');
const port = process.env.PORT || 3000;
const app = express();
app.use((req, res, next) => {
 console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
 next();
});

app.use('/api/contacts', require('./routes/contactRoutes'));
app.listen(port, () => {
 connectDb();
 console.log(`Server running at http://localhost:${port}`);
});
