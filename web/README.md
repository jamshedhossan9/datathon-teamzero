# ZeroScam web — scam message checker one-pager

Team Zero · University of Cyberjaya · IBM Z Datathon 2026

## Run

The page is served by our Flask app (`../app.py`) on IBM LinuxONE, which runs the real checker.

```bash
npm ci
npm run build    # builds into ../static/app, which Flask serves at / and /inbox (commit the build)
npm run dev      # development: Vite on localhost, API calls forwarded to Flask on port 38889
npm test         # vitest
```

`VITE_API_MODE` (`mock` | `api`) is set in `.env.development` / `.env.production`; both use `api` now.
`mock` keeps the original in-browser demo rules (results badged "Demo mode").

## API (served by ../app.py)

- `POST /api/check {"text": "..."}` → verdict (`scam` | `suspicious` | `legit`), scam_probability, highlighted
  keywords with positions and reasons, explanation, advice, findings, payee (who receives a payment link's money),
  masked message, latency_ms. Built from every checker layer by `../checker/webapi.py`.
- `POST /api/explain {"text": "..."}` → IBM Granite's plain-language explanation (or a short note if unavailable).
- `GET /api/stats` → measured test results and the model's top scam words (no live counters, no messages).
- `GET /demo-messages` → the made-up messages of the live inbox demo (`/inbox`).

## Data sources (worldwide dashboard)

- GASA & Feedzai — Global State of Scams 2024: https://gasa.org/knowledge-base/blog/global-state-of-scams-report-2024-1-trillion-stolen-in-12-months-gasa-feedzai
- GASA — State of Scams in Malaysia / Thailand / Taiwan 2024: https://gasa.org/knowledge-base/blog/where-did-the-billions-go-in-malaysia-thailand-taiwan
- GASA — State of Scams in Japan 2024: https://www.gasa.org/post/2024-state-of-scams-in-japan-report
- GASA & ScamAdviser — Asia Scam Report 2024: https://gasa.org/knowledge-base/blog/2024-asia-scam-report-688-billion-lost
- Map geometry: world-atlas (Natural Earth, public domain)

## UI credits

- Layout based on the 21st.dev "SaaS Template" (@waleedkibhen)
- Animated Circular Progress Bar — Magic UI (MIT)
- Marker highlight modelled on @animbits/text-highlight (21st.dev)
- shadcn/ui, lucide-react, motion, @number-flow/react, react-simple-maps
