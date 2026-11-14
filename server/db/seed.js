require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/db');

(async () => {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/portfolio.json'), 'utf8'));

  await db.query(schema);
  await db.query('TRUNCATE group_info, members RESTART IDENTITY');

  const g = data.group;
  await db.query(
    'INSERT INTO group_info (name, concept, highlights, shared_projects, contact) VALUES ($1,$2,$3,$4,$5)',
    [g.name, g.concept, g.highlights, JSON.stringify(g.shared_projects), JSON.stringify(g.contact)]
  );

  for (const m of data.members) {
    await db.query(
      'INSERT INTO members (name, role, bio, skills, projects) VALUES ($1,$2,$3,$4,$5)',
      [m.name, m.role, m.bio, m.skills, JSON.stringify(m.projects)]
    );
  }

  console.log(`Seeded group "${g.name}" with ${data.members.length} members.`);
  await db.pool.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
