# Business Case Studio

**Version:** v0.7.0  
**Purpose:** Build, compare, govern, and communicate the financial case for internally developed, AI-assisted, and vibe-coded applications.

## Overview

Business Case Studio is a reusable decision-support application for evaluating whether an internal application is worth building, buying, operating, and continuing to invest in.

It converts assumptions about labor, AI usage, infrastructure, support, productivity, capacity, revenue influence, risk reduction, and technical debt into a structured business case with measurable outputs such as:

- Return on investment (ROI)
- Total cost of ownership (TCO)
- Net present value (NPV)
- Payback period
- Benefit-cost ratio
- Build-versus-buy comparison
- Technical-health score
- Technical-debt reserve
- Forecast-versus-actual value realization

The application is designed for more than software-development accounting. It helps business, finance, technology, and operational leaders make a defensible investment decision and understand which assumptions drive the outcome.

---

## Why Business Case Studio Exists

AI-assisted development can make an application appear inexpensive because the visible token cost is often low. The true cost includes much more:

- Employee time spent defining requirements
- Prompting, reviewing, testing, and correcting generated code
- Architecture and security work
- Integration and migration effort
- Hosting, monitoring, support, and maintenance
- Governance and compliance activities
- Technical debt and key-person dependency
- Future enhancement and change costs

At the same time, many internal applications create value that is not captured in a traditional revenue-only ROI model. Examples include:

- Administrative time eliminated
- Capacity recovered
- Better resource allocation
- Faster reporting and planning
- Avoided hiring or contractor expense
- Better data quality
- Reduced operational risk
- Earlier time to value
- Improved opportunity or partner coverage

Business Case Studio brings both sides together so the decision is based on the complete economic picture rather than token cost, developer enthusiasm, or spreadsheet optimism.

---

## Who Should Use It

Business Case Studio is useful for:

- Business application owners
- Sales Engineering and Channel leaders
- Revenue Operations and Sales Operations
- Product and Engineering leaders
- IT and Information Security
- Finance and procurement teams
- Automation and analytics teams
- Executive sponsors
- Internal innovation programs

It can be used for:

- Simple internal workflow tools
- Revenue-enablement applications
- Reporting and analytics platforms
- Automations and integrations
- AI-assisted applications
- Departmental utilities
- Customer-facing products
- Modernization initiatives
- Build-versus-buy evaluations

---

## Core Value

### 1. Creates a defensible financial case

The application converts assumptions into transparent formulas and explains where each input originates. Users can see not only the result, but also how to change it.

### 2. Right-sizes the analysis

Not every application needs every calculator. Guided Setup recommends the most relevant modules based on the application type and context.

A lightweight internal tool may require only:

- Build cost
- Annual operating cost
- One primary benefit
- Adoption assumptions
- Basic technical-health assessment

A customer-facing or revenue-enablement application may require a fuller analysis including revenue influence, governance, support, risk, and actuals tracking.

### 3. Accounts for AI-assisted development accurately

The AI Development module separates:

- Direct AI token and subscription costs
- Human prompting and review time
- Debugging and remediation effort
- Testing and documentation
- Traditional-development comparison
- Time-to-market value

This avoids the common mistake of treating AI-generated code as free labor.

### 4. Makes technical risk financially visible

The Technical Health module scores architecture, testing, documentation, security, dependencies, deployment, observability, code ownership, integration resilience, and AI portability.

The resulting score helps estimate a technical-debt reserve and highlights where the application may become expensive or fragile over time.

### 5. Supports ongoing value realization

The application is not limited to pre-launch justification. Actuals can be compared with the original forecast to measure:

- Adoption
- Benefits realized
- Run-cost variance
- Initial-investment variance
- Payback progress
- Updated ROI

### 6. Improves cross-functional alignment

Business Case Studio gives Finance, IT, Security, Engineering, and business leaders a common model. Everyone can see the assumptions, confidence level, ownership, and financial impact.

---

## Application Workflow

### Step 1: Guided Setup

Choose the application type and applicable context, such as:

- Internal or customer-facing
- Sensitive or regulated data
- AI used during development or in production
- Business-system integrations

The application recommends which modules are essential, optional, or unnecessary.

### Step 2: Profile

Define the business-case scope:

- Application or initiative name
- Department
- Executive sponsor
- Lifecycle stage
- Evaluation horizon
- Discount rate
- Benefit and cost growth assumptions
- User groups and loaded labor rates

### Step 3: Benefits

Quantify applicable value categories:

- Productivity savings
- Management and reporting savings
- Reconciliation savings
- Recovered capacity
- Contractor avoidance
- Deferred hiring
- Revenue influence
- Opportunity coverage
- Risk reduction
- Data-quality improvements

