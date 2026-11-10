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

> **Status:** early MVP (v0.3.0). Runs entirely in the browser with no backend. Your model is
> autosaved in this browser only; export a draft to keep or share it. Default numbers are
> illustrative — replace them with your own approved assumptions.

## Features

| Section              | What it does                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview**         | ROI, TCO, NPV, payback, benefit-cost ratio with "how is this calculated" explanations; cumulative value chart, benefit mix, model confidence, and guardrail warnings      |
| **Profile**          | Initiative name, sponsor, currency, horizon, discount rate, growth rates, user segments, and loaded labor rates                                                           |
| **Benefits**         | Productivity, management, reconciliation, recovered capacity, contractor avoidance, one-time deferred hiring, revenue influence, opportunity coverage, and risk reduction |
| **TCO**              | Build labor (discovery through launch), run platform, support, maintenance, enhancements, governance, security, training, and a technical-debt reserve                    |
| **AI Development**   | Token economics, subscriptions, human oversight hours, traditional-build comparison, and time-to-market value                                                             |
| **Technical Health** | Ten-dimension maintainability score that drives a risk rating and a suggested technical-debt reserve                                                                      |
| **Scenarios**        | Conservative / Expected / Upside comparison and a tornado sensitivity analysis (NPV or ROI, ±10–30%)                                                                      |
| **Assumptions**      | Register with owner, source, confidence, and approval status                                                                                                              |
| **Actuals**          | Forecast-versus-actual variance, initial-investment variance, payback progress, and ROI at the actual run rate                                                            |
| **Reports**          | Executive summary, key metrics, calculation trace, export/import drafts (JSON), cash-flow CSV, and print / Save as PDF                                                    |

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

| Command           | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the Vite dev server                     |
| `npm run build`   | Type-check and produce a production build     |
| `npm run preview` | Serve the production build locally            |
| `npm test`        | Run engine and UI tests (Vitest)              |
| `npm run lint`    | Lint with ESLint                              |
| `npm run format`  | Format with Prettier                          |
| `npm run check`   | Everything CI runs: format, lint, test, build |

## Project structure

```text
src/
  App.tsx                       UI shell: navigation, pages, charts, reports
  calculations/engine.ts        Pure calculation engine (all formulas live here)
  calculations/formulas.ts      Formula registry behind the in-app explanations
  calculations/sensitivity.ts   Tornado (one-at-a-time) sensitivity analysis
  data/defaults.ts              Sample inputs, assumptions, scenario multipliers
  persistence/draft.ts          Versioned draft format, import validation, autosave
  export/csv.ts                 Cash-flow CSV export
  ui/fields.ts                  Every input's label and page location
  ui/format.ts                  Currency-aware formatting
  ui/components/                Field, FormulaInfo, SensitivityPanel, ChartTable
  types/index.ts                Input and result types
docs/METHODOLOGY.md             Formulas and decision guidance
```

The engine is a pure function (`calculateBusinessCase(inputs) → results`) with no UI
dependencies, so it can be tested and reused independently. `formulas.test.ts` perturbs each
input to prove the formula registry matches what the engine actually computes.

## Data and privacy

There is no server. Your model is autosaved to this browser's `localStorage` and never transmitted.
Anyone with access to the same browser profile can see it; use **Reset** to clear it. Exported
JSON and CSV files can contain sensitive staffing and financial data; store them accordingly. See
[SECURITY.md](SECURITY.md).

## Roadmap

Tracked as [GitHub issues](https://github.com/egarlepp/businesscase_studio/issues?q=is%3Aissue+label%3Aroadmap).
Issues labeled [`good first issue`](https://github.com/egarlepp/businesscase_studio/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
are a good place to start contributing.

**Now**

- [#17](https://github.com/egarlepp/businesscase_studio/issues/17) Build-versus-buy comparison

**Next**

- [#18](https://github.com/egarlepp/businesscase_studio/issues/18) Team-specific benefit breakouts (unblocked: drafts are now versioned, so saved
  models can be migrated)

**Later**

- [#19](https://github.com/egarlepp/businesscase_studio/issues/19) Guided setup

**Done in v0.3.0**: drafts and import ([#6](https://github.com/egarlepp/businesscase_studio/issues/6)), formula explanations ([#7](https://github.com/egarlepp/businesscase_studio/issues/7)), tornado
analysis ([#8](https://github.com/egarlepp/businesscase_studio/issues/8)), currency ([#9](https://github.com/egarlepp/businesscase_studio/issues/9)), print and CSV ([#10](https://github.com/egarlepp/businesscase_studio/issues/10)), payback with growth
([#11](https://github.com/egarlepp/businesscase_studio/issues/11)), health-based reserve ([#12](https://github.com/egarlepp/businesscase_studio/issues/12)), actuals ([#13](https://github.com/egarlepp/businesscase_studio/issues/13)), UI tests ([#14](https://github.com/egarlepp/businesscase_studio/issues/14)),
accessibility ([#15](https://github.com/egarlepp/businesscase_studio/issues/15)), and Dependabot fixes ([#16](https://github.com/egarlepp/businesscase_studio/issues/16)).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
