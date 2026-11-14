const { test } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { buildSystemPrompt } = require('../src/ai');

test('GET /api/health returns ok', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: 'ok' });
  server.close();
});

test('system prompt includes group and every member', () => {
  const prompt = buildSystemPrompt({
    group: { name: 'Team X', concept: 'c', highlights: [], shared_projects: [], contact: {} },
    members: [
      { name: 'Alice', role: 'r', bio: 'b', skills: ['js'], projects: [] },
      { name: 'Bob', role: 'r', bio: 'b', skills: ['py'], projects: [] },
    ],
  });
  assert.ok(prompt.includes('Team X'));
  assert.ok(prompt.includes('Alice'));
  assert.ok(prompt.includes('Bob'));
});

// These two requests are answered before any database call, so no DB is needed.
test('POST /api/chat rejects an empty message', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '   ' }),
  });
  assert.strictEqual(res.status, 400);
  server.close();
});

test('GET /api/history with a malformed id returns no messages', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/history/not-a-uuid`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { messages: [] });
  server.close();
});
