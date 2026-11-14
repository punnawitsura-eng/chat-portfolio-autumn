const express = require('express');
const db = require('../db');
const { getPortfolio } = require('../portfolio');
const { buildSystemPrompt, askAI } = require('../ai');

const router = express.Router();
const HISTORY_LIMIT = 20;

// conversation ids are UUIDs (made by Postgres gen_random_uuid())
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id) => typeof id === 'string' && UUID_RE.test(id);

// POST /api/chat  { message, conversationId? } -> { reply, conversationId }
router.post('/chat', async (req, res) => {
  const sentAt = new Date(); // time the question arrived (saved with the user message)
  try {
    const message = (req.body.message || '').toString().trim();
    if (!message) return res.status(400).json({ error: 'message is required' });
    if (message.length > 2000) return res.status(400).json({ error: 'message too long' });

    // Use the given conversation only if it is a valid id that exists in the database.
    // Otherwise (missing, malformed, or deleted) start a new one BEFORE calling the AI,
    // so we never spend AI quota on a message we cannot save.
    let conversationId = isUuid(req.body.conversationId) ? req.body.conversationId : null;
    if (conversationId) {
      const found = await db.query('SELECT 1 FROM conversations WHERE id = $1', [conversationId]);
      if (found.rowCount === 0) conversationId = null;
    }
    if (!conversationId) {
      const c = await db.query('INSERT INTO conversations DEFAULT VALUES RETURNING id');
      conversationId = c.rows[0].id;
    }

    // history first, then the new question is added in memory only
    const hist = await db.query(
      `SELECT role, content FROM (
         SELECT id, role, content FROM messages WHERE conversation_id = $1 ORDER BY id DESC LIMIT $2
       ) t ORDER BY id`,
      [conversationId, HISTORY_LIMIT]
    );

    const portfolio = await getPortfolio();
    const reply = await askAI(buildSystemPrompt(portfolio), [
      ...hist.rows,
      { role: 'user', content: message },
    ]);

    await db.addPair(conversationId, message, reply, sentAt);

    res.json({ reply, conversationId });
  } catch (err) {
    console.error(err);
    if (err.status === 429) return res.status(429).json({ error: 'Too many requests, try again soon.' });
    res.status(err.status ? 502 : 500).json({ error: 'Something went wrong, please try again.' });
  }
});

// GET /api/history/:conversationId -> { messages: [...] }
router.get('/history/:conversationId', async (req, res) => {
  try {
    // a malformed id cannot have any messages, so skip the database
    if (!isUuid(req.params.conversationId)) return res.json({ messages: [] });
    const r = await db.query(
      'SELECT role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY id',
      [req.params.conversationId]
    );
    res.json({ messages: r.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load history.' });
  }
});

module.exports = router;
