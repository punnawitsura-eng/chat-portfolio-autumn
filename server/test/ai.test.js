const test = require('node:test');
const assert = require('node:assert');
const { buildSystemPrompt, askAI } = require('../src/ai');

const data = {
  group: { name: 'Autumn Byte Guild', concept: 'c', highlights: ['h'], shared_projects: [], contact: {} },
  members: [{ name: 'Punnawit', role: 'Backend', bio: 'b', skills: ['Node'], projects: [] }],
};

test('prompt contains group, members and rules', () => {
  const p = buildSystemPrompt(data);
  assert.match(p, /Autumn Byte Guild/);
  assert.match(p, /Punnawit/);
  assert.match(p, /ONLY from the portfolio data/);
  assert.match(p, /plain text only/i);
});

test('askAI returns placeholder without key', async () => {
  delete process.env.LLM_API_KEY;
  assert.match(await askAI('sys', []), /not configured/);
});

test('askAI calls chat/completions and returns text', async () => {
  process.env.LLM_API_KEY = 'k';
  const orig = global.fetch;
  let seen;
  global.fetch = async (url, opts) => {
    seen = { url, body: JSON.parse(opts.body) };
    return { ok: true, json: async () => ({ choices: [{ message: { content: ' hi ' } }] }) };
  };
  try {
    assert.strictEqual(await askAI('sys', [{ role: 'user', content: 'q' }]), 'hi');
    assert.match(seen.url, /chat\/completions$/);
    assert.strictEqual(seen.body.messages[0].role, 'system');
  } finally {
    global.fetch = orig;
    delete process.env.LLM_API_KEY;
  }
});

test('askAI throws with status on 429', async () => {
  process.env.LLM_API_KEY = 'k';
  const orig = global.fetch;
  global.fetch = async () => ({ ok: false, status: 429 });
  try {
    await assert.rejects(askAI('s', []), (e) => e.status === 429);
  } finally {
    global.fetch = orig;
    delete process.env.LLM_API_KEY;
  }
});
