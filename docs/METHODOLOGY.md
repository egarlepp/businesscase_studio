# Methodology

This document describes exactly what the calculation engine (`src/calculations/engine.ts`)
computes, and how to use the results to make a defensible investment decision. If this document
and the code disagree, the code is authoritative — please open an issue.

## Contents

- [Who this is for](#who-this-is-for)
- [Calculations](#calculations)
- [Technical health](#technical-health)
- [Scenarios](#scenarios)
- [Sensitivity analysis](#sensitivity-analysis)
- [Actuals](#actuals)
- [Build versus buy](#build-versus-buy)
- [Model confidence and guardrails](#model-confidence-and-guardrails)
- [Right-sizing the analysis](#right-sizing-the-analysis) (including [scope](#scope-and-module-tiers))
- [Presenting the case](#presenting-the-case)
- [Decision guidance](#decision-guidance)
- [Recommended review process](#recommended-review-process)
- [Known limitations](#known-limitations)

## Who this is for

Business application owners, Finance, IT and Security, Product and Engineering leaders, Revenue
and Sales Operations, and executive sponsors evaluating whether an internal application — workflow
tool, automation, reporting platform, AI-assisted build, or revenue-enablement app — is worth
building, operating, and continuing to fund.

## Calculations

All rates (adoption, realization, margin, contribution, probabilities) are clamped to 0–100%.

### Recurring annual benefits

| Benefit              | Formula                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Productivity         | users × (minutes saved per week ÷ 60) × loaded hourly rate × working weeks × adoption × realization |
| Management           | managers × hours saved per month × 12 × manager rate × adoption × realization                       |
| Reconciliation       | hours saved per month × 12 × analyst rate × adoption × realization                                  |
| Recovered capacity   | capacity hours per year × loaded hourly rate × capacity realization × adoption                      |
| Contractor avoidance | contractor hours avoided × contractor rate × adoption                                               |
| Win-rate influence   | influenced pipeline × incremental win rate × gross margin × contribution × adoption                 |
| Opportunity coverage | additional opportunities × average deal value × win rate × gross margin × contribution × adoption   |
| Risk reduction       | financial exposure × probability × expected risk reduction                                          |

**Annual benefits** is the sum of all rows: the year-one recurring benefit. It drives the
recurring benefit mix chart, time-to-market value, and the Actuals comparison.

### Value claims

Every benefit belongs to a value type, and a value type counts only while it is claimed on the
Benefits page. The four original types (time saved, capacity and headcount, revenue influence, risk
reduction) are claimed in the sample case and in drafts saved before v0.7.0; the others are opt-in.

| Value type                     | Formula (year one)                                                                                                           | Default evidence |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Hard cost reduction            | annual spend retired × share of the year after the contract exit month                                                       | Hard             |
| Retention and expansion        | ARR in scope × net retention improvement × gross margin × attribution × adoption                                             | Soft             |
| Cycle-time compression         | revenue through the process × gross margin × (days saved ÷ 365) × discount rate × adoption                                   | Soft             |
| Cash acceleration              | billed revenue × (days faster ÷ 365) × adoption × discount rate                                                              | Semi-hard        |
| Quality and rework             | (rework hours/month × 12 × loaded rate × realization + errors avoided × cost per error) × adoption                           | Soft             |
| Compliance and audit readiness | audit prep hours × analyst rate × adoption + external audit fees that stop                                                   | Semi-hard        |
| Employee ramp and retention    | (hires × weeks saved × productive hours/week × loaded rate × realization + departures avoided × replacement cost) × adoption | Soft             |
| Forecast and decision quality  | annual cost of forecast misses × improvement × adoption                                                                      | Soft             |
| Customer experience            | support contacts avoided × cost per contact × adoption                                                                       | Soft             |
| Tech debt and consolidation    | maintenance hours retired × support rate + spend on retired tools                                                            | Semi-hard        |
| Strategic optionality          | stated annual value; **reported only, never added to benefits, ROI, or NPV**                                                 | Soft (fixed)     |

Design choices:

- **Hard cost reduction** starts in the month the contracts end, not at go-live, in the annual
  cash flows and in payback. It runs at the full rate from the following year.
- **Cycle time and cash acceleration** are valued as timing, not new revenue: deals that close
  sooner were going to close anyway. The benefit is margin (or cash) brought forward, priced at the
  discount rate. Cash acceleration also reports the one-time working capital released, which is a
  balance-sheet item and is not added to benefits.
- **Evidence classes.** Each claim is hard (cash), semi-hard (a cost avoided against an existing
  budget line), or soft (productivity, experience, attributed revenue). Users can override the
  default. Soft claims are not haircut automatically, because their formulas already carry
  realization, attribution, and adoption factors; instead the model reports an **evidence-backed
  NPV and ROI** with every soft claim removed, which is the case a finance reviewer will underwrite.
- **Claim review** (Benefits page and guardrails) flags: more than three claims; no hard or
  semi-hard claim; a soft claim larger than the lead claim; claims without a baseline source; the
  double-counting pairs (time saved vs recovered capacity, compliance vs risk, tech debt vs cost
  reduction, customer experience vs retention, quality vs time saved, cycle time vs revenue
  influence); a cost reduction with no exit date; a tech-debt claim on an application with high
  technical risk; an idea-stage case without a pilot success threshold and kill criterion; and a
  build case that ignores an available commercial product.

### One-time benefits

Deferred hiring is a one-time saving: the loaded cost of each deferred hire is avoided only for the
months the hire is postponed, starting at go-live.

```text
Deferral per month      = FTE hires deferred × monthly loaded FTE cost × adoption
Hiring deferral (total) = deferral per month × min(months deferred, horizon × 12)
OneTime_t               = deferral per month × (deferral months falling in year t, 0–12)
```

A 6-month deferral lands entirely in year 1; an 18-month deferral is split 12 / 6 across years 1
and 2. One-time benefits are not subject to benefit growth, and months beyond the evaluation
horizon are excluded.

### Initial investment

```text
Build hours   = core development + discovery + architecture + testing + security review
              + documentation + training/launch
              + AI prompting + AI code review + AI debugging + AI security remediation
Build labor   = build hours × build loaded hourly rate
AI cash       = (input tokens ÷ 1M × input rate) + (output tokens ÷ 1M × output rate)
              + (cached tokens ÷ 1M × cached rate) + AI subscriptions
Initial cost  = build labor + AI cash + other initial costs
```

### Annual run cost

```text
Platform        = (hosting + database + monitoring + AI runtime) × 12
Support         = monthly support hours × support rate × 12
Maintenance     = annual maintenance + enhancements + training
Governance      = annual governance + security
Base run cost   = platform + support + maintenance + governance
Tech-debt reserve = base run cost × reserve %
Annual run cost = base run cost + tech-debt reserve
```

### Multi-year results

For each year _t_ = 1 … _N_. The evaluation horizon _N_ is rounded to a whole number of years
and bounded to 1–50.

```text
Benefits_t = annual benefits × (1 + benefit growth)^(t − 1) + OneTime_t
Costs_t    = annual run cost × (1 + cost growth)^(t − 1)
Net_t      = Benefits_t − Costs_t
```

```text
Total benefits      = Σ Benefits_t
Total cost (TCO)    = initial cost + Σ Costs_t
Net benefit         = total benefits − TCO
ROI                 = net benefit ÷ TCO
Benefit-cost ratio  = total benefits ÷ TCO
NPV                 = −initial cost + Σ Net_t ÷ (1 + discount rate)^t
```

The initial investment is treated as a year-0 outflow and is not discounted.

**Payback** is found by simulating month by month until cumulative net value covers the initial
investment:

```text
For month m = 1, 2, …   (year index y = floor((m − 1) ÷ 12))
  Net_m = (annual benefits × (1 + benefit growth)^y − annual run cost × (1 + cost growth)^y) ÷ 12
        + deferral per month × (share of month m inside the deferral window, 0–1)
Payback = the month where Σ Net_m first reaches the initial cost, interpolated within the month
```

Growth is applied once a year, matching the multi-year cash flow, so payback is consistent with
ROI and NPV. With zero growth this reduces to `initial cost ÷ monthly net`. Payback can occur
after the evaluation horizon (a guardrail warns when it does); it returns "Not reached" if it has
not occurred within 50 years.

### AI development comparison

```text
AI-assisted build cost   = build labor + AI cash
Traditional build cost   = traditional hours × traditional rate
Development advantage    = traditional build cost − AI-assisted build cost
Time-to-market value     = months accelerated × (annual benefits ÷ 12)
```

Time-to-market value is displayed for context and is **not** added to total benefits.

### Recovered capacity in FTEs

```text
Equivalent FTE = capacity hours recovered per year ÷ productive hours per FTE per year
```

## Technical health

Score each dimension on the current state, not the planned future state.

| Score | Meaning                                 |
| ----- | --------------------------------------- |
| 1     | Strong, repeatable, and documented      |
| 2     | Good, with minor gaps                   |
| 3     | Moderate and workable, but inconsistent |
| 4     | High risk with material gaps            |
| 5     | Critical, absent, unknown, or fragile   |

Dimensions: architecture, automated testing, documentation, security validation, dependency
health, deployment automation, observability, code ownership, integration resilience, and AI /
provider portability.

```text
Health score = 100 − ((average score − 1) ÷ 4) × 100
```

| Health score | Technical risk |
| ------------ | -------------- |
| ≥ 80         | Low            |
| 60–79        | Moderate       |
| 40–59        | High           |
| < 40         | Critical       |

### Suggested technical-debt reserve

```text
Suggested reserve = 5% + (1 − health score ÷ 100) × 25%
```

This runs linearly from 5% at perfect health to 30% at the worst score. It is a **heuristic for
discussion, not an industry benchmark**. It is shown on the Technical Health page with an "Apply
suggested reserve" action, but is never applied automatically. A guardrail warns when the entered
reserve is more than 2.5 percentage points below the suggestion.

## Scenarios

Scenarios multiply selected base inputs. Rates are re-clamped to 100% afterward.

| Input                    | Conservative | Expected | Upside |
| ------------------------ | ------------ | -------- | ------ |
| Adoption rate            | × 0.80       | × 1      | × 1.15 |
| Realization rate         | × 0.80       | × 1      | × 1.10 |
| Capacity hours recovered | × 0.70       | × 1      | × 1.25 |
| Incremental win rate     | × 0.50       | × 1      | × 1.50 |
| Revenue contribution     | × 0.75       | × 1      | × 1.15 |
| Additional opportunities | × 0.70       | × 1      | × 1.25 |
| Annual maintenance       | × 1.20       | × 1      | × 0.90 |
| Annual enhancements      | × 1.20       | × 1      | × 1    |
| Technical-debt reserve   | × 1.20       | × 1      | × 0.85 |

Multipliers are defined in `src/data/defaults.ts`.

## Sensitivity analysis

The tornado chart on the Scenarios page flexes one driver at a time by ±10%, ±20%, or ±30% around
the selected scenario, holding everything else fixed, and plots the change in NPV or ROI. Share
inputs (adoption, realization, margin, and so on) are clamped to 0–100%. Drivers with no effect are
omitted, and the rest are sorted by swing. The analysis shows which assumptions decide the case; it
does not model correlated changes between drivers.

## Actuals

Actuals compare observed run-rate figures with the selected scenario:

```text
Variance (each line)      = actual − modeled
Actual annual net         = actual annual benefits − actual annual run cost
Net to date               = actual annual net ÷ 12 × months since launch
Payback progress          = net to date ÷ actual initial cost
Payback at actual rate    = actual initial cost ÷ (actual annual net ÷ 12)
ROI at actual run rate    = (actual benefits × N − (actual initial + actual run cost × N))
                            ÷ (actual initial + actual run cost × N)
Benefit realization       = actual annual benefits ÷ modeled recurring annual benefits
```

Actual figures are held flat (no growth) for the run-rate ROI.

## Build versus buy

The Build vs Buy page compares the internal build with a commercial product over the same
evaluation horizon and discount rate.

```text
Commercial one-time cost   = implementation + integration and migration + training
Commercial recurring_t     = (per-user price × 12 × licensed users + platform fee + administration)
                             × (1 + vendor price growth)^(t − 1)
Commercial TCO             = one-time cost + Σ recurring_t
Commercial benefits_t      = build benefits_t × benefit fit          (recurring and one-time)
Commercial NPV             = −one-time cost + Σ (commercial benefits_t − recurring_t) ÷ (1 + discount rate)^t
Commercial ROI             = (Σ commercial benefits_t − commercial TCO) ÷ commercial TCO
NPV advantage of building  = build NPV − commercial NPV
```

**Benefit fit** is the share of the modeled benefits the product would actually deliver: how well
its workflow, data, and integrations match the need. It is clamped to 0–100%. A fit of 100% is
flagged, because an off-the-shelf product rarely delivers every benefit of a purpose-built tool.

**Verdict:**

| Condition                                            | Verdict           |
| ---------------------------------------------------- | ----------------- |
| Every commercial cost is zero                        | Not configured    |
| \|NPV advantage\| ≤ 5% of the larger of the two TCOs | Too close to call |
| NPV advantage > 0                                    | Build             |
| NPV advantage < 0                                    | Buy               |

**Non-financial checklist.** Functional fit, extensibility, data ownership, vendor lock-in, exit
cost, and security and compliance are each marked as favoring build, neutral, or favoring buy. They
are tallied, never converted into money, and matter most when the verdict is a close call.

**Evidence.** Vendor figures are often the weakest inputs in the model. The page lists
assumption-register rows in the category "Build vs buy" and warns when there are none, when one has
no source, or when any is still Proxy/Speculative or in Draft.

**Guardrails** on this page: 100% benefit fit, no vendor price escalation, a per-user price with
zero licensed users, and a close-call verdict.

Drafts saved before v0.4.0 have no vendor inputs; they open with the comparison not configured
rather than borrowing the sample vendor figures.

## Model confidence and guardrails

**Model confidence** is a heuristic (64–100%) that rises with adoption and realization
assumptions and with strong testing, security, and documentation scores. Treat it as a prompt for
discussion, not a statistical confidence interval.

**Guardrail warnings** are raised when:

- Adoption is modeled at 100%
- Revenue contribution exceeds 25%
- Incremental win-rate improvement exceeds 3 percentage points
- No technical-debt reserve or no annual maintenance is included
- AI spend is included with zero human oversight hours
- Recurring annual run cost meets or exceeds recurring annual benefits
- Recovered capacity and deferred hiring are both claimed (possible double counting)
- Technical risk is High or Critical
- The entered technical-debt reserve is well below the suggested reserve
- Payback falls after the evaluation horizon

## Right-sizing the analysis

You do not need to complete every field. Leave inapplicable benefits at zero. A credible minimum
for a small internal tool:

1. Profile and evaluation horizon
2. Initial build cost
3. Annual run cost
4. One primary benefit
5. Adoption and realization assumptions
6. Basic technical-health assessment

A smaller model with documented assumptions is more credible than a large model filled with
invented precision.

### Scope and module tiers

The **Scope** panel on the Profile page (also asked in the guided walkthrough) records what kind of
application the case is for: application type, who uses it, data sensitivity, AI coding tools,
AI in production, integrations, whether a commercial product exists, and stage. The answers mark
each optional page as essential, optional, or not applicable. The user can override any tier.

| Page             | Essential when                                                             | Not applicable when                |
| ---------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| AI Development   | Built with AI coding tools                                                 | Not built with AI coding tools     |
| Build vs Buy     | A commercial product could do the job                                      | No commercial product does the job |
| Technical Health | Customer-facing, personal or regulated data, many integrations, or AI-core | Only when the user turns it off    |
| Actuals          | Live in production                                                         | Idea or proposal                   |

Scope never removes costs. A page that is not applicable keeps its inputs, the guide skips it,
and Reports leave it out, but any cost entered there still counts in TCO and raises a guardrail.
Benefits are switched on and off per value type (claims); scope only suggests which value types
fit the application.

Scope adds guardrails for essential pieces that are still empty: production AI with no runtime
cost, sensitive data with no security review or annual security cost, regulated data with no
governance cost, a customer-facing app with no monitoring, many integrations with no architecture
hours, and essential pages with nothing entered. The Reports page lists the scope, the tier of
each page, what was left out and why, and value types that fit but are not claimed.

## Presenting the case

**Pitch audiences.** IT manager, CIO / CTO, CFO / Finance, CRO / Sales leader, COO / Operations,
CISO / Risk, and Board / Investment committee each name the metrics to lead with, the modeling
scenario to present first, the pages they scrutinize, a storyline, and the questions to expect.
Audiences change what is emphasized, never the figures.

**AI briefing pack.** The Reports page builds one Markdown document (`src/export/briefingPack.ts`)
to paste into or attach to an AI assistant that writes a memo, a slide deck, or both. It holds:

- Results for all three scenarios and the ROI with soft claims removed
- Each claimed value type with its evidence class and baseline source
- Costs, cash flow, and the inputs that move NPV most (from the sensitivity analysis)
- Scope and module tiers, the assumption register, and guardrail warnings
- The pilot success threshold and the kill criterion

Every figure is formatted from the engine's results before export, so the assistant has nothing to
compute. The prompt follows the chosen audience's storyline and questions, and tells the assistant
to quote figures exactly, not to calculate, round, convert, or invent anything, to name the
scenario behind every result, and to keep every risk and caveat. Free text from the case (names,
assumptions, baseline sources) is marked as data, not instructions. The app never calls an AI
service; review the output against the Reports page before presenting it.

## Decision guidance

**Avoid double counting.** Do not claim the same recovered time as productivity savings, avoided
hiring, contractor avoidance, and added revenue capacity unless each outcome is independently
realized.

**Apply realization factors.** A saved hour does not automatically become a financial return. Use
realization to represent the share redirected to productive work or avoided cost.

**Use a contribution factor for revenue.** Do not attribute 100% of influenced revenue to the
application without demonstrated causality.

**Separate cash cost from economic cost.** Subscriptions, hosting, and AI consumption are cash.
Employee time is economic cost. Both matter.

**Use scenarios instead of one heroic forecast.** Conservative, Expected, and Upside make
uncertainty visible.

**Revisit after launch.** Use Actuals to move from estimated to measured value.

**Don't treat AI-generated code as free labor.** Prompting, review, debugging, and security
remediation hours are part of the build cost.

## Recommended review process

| Reviewer             | Validates                                           |
| -------------------- | --------------------------------------------------- |
| Business owner       | Value and adoption assumptions                      |
| Finance              | Labor rates, cost treatment, discount rate          |
| Engineering / IT     | Build and operating effort, technical-health scores |
| Security and Privacy | Governance and risk requirements                    |
| Procurement          | Commercial alternatives, if Buy is considered       |
| Executive sponsor    | Strategic relevance and funding decision            |

Approval questions:

1. Are the largest benefits supported by evidence?
2. Have adoption and realization been discounted appropriately?
3. Are build, run, change, and governance costs included?
4. Is revenue attribution conservative and non-duplicative?
5. Has technical debt been recognized?
6. Is a commercial alternative available and fairly compared?
7. Who owns the application after launch?
8. How will actual value be measured?

## Known limitations

- **Single population.** Productivity uses one user group and one blended rate; team-specific
  breakouts are planned.
- **Currency formatting only.** Changing currency changes how amounts are displayed; it does not
  convert values.
- **One-at-a-time sensitivity.** The tornado analysis does not capture interactions between
  drivers.
- **Browser-only storage.** Models are saved in one browser; use Save file and Open file to move or share them as JSON.
- **Same timing for both options.** Build vs buy assumes the commercial product starts delivering
  benefits on the same schedule as the build; faster time to value for either option is not yet
  modeled. The benefit fit is one blended percentage, not per benefit line.
