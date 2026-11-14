const express = require('express');
const cors = require('cors');

const app = express();
// Only the frontend site may call this API from a browser.
// The browser sends its Origin without a trailing "/", so remove one if it was pasted in.
const clientOrigin = (process.env.CLIENT_ORIGIN || '*').replace(/\/+$/, '');
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', require('./routes/chat'));
app.use('/api', require('./routes/portfolio'));

module.exports = app;
