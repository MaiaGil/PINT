const express = require('express');
const dotenv = require('dotenv').config();
const port = process.env.PORT || 3000;
const app = express();

app.use((req, res, next) => {
 console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
 next();
});

app.get('/', (req, res) => {
 res.send('Hello, Express!');
});
app.listen(port, () => {
 console.log(`Server running at http://localhost:${port}`);
});
