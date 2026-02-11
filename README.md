# QuizForge Prototype

QuizForge Prototype is a single-service full-stack app that accepts up to 10 study files and generates an exam-ready quiz using xAI Grok Files + Responses APIs. The app includes strict JSON validation via Zod, rich frontend rendering (LaTeX + code blocks), answer submission, scoring, and debugging output.

## Stack
- **Backend:** Express + TypeScript
- **Frontend:** Vite + TypeScript (vanilla)
- **Model:** xAI Grok Responses API + Files API
- **Validation:** Zod
- **Deploy target:** Railway (single service)

## Local development
1. Install dependencies from repo root:
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix web
   ```
2. Create `server/src/config.ts` from `server/src/config.example.ts`:
   ```ts
   export const XAI_API_KEY = "your_xai_api_key_here";
   ```
3. Ensure `server/src/config.ts` stays uncommitted (already listed in `.gitignore`).
4. Start dev mode:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5173`.

## Railway deployment (single service)
1. Push this repo to GitHub.
2. Create a Railway project from the repo root.
3. Set `XAI_API_KEY` in Railway environment variables.
4. Railway build command: `npm run build`.
5. Railway start command: `npm start`.
6. Verify deployment health:
   - `GET /api/health`

`railway.json` is included so Railway has an explicit start command and NIXPACKS builder.

## Config behavior
- Production key source: `process.env.XAI_API_KEY`
- Local fallback key source: `server/src/config.ts`
- If no key exists, API returns a clear server error.

## Limits and behavior
- Max files per request: **10**
- Max file size: **20MB each**
- Accepted source types depend on what Grok can interpret from uploaded files.
- OCR for image-heavy files is model-dependent/optional.
- If source material is insufficient, Grok is instructed to reduce `question_count` and explain this in `source_summary`.

## Scripts
### Root
- `npm run dev` — run server + web concurrently
- `npm run build` — build server then web
- `npm start` — run compiled server (`server/dist/index.js`)

### Server
- `npm run dev --prefix server`
- `npm run build --prefix server`
- `npm run start --prefix server`

### Web
- `npm run dev --prefix web`
- `npm run build --prefix web`
- `npm run preview --prefix web`
