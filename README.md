# Chat AI with Group Portfolio

Web app where visitors chat with an AI that answers questions about our group and every member.

**Stack:** React (client) · Express (server) · PostgreSQL · Anthropic API · GitHub Actions CI/CD

## Run locally

```bash
# 1. Database
createdb chat_portfolio

# 2. Server
cd server
cp .env.example .env        # fill in DATABASE_URL and LLM_API_KEY
npm install
npm run seed                # creates tables and loads data/portfolio.json
npm run dev                 # http://localhost:4000

# 3. Client (new terminal)
cd ../client
npm install
npm run dev                 # http://localhost:5173 (proxies /api to the server)
```

For production, set `VITE_API_URL` (see `client/.env.example`) to the deployed backend URL before building.

## API

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/portfolio` | `{ group, members }` |
| POST | `/api/chat` | Body `{ message, conversationId? }` → `{ reply, conversationId }` |
| GET | `/api/history/:conversationId` | `{ messages: [{ role, content, created_at }] }` |

## How the AI uses the portfolio

On every chat request the server loads the group and member data from PostgreSQL, builds a
system prompt containing all of it, and sends it with the last 20 messages of the conversation.
Both user and AI messages are saved in the `messages` table.

## CI/CD

`.github/workflows/ci-cd.yml` runs tests and builds the client on every push and pull request.
Pushes to `main` trigger deploy hooks (secrets `RENDER_BACKEND_HOOK`, `RENDER_FRONTEND_HOOK`).

## Team

See the portfolio page.

## Client features

- Portfolio page (group, members, contact) loaded from `/api/portfolio`
- Chat page with saved conversation history
- Autumn pixel-art theme: falling leaves, fireflies, music toggle (off by default, synthesized with the Web Audio API)
- Artwork credits: add the original artists' names here and in the site footer before submitting
