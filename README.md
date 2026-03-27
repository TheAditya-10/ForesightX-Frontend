# ForesightX Frontend

This frontend is now a real microservice-integrated UI aligned to the Stitch visual direction from project `2167215292630121994`.

## What changed

- replaced the previous static Stitch-export browser with a unified product shell
- added auth session flow for register, login, verify, logout, Google OAuth entry, and preview mode
- wired the UI to auth, orchestration, data, profile, and pattern services through frontend-origin `/api/*` proxies
- rebuilt the main experience around five product views: command center, explainability, portfolio, pattern lab, and alerts
- added live health surfaces, orchestration job history, pattern forecast panels, and profile trade mutation testing
- kept the downloaded Stitch exports in `public/stitch/` as local design references

## Service routing

- `/api/auth/*` -> auth service
- `/api/orchestration/*` -> orchestration service
- `/api/data/*` -> market data service
- `/api/profile/*` -> profile service
- `/api/pattern/*` -> pattern service

The frontend uses proxying because only auth and pattern expose browser CORS directly; the rest of the stack is intended to be reached through the frontend gateway.

## Stitch references kept locally

- `Dashboard (Home)` `cdfac24b8fec4f88a45ddcac5f1b9e9c`
- `AI Explainability Panel` `b093055bc0d0434b8aa313d391b5d004`
- `Portfolio Page` `c4f8d6dd237f4850b50f95bba5afd9a8`
- `Alerts & Events Panel` `84267882cea245fabe8358d27f57114d`

## Run

- `npm install`
- `npm run dev`
- `npm run build`

## Local stack testing

1. Start backend dependencies and services from the repo root:
   `docker compose up --build`
2. Open the frontend:
   `http://localhost:8080` for nginx-served Docker
   `http://localhost:5173` for Vite dev
3. Register a user or enter preview mode.
4. Use the command center to exercise:
   - auth session lifecycle
   - data price, history, indicators, and news
   - orchestration analyze and job history
   - profile portfolio and risk
   - pattern model registry and prediction endpoints
