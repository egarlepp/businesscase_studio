# Methodology

This document describes exactly what the calculation engine (`src/calculations/engine.ts`)
computes, and how to use the results to make a defensible investment decision. If this document
and the code disagree, the code is authoritative — please open an issue.

## Contents

- [Who this is for](#who-this-is-for)
- [Calculations](#calculations)
- [Technical health](#technical-health)
- [Scenarios](#scenarios)
- [Model confidence and guardrails](#model-confidence-and-guardrails)
- [Right-sizing the analysis](#right-sizing-the-analysis)
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

### Annual benefits

| Benefit              | Formula                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Productivity         | users × (minutes saved per week ÷ 60) × loaded hourly rate × working weeks × adoption × realization |
| Management           | managers × hours saved per month × 12 × manager rate × adoption × realization                       |
| Reconciliation       | hours saved per month × 12 × analyst rate × adoption × realization                                  |
| Recovered capacity   | capacity hours per year × loaded hourly rate × capacity realization × adoption                      |
| Contractor avoidance | contractor hours avoided × contractor rate × adoption                                               |
| Deferred hiring      | FTEs deferred × months deferred × monthly loaded FTE cost × adoption                                |
| Win-rate influence   | influenced pipeline × incremental win rate × gross margin × contribution × adoption                 |
| Opportunity coverage | additional opportunities × average deal value × win rate × gross margin × contribution × adoption   |
| Risk reduction       | financial exposure × probability × expected risk reduction                                          |

**Annual benefits** is the sum of all rows.

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

For each year _t_ = 1 … _N_ (evaluation horizon):

```text
Benefits_t = annual benefits × (1 + benefit growth)^(t − 1)
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
Payback (months)    = initial cost ÷ ((annual benefits − annual run cost) ÷ 12)
```

The initial investment is treated as a year-0 outflow and is not discounted. Payback uses
year-one values and returns "Not reached" when annual run cost meets or exceeds annual benefits.

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

The health score does not currently change the technical-debt reserve automatically; set the
reserve percentage on the TCO page to reflect it.

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
- Annual run cost meets or exceeds annual benefits
- Recovered capacity and deferred hiring are both claimed (possible double counting)
- Technical risk is High or Critical

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

- **Deferred hiring recurs annually.** It is included in annual benefits and therefore repeats
  every year of the horizon, although a hiring deferral is usually a one-time saving. Set it to
  the per-year amount you expect, or zero after year one, until this is modeled separately.
- **Payback ignores growth.** It uses year-one benefits and costs.
- **Currency is USD only.** The `currency` input exists but is not yet applied to formatting.
- **No persistence.** Inputs are lost on refresh; export JSON to keep a model.
