# chat-portfolio-client

React + Vite + Tailwind CSS website for **Autumn Byte Guild** (2 members: Punnawit Surarak and Pitchayuth Pitchayakasorn): a pixel-art autumn portfolio page with an AI chat. The backend is the Express API in `../server`; the root `README.md` has the full project guide.

## Run

- `npm run dev`: website on http://localhost:5173. Every `/api` request is forwarded to the API on port 4000, so start `npm run dev` in `../server` too.
- `npm run typecheck`, `npm run build` (output in `dist/`), `npm run preview`.
- Node 22 (`.mise.toml`). npm with `package-lock.json`.

## Files

- `src/App.tsx`: the whole page (hero, about, member cards, contact), the chat window (`ChatDialog`) and the member list.
- `src/game.tsx`: game layer (XP, levels, achievements, pop-ups, Konami code), saved in `localStorage`.
- `src/index.css`: all styles. Tailwind v4 is imported first, then plain CSS for the pixel-art theme.
- `vite.config.ts`: React + Tailwind plugins, `@` alias for `src`, dev port 5173, `/api` proxy to port 4000.
- `public/favicon.png`, `public/members/*.jpg`: site icon and member photos.
- `.env.example`: `VITE_API_URL` (empty in dev; the backend URL in production).

## Rules

- The member data in `src/App.tsx` must match `../server/data/portfolio.json` (the AI reads that file). After changing it, run `npm run seed` in `../server`.
- Keep the pixel-art autumn style; keep code simple and commented in plain English.
- Respect `prefers-reduced-motion` for any new animation.
