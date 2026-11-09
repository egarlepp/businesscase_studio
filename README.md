# Business Case Studio

[![CI](https://github.com/egarlepp/businesscase_studio/actions/workflows/ci.yml/badge.svg)](https://github.com/egarlepp/businesscase_studio/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Model the ROI, total cost of ownership, risk, and realized value of internally developed,
AI-assisted, and vibe-coded applications.

AI-assisted development makes applications look cheap because the visible token bill is small.
The real cost includes requirements, prompting, review, remediation, security, hosting, support,
governance, and technical debt. On the other side, internal tools create value that revenue-only
ROI models miss: recovered capacity, avoided hiring, faster reporting, and reduced risk.
Business Case Studio puts both sides in one transparent model.

> **Status:** early MVP (v0.2.0). Runs entirely in the browser; nothing is saved between sessions
> unless you export it. Default numbers are illustrative — replace them with your own approved
> assumptions.

## Features

| Section              | What it does                                                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview**         | ROI, TCO, NPV, payback, benefit-cost ratio, cumulative value chart, benefit mix, model confidence, and modeling guardrail warnings                               |
| **Profile**          | Initiative name, sponsor, horizon, discount rate, growth rates, user segments, and loaded labor rates                                                            |
| **Benefits**         | Productivity, management, reconciliation, recovered capacity, contractor avoidance, deferred hiring, revenue influence, opportunity coverage, and risk reduction |
| **TCO**              | Build labor (discovery through launch), run platform, support, maintenance, enhancements, governance, security, training, and a technical-debt reserve           |
| **AI Development**   | Token economics, subscriptions, human oversight hours, traditional-build comparison, and time-to-market value                                                    |
| **Technical Health** | Ten-dimension maintainability score (1 = strong, 5 = critical) that drives a risk rating                                                                         |
| **Scenarios**        | Conservative / Expected / Upside comparison with ROI chart                                                                                                       |
| **Assumptions**      | Register with owner, source, confidence, and approval status                                                                                                     |
| **Actuals**          | Forecast-versus-actual variance for adoption, benefits, and run cost                                                                                             |
| **Reports**          | Executive summary, review checklist, and JSON export                                                                                                             |

The formulas, scoring rubric, and decision guidance are documented in
[docs/METHODOLOGY.md](docs/METHODOLOGY.md).

## Getting started

Requires Node.js 20.19+ (22 recommended, see `.nvmrc`).

```bash
npm ci
```

```bash
npm run dev
```

Then open <http://localhost:5173>. To reach the dev server from another device, run
`npm run dev -- --host`.

## Scripts

| Command           | Purpose                                        |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start the Vite dev server                      |
| `npm run build`   | Type-check and produce a production build      |
| `npm run preview` | Serve the production build locally             |
| `npm test`        | Run the calculation-engine unit tests (Vitest) |
| `npm run lint`    | Lint with ESLint                               |
| `npm run format`  | Format with Prettier                           |
| `npm run check`   | Everything CI runs: format, lint, test, build  |

## Project structure

```text
src/
  App.tsx                    UI: navigation, forms, charts, reports
  calculations/engine.ts     Pure calculation engine (all formulas live here)
  calculations/engine.test.ts
  data/defaults.ts           Sample inputs, assumptions, scenario multipliers
  types/index.ts             Input and result types
docs/METHODOLOGY.md          Formulas and decision guidance
```

The engine is a pure function (`calculateBusinessCase(inputs) → results`) with no UI
dependencies, so it can be tested and reused independently.

## Data and privacy

All inputs stay in browser memory. Exported JSON files can contain sensitive staffing and
financial data; store them accordingly. See [SECURITY.md](SECURITY.md).

## Roadmap

Planned, not yet implemented:

- Import of exported JSON drafts and local persistence
- Guided setup that recommends which modules apply to a given application type
- Team-specific benefit breakouts
- Build-versus-buy comparison
- In-app formula explanations showing which field feeds each result
- Configurable currency (currently USD only)
- Sensitivity / tornado analysis
- Excel and PDF export

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
