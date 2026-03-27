# ForesightX Frontend

This frontend is now a real microservice-integrated UI aligned to the Stitch visual direction from project `2167215292630121994`.

## What changed

- replaced the previous static Stitch-export browser with a unified application shell
- wired the UI to orchestration, data, and profile services through frontend-origin `/api/*` proxies
- rebuilt the main experience around four product views: dashboard, explainability, portfolio, and alerts
- kept the downloaded Stitch exports in `public/stitch/` as local design references

## Service routing

- `/api/orchestration/*` -> orchestration service
- `/api/data/*` -> market data service
- `/api/profile/*` -> profile service

The frontend uses proxying because the backend services do not currently expose browser CORS middleware.

## Stitch references kept locally

- `Dashboard (Home)` `cdfac24b8fec4f88a45ddcac5f1b9e9c`
- `AI Explainability Panel` `b093055bc0d0434b8aa313d391b5d004`
- `Portfolio Page` `c4f8d6dd237f4850b50f95bba5afd9a8`
- `Alerts & Events Panel` `84267882cea245fabe8358d27f57114d`

## Run

- `npm install`
- `npm run dev`
- `npm run build`
