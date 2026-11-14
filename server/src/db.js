const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Save a user message and the AI reply together (all or nothing).
// userSentAt = when the question reached the server, so the question keeps its own time.
// The reply is stamped "now" (right after the AI answered).
// Both times come from this Node server's clock on purpose: mixing it with the
// database clock (now()) can put a question after its own answer if the clocks differ.
async function addPair(conversationId, userText, assistantText, userSentAt = new Date()) {
  const repliedAt = new Date();
  const sql =
    'INSERT INTO messages (conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4)';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql, [conversationId, 'user', userText, userSentAt]);
    await client.query(sql, [conversationId, 'assistant', assistantText, repliedAt]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { query: (text, params) => pool.query(text, params), pool, addPair };