Team-specific benefit breakouts allow separate assumptions for groups such as:

- Sales Engineering
- Channel Managers
- Team Leaders
- Revenue Operations
- Customer Success
- Professional Services
- Finance
- IT
- Any custom team

### Step 4: TCO

Capture the complete ownership cost.

#### Initial build cost

- Discovery
- Architecture
- Core development
- Testing
- Security review
- Documentation
- Training and launch
- Integration and migration
- Other one-time costs

#### Recurring cost

- Hosting
- Database
- Monitoring and logging
- AI runtime
- Support
- Maintenance
- Enhancements
- Governance
- Security operations
- Training
- Technical-debt reserve

#### Build versus Buy

Compare the internal build with a commercial alternative using:

- Subscription or licensing
- Implementation services
- Integration and migration
- Training and change management
- Annual administration
- Vendor price growth
- Multi-year TCO

Non-financial considerations should also be reviewed, including fit, extensibility, data ownership, vendor lock-in, support, security, and exit cost.

### Step 5: AI Development

Record AI-assisted delivery economics:

- Input, output, and cached tokens
- Model pricing
- AI subscriptions
- Prompting time
- Code-review time
- Debugging time
- Security-remediation time
- Testing and documentation
- Traditional-build estimate
- Delivery-time improvement

### Step 6: Technical Health

Score each area from 1 to 5:

| Score | Meaning |
|---|---|
| 1 | Strong, repeatable, and documented |
| 2 | Good, with minor gaps |
| 3 | Moderate and workable, but inconsistent |
| 4 | High risk with material gaps |
| 5 | Critical, absent, unknown, or fragile |

Assessment categories:

- Architecture
- Automated testing
- Documentation
- Security validation
- Dependency health
- Deployment automation
- Observability
- Code ownership
- Integration resilience
- AI and provider portability

Score the current state rather than the planned future state.

### Step 7: Scenarios

Compare:

- Conservative
- Expected
- Upside

Scenario-specific assumptions can include:

- Adoption
- Realization
- Revenue contribution
- Win-rate improvement
- Cost growth
- Maintenance
- Technical-debt reserve

### Step 8: Assumptions

Use the Assumption Register to document:

- Assumption
- Category
- Owner
- Source
- Confidence
- Approval status

Suggested confidence levels include:

- Measured
- Validated
- Estimated
- Proxy
- Speculative

This helps distinguish evidence-backed value from directional estimates.

### Step 9: Actuals

After deployment, compare actual results with the forecast:

- Adoption
- Benefits
- Run costs
- Initial investment
- Benefit realization
- Variance
- Updated ROI and payback

### Step 10: Reports

Review executive and financial outputs and export the full business case.

---

## Key Calculations

### ROI

```text
ROI = (Total Benefits - Total Costs) / Total Costs x 100
```

### Net Benefit

```text
Net Benefit = Total Benefits - Total Costs
```

### Benefit-Cost Ratio

```text
Benefit-Cost Ratio = Total Benefits / Total Costs
```

### Payback Period

```text
Payback Months = Initial Investment / Monthly Net Benefit
```

### Net Present Value

```text
NPV = Present Value of Benefits - Present Value of Costs
```

### Productivity Benefit

```text
Annual Benefit =
Users
x Hours Saved per Week
x Loaded Hourly Rate
x Working Weeks
x Adoption Rate
x Realization Rate
```

### Recovered Capacity

```text
Recovered Capacity = Total Available Hours x Utilization Improvement
```

### Revenue Influence

```text
Revenue Benefit =
Influenced Pipeline
x Incremental Performance Improvement
x Gross Margin
x Application Contribution Factor
```

### Risk Reduction

```text
Risk-Adjusted Benefit =
Financial Exposure
x Probability of Occurrence
x Expected Risk Reduction
```

### Technical-Debt Reserve

```text
Technical-Debt Reserve =
Annual Development and Support Cost
x Reserve Percentage
```

Calculated values include information icons that explain the formula and identify which page, section, or field supplies each input.

---

## Using the Application Without Completing Every Field

Business Case Studio is designed to support partial and right-sized analysis.

You do not need to complete every page.

Recommended minimum for a small internal application:

1. Profile and evaluation horizon
2. Initial build cost
3. Annual run cost
4. One primary benefit
5. Adoption and realization assumptions
6. Basic technical-health assessment

Optional modules can be disabled through Guided Setup.

Use broader estimates when detailed evidence is unavailable, but document the source and confidence level. A smaller model with clear assumptions is more credible than a large model filled with invented precision.

---

## Draft Export and Restore

The Reports page supports portable JSON drafts.

### Export Draft JSON

