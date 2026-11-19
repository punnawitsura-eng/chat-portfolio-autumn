# CLAUDE.md - project brief for Claude Code

Read this whole file first. It is the only context you get: you cannot see the chat where this project was planned.
Work one step at a time (see "Work plan"), report after each step, and stop when you need something from me.

## Project
University final project: **"Chat AI with group Portfolio"** (group of 2 members, team name "Autumn Byte Guild").
A website where visitors chat with an AI that answers questions about the group and about each member.
- Submission (single): GitHub repo + README.md, `.env.example` (no real keys), deployed link, presentation file.
- **My target: submit before 16 Nov 2026** (hard deadline 20 Nov 23:59, late = -1 point/day).
- Grading: Web App works fully 40%, CI/CD 25%, AI integration 25%, presentation 10%. Individual score = every member can explain the code, so keep code simple and commented.

## Hard requirements (must all be true at the end)
1. React chat UI, user and AI messages clearly separated.
2. Express backend receives the chat message and forwards it to the AI.
3. PostgreSQL stores the chat history (and the portfolio data for the group and members).
4. The AI answers from the portfolio data of the group AND every member (system prompt / context), never generically. It must handle group-level and member-level questions.
5. CI/CD pipeline that builds/tests and deploys automatically (GitHub Actions + Render deploy hooks).
6. Portfolio page: group intro (name, concept, shared work), each member (name, role, skills, projects), contact.
7. README with install/run steps. `.env.example` without real keys.

## Repo layout (target)
```
/CLAUDE.md                  this file
/README.md                  to write
/.github/workflows/ci-cd.yml
/server                     Express API (Node >= 20, CommonJS)
  src/app.js, index.js, db.js, ai.js, portfolio.js, routes/chat.js, routes/portfolio.js
  db/schema.sql, db/seed.js
  data/portfolio.json       SOURCE OF TRUTH for the AI (seeded into Postgres)
  test/*.test.js (health + ai, mocked fetch, no DB/key needed), Dockerfile, .env.example
/client                     Vite + React + TypeScript + Tailwind (exported from Figma Make)
  src/App.tsx               pixel-art autumn page; has ChatDialog that calls /api/chat
  src/index.css
  vite.config.ts            must be a clean config (react + tailwind + /api proxy to :4000)
/reference/week-10          course starter (read-only reference, see below)
```
If `client/` still has Figma-only plugins in `vite.config.ts` (figmaSiteConfiguration etc.), replace them with a clean config. Do not touch `client/CLAUDE.md` or `client/AGENTS.md` if they exist.

## API contract (do not change without telling me)
- `GET  /api/health` -> `{ status: "ok" }`
- `GET  /api/portfolio` -> `{ group, members }`
- `POST /api/chat` body `{ message, conversationId? }` -> `{ reply, conversationId }`
- `GET  /api/history/:conversationId` -> `{ messages: [{ role, content, created_at }] }`

## Environment variables (names only, never real values)
`server/.env` (git-ignored): `PORT`, `CLIENT_ORIGIN`, `DATABASE_URL`, `DB_SSL`, `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`.
`client/.env`: `VITE_API_URL` (empty in dev because Vite proxies /api; backend URL in production).
- Use the name `LLM_API_KEY` for the AI key. NEVER set an `ANTHROPIC_API_KEY` system environment variable (it would switch Claude Code to API billing).
- The LLM is Gemini through its OpenAI-compatible endpoint (course starter): `LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/`, `LLM_MODEL=gemini-3.5-flash-lite`. Request: `POST {LLM_BASE_URL}chat/completions`, header `Authorization: Bearer LLM_API_KEY`, body `{model, messages:[{role:'system',...}, ...history]}`, 25 s timeout. Quota error 429 -> return 429, other AI errors -> 502.

## Data rules
- The portfolio text lives in `server/data/portfolio.json` and must match the member list hardcoded in `client/src/App.tsx`. After editing it run `npm run seed` in `server/`.
- Placeholders ("Teammate A", "Name to be added", made-up email `autumnbyteguild@gmail.com`) are NOT real. Never invent facts about people. If real data is missing, keep the placeholder and list it for me at the end.
- Member 1 (me): Punnawit (Beam) Surarak, role: backend, AI integration, database, CI/CD. Projects: BU ParkView (AI smart parking), the DNA Scholarship project (AI parking-occupancy detection system with YOLO vehicle detection for the parking lot behind Building B4 at Bangkok University; Punnawit owns the AI/detection part) and the HIWWHEE "ตลอดกาลไม่มีจริง" official MV (cast).

## Work plan (do in order, one step per turn)
1. Read the repo and `reference/week-10`, then summarize what exists and what is missing. Change nothing yet.
2. Install dependencies (`server`, `client`) and run both. Fix errors. Replace `client/vite.config.ts` with a clean config if needed.
3. DONE already in `server/src/ai.js` (Gemini via OpenAI-compatible call, injection-resistant rules prompt, `db.addPair` saves user+AI messages in one transaction, MAX history 20). Just verify `npm test` passes and the call works with my real key; compare with `reference/week-10/BE/src/llm.ts` and `reply.ts` and fix differences (e.g. model name).
4. Help me create `server/.env` (I paste my own `DATABASE_URL` and key; Neon needs `DB_SSL=true`). Run `npm run seed`, start the server, test `POST /api/chat` with curl. Confirm: the answer uses portfolio data, and messages are stored in Postgres.
5. Test the chat in the browser. Show a timestamp under each message (history already returns `created_at`). Fix bugs.
6. Make `.github/workflows/ci-cd.yml` pass (use `npm install` if there is no lockfile). Tests must not need a database or a real key.
7. Write `README.md` (install, env variables, run, API list, deploy on Render + Neon, CI/CD explanation) and make sure `.gitignore` covers `.env`, `node_modules`, `dist`.
8. Final check: grep the whole repo for secrets, leftover fake data, TODOs. List everything I still must do by hand.

## Reference: course starter (week 10)
`reference/week-10` is the course's React + Express + PostgreSQL + Gemini mini chat (Docker Compose + Docker Hub + Render in the course). Use it to learn: how the Gemini call is made, `DATABASE_URL` wiring, conversation memory, timestamps, Render deploy steps.
- It is a DIFFERENT app. Our `server/` is the base because it already follows the final-project rules.
- Do not copy blocks I could not explain. Rewrite in our own style with short English comments.
- Docker is optional. The fastest path is deploying `server/` and `client/` directly on Render.
- Never commit anything from the reference folder (it is git-ignored).

## Deploy notes
- Database: Neon (free Postgres). Backend: Render Web Service, root `server`, build `npm install`, start `npm start`. Frontend: Render Static Site, root `client`, build `npm install && npm run build`, publish `dist`, env `VITE_API_URL` = backend URL; backend env `CLIENT_ORIGIN` = site URL.
- Seed the production database once: run `npm run seed` locally with `DATABASE_URL` pointing at Neon.
- GitHub repo secrets for deploy: `RENDER_BACKEND_HOOK`, `RENDER_FRONTEND_HOOK`.

## Rules for you (Claude Code)
- Never print, log, or commit secret keys. Ask before `git push`, deploy commands, or deleting files.
- Keep code simple, plain JavaScript/TypeScript, commented in plain English. Every teammate must be able to explain it.
- Do not redesign or delete the existing UI styling (pixel-art autumn theme).
- If something needs my action (creating accounts, keys, Render/Neon dashboards), stop and give exact click-by-click steps.
- After each step: say what changed, what you tested, and what is next.
