const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', require('./routes/chat'));
app.use('/api', require('./routes/portfolio'));

module.exports = app;