The exported file includes:

- Application profile
- Application type and context
- Enabled modules
- Calculator inputs
- Selected scenario
- Team breakouts
- Assumption register
- Technical-health scores
- Build-versus-buy inputs
- Actuals
- Calculated-results snapshot
- Application version
- Export timestamp
- Draft schema identifier

### Import Draft JSON

Importing restores the editable business case.

The application recalculates results using the current calculation engine rather than blindly trusting the stored result snapshot. This allows an older draft to benefit from corrected or enhanced formulas.

Treat the exported JSON as a portable Save Draft file. Store it in an approved internal repository if the business case contains sensitive financial, staffing, or operational information.

---

## Reset Behavior

Resetting restores the sample defaults and clears the active business case, including:

- Profile
- Financial inputs
- Team breakouts
- Assumptions
- Technical-health scores
- Actuals
- Build-versus-buy data
- Scenario selection

The application requests confirmation before resetting. Export a draft first when the current data may need to be restored.

---

## Decision-Making Guidance

### Avoid double-counting

Do not count the same recovered time as all of the following unless each outcome is independently realized:

- Productivity savings
- Avoided hiring
- Additional revenue capacity
- Contractor avoidance

### Apply realization factors

A saved hour does not automatically become a financial return. Use a realization factor to represent the portion that can be redirected to productive work or avoided cost.

### Use a contribution factor for revenue

Do not assign 100% of influenced revenue to the application unless a direct causal relationship can be demonstrated.

### Separate cash cost from economic cost

Cash costs include subscriptions, hosting, vendors, and AI consumption. Economic costs include employee time and opportunity cost. Both matter.

### Use scenarios instead of one heroic forecast

Conservative, Expected, and Upside scenarios make uncertainty visible and improve executive trust.

### Revisit the model after launch

A business case should evolve from estimated value to measured value. Use Actuals to validate whether the original assumptions were accurate.

---

## Example Use Case: Revenue Enablement Application

A Sales Engineering or Channel application may create value through:

### Sales Engineering

- Reduced activity-entry time
- Faster demo and POC preparation
- Better opportunity coverage
- Improved technical-resource allocation
- Better technical-influence attribution
- Reduced leadership reporting effort

### Channel

- Improved partner-activity capture
- Better partner enablement tracking
- Campaign attribution
- Partner-sourced and partner-influenced pipeline visibility
- Better channel-resource planning
- Reduced CRM reconciliation

### Leadership

- Utilization and bandwidth analysis
- Hiring and contractor decisions
- Workload balancing
- Territory and account coverage
- Forecast preparation
- Executive reporting

Each team can be modeled separately and rolled into the overall financial model.

---

## Recommended Review Process

Before approving a business case, review it with:

- Business owner: confirms value and adoption assumptions
- Finance: validates rates, cost treatment, discount rate, and accounting assumptions
- Engineering or IT: validates build and operating effort
- Security and Privacy: validates governance and risk requirements
- Procurement: validates commercial comparison when Buy is considered
- Executive sponsor: confirms strategic relevance and funding decision

Recommended approval questions:

1. Are the largest benefits supported by evidence?
2. Have adoption and realization been discounted appropriately?
3. Are build, run, change, and governance costs included?
4. Is revenue attribution conservative and non-duplicative?
5. Has technical debt been recognized?
6. Is a commercial alternative available and fairly compared?
7. Who owns the application after launch?
8. How will actual value be measured?

---

## Current Scope

Business Case Studio v0.7.0 includes:

- Guided, right-sized setup
- Application profile
- Benefit calculators
- Team-specific benefit breakouts
- TCO modeling
- AI-development economics
- Build-versus-buy comparison
- Technical-health assessment
- Scenario modeling
- Assumption governance
- Actuals-versus-forecast
- Executive results
- Formula explanations with source locations
- Portable JSON draft export and restore
- Reset confirmation

---

## Future Enhancement Opportunities

Potential future capabilities include:

- Persistent database storage
- User authentication and role-based access
- Multiple saved business cases and portfolio views
- Approval workflows
- Evidence attachments
- Excel and PDF exports
- Salesforce and financial-system integrations
- Automated AI-token ingestion
- Sensitivity and tornado charts
- Benchmark libraries by application type
- Automated assumption-quality review
- Versioned calculation audit history
- Team-level actuals ingestion

---

## Product Positioning

> Business Case Studio provides a structured, transparent, and auditable way to determine whether an internally developed, AI-assisted, or vibe-coded application creates enough measurable value to justify its complete cost, risk, and ongoing ownership obligations.

It turns “we built something useful” into “we can show what it costs, what it returns, what could go wrong, and whether the investment is performing as planned.”
