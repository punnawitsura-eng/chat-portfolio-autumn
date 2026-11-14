const express = require('express');
const { getPortfolio } = require('../portfolio');

const router = express.Router();

// GET /api/portfolio -> { group, members }
router.get('/portfolio', async (_req, res) => {
  try {
    res.json(await getPortfolio());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load portfolio.' });
  }
});

module.exports = router;
