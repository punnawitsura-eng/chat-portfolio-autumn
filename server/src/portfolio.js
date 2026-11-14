const db = require('./db');

async function getPortfolio() {
  const g = await db.query('SELECT * FROM group_info ORDER BY id LIMIT 1');
  const m = await db.query('SELECT * FROM members ORDER BY id');
  return { group: g.rows[0] || null, members: m.rows };
}

module.exports = { getPortfolio };
