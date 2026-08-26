# Supply Chain Control Tower

Presentation-ready Jaipur Living supply-chain control-tower concept. This is a demo only: every business record is fictional sample data, and operational rules, financial exposure, decision options, and outcomes are illustrative—not validated by Jaipur Living or intended as a production design.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/control-tower`. Build the production bundle with:

```bash
npm run build
```

## Docker

```bash
docker build -t jaipur-control-tower .
docker run --rm -p 8080:80 jaipur-control-tower
```

Open `http://localhost:8080/control-tower` (direct routes are supported by Nginx fallback).

## Data and implementation notes

- Runtime source: `src/data/generated/controlTowerV2.json`, copied from `C:\Users\sbankes\Downloads\jaipur-control-tower-v2-demo-data.json`.
- The v2 audit workbook is reference-only and is never parsed in the browser or container.
- Stack: React, Vite, TypeScript, React Router, CSS variables, Lucide React, Docker, and Nginx.
- The source model is anchored to the JSON's `meta.sourceAsOfDate`. Dates are rebased in memory by the whole-calendar-day difference between that date and today; source JSON remains unchanged.
- Decision selections and approvals exist only in React session state. They do not call an API, alter dashboard KPIs, or persist.
- No backend, database, authentication, live integrations, AI service, automated-test stack, linting, monitoring, or deployment pipeline is included.

## Manual verification

- `npm run build` passes.
- Confirm the header’s Mock Data badge and current as-of date.
- Exercise every global filter, KPI, milestone count, delay driver, queue action, vendor, and shipment drilldown; then confirm a suggested action.
- Use Reset Demo to restore the initial state.
