import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Calculator,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Compass,
  Download,
  Eraser,
  FolderOpen,
  FileSpreadsheet,
  FileText,
  Gauge,
  HeartPulse,
  Printer,
  Save,
  Scale,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { calculateActuals, calculateBusinessCase } from './calculations/engine';
import { FORMULAS, getFormula } from './calculations/formulas';
import { applyScenario, BUILD_VS_BUY_CATEGORY, SCENARIOS } from './data/defaults';
import { buildCashFlowCsv, downloadFile, fileSlug } from './export/csv';
import { createDraftFile, getBrowserStorage, parseDraftText } from './persistence/draft';
import type { Inputs } from './types';
import { blankAssumption } from './data/assumptions';
import { CaseTitle } from './ui/components/CaseTitle';
import { AssumptionRegister } from './ui/components/AssumptionRegister';
import { BuildVsBuyPanel } from './ui/components/BuildVsBuyPanel';
import { buildVsBuyHeadline, checklistTally } from './ui/buildVsBuy';
import { ChartTable } from './ui/components/ChartTable';
import { Field } from './ui/components/Field';
import { FormulaDetails, FormulaInfo } from './ui/components/FormulaInfo';
import { SensitivityPanel } from './ui/components/SensitivityPanel';
import { formatFormulaValue } from './ui/display';
import { FIELD_GROUPS, type Section } from './ui/fields';
import { createFormatters } from './ui/format';
import { WhatsNewDialog } from './ui/components/WhatsNewDialog';
import { CHANGELOG, readLastSeenVersion, writeLastSeenVersion } from './data/changelog';
import { APP_VERSION } from './version';
import { getAudience } from './guide/audiences';
import { stepsFor } from './guide/steps';
import { loadGuideState, saveGuideState, type GuideState } from './guide/storage';
import { AudienceBriefing } from './ui/components/AudienceBriefing';
import { Walkthrough } from './ui/components/Walkthrough';
import { HintTooltip } from './ui/components/HintTooltip';
import { confidenceBand, explainScenario } from './ui/explainers';
import {
  DemoBanner,
  DemoToggle,
  OverviewEmptyState,
  WelcomeDialog,
} from './ui/components/Workspace';
import { useWorkspaceState, WorkspaceProvider } from './workspace/useWorkspace';

const SECTIONS: Array<[Section, LucideIcon]> = [
  ['Overview', BarChart3],
  ['Profile', BriefcaseBusiness],
  ['Benefits', Sparkles],
  ['TCO', CircleDollarSign],
  ['Build vs Buy', ShoppingCart],
  ['AI Development', Bot],
  ['Technical Health', HeartPulse],
  ['Scenarios', Scale],
  ['Assumptions', ClipboardList],
  ['Actuals', Target],
  ['Reports', FileText],
];

const CHART_COLORS = { benefits: '#2f7d5b', costs: '#c2410c', net: '#5f49d7', bar: '#5f49d7' };

/** Heading and report name for a case that has not been named yet. */
const UNTITLED = 'Untitled business case';
const NO_VALUE = '—';

type ImportStatus = { kind: 'success' | 'error'; message: string; details: string[] } | null;

function App() {
  const workspace = useWorkspaceState();
  const {
    inputs: base,
    setInputs: setBase,
    scenario,
    setScenario,
    assumptions,
    setAssumptions,
    caseName: ownCaseName,
    setCaseName,
    canPersist,
    demoMode,
  } = workspace;
  const [section, setSection] = useState<Section>('Overview');
  /** Heading, report title, and file name: the case's own name, else the application name. */
  const caseName = ownCaseName.trim() || base.applicationName.trim() || UNTITLED;
  const fileBase = fileSlug(ownCaseName.trim() || base.applicationName);
  const [importStatus, setImportStatus] = useState<ImportStatus>(null);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const [hasUnseenRelease, setHasUnseenRelease] = useState(
    () => readLastSeenVersion(getBrowserStorage()) !== APP_VERSION,
  );
  const openWhatsNew = () => {
    setWhatsNewOpen(true);
    setHasUnseenRelease(false);
    writeLastSeenVersion(getBrowserStorage(), APP_VERSION);
  };
  const fileInput = useRef<HTMLInputElement>(null);
  const [guide, setGuide] = useState<GuideState>(() => loadGuideState(getBrowserStorage()));
  const [guideOpen, setGuideOpen] = useState(false);
  const audience = guide.answers ? getAudience(guide.answers.audience) : null;
  const navigate = useCallback((next: Section) => setSection(next), []);
  useEffect(() => {
    saveGuideState(getBrowserStorage(), guide);
  }, [guide]);
  const openGuide = (editAnswers = false) => {
    if (editAnswers && guide.answers) setGuide((g) => ({ ...g, answers: null }));
    setGuideOpen(true);
  };

  const fmt = useMemo(() => createFormatters(base.currency), [base.currency]);
  /** Payback of a case with no figures is meaningless: show a dash instead of "0.0 months". */
  const payback = (months: number | null, hasFigures: boolean) =>
    hasFigures ? fmt.months(months) : NO_VALUE;
  const modeled = useMemo(() => applyScenario(base, scenario), [base, scenario]);
  const r = useMemo(() => calculateBusinessCase(modeled), [modeled]);
  const actuals = useMemo(() => calculateActuals(modeled, r), [modeled, r]);
  const hasFigures = r.totalCosts > 0 || r.totalBenefits > 0;
  const scenarioData = useMemo(
    () =>
      SCENARIOS.map((name) => {
        const x = calculateBusinessCase(applyScenario(base, name));
        return {
          name,
          roi: x.roi,
          npv: x.npv,
          totalCosts: x.totalCosts,
          totalBenefits: x.totalBenefits,
          payback: x.paybackMonths,
          hasFigures: x.totalCosts > 0 || x.totalBenefits > 0,
        };
      }),
    [base],
  );

  const update = (key: keyof Inputs, value: string | number) =>
    setBase((current) => ({ ...current, [key]: value }));

  const benefitMix = Object.entries(r.benefitBreakdown).map(([key, value]) => ({
    name: getFormula(key)?.label ?? key,
    value,
  }));
  const cash = r.annualBreakdown.map((x) => ({ ...x, label: `Year ${x.year}` }));

  const clearAllData = () => {
    const message = demoMode
      ? 'Clear all data and start a blank business case? This leaves demo mode and also erases the case saved in this browser. Use Save file first if you need to keep it.'
      : 'Clear all data? Every figure is set to zero and every name and assumption is removed, including the copy saved in this browser. Use Save file first if you need to keep it.';
    if (!window.confirm(message)) return;
    workspace.clearAllData();
    setImportStatus(null);
  };

  const exportDraft = () => {
    const file = createDraftFile(
      { caseName: ownCaseName, inputs: base, scenario, assumptions },
      r,
      APP_VERSION,
      { guide },
    );
    downloadFile(`${fileBase}.json`, JSON.stringify(file, null, 2), 'application/json');
  };

  const exportCsv = () =>
    downloadFile(
      `${fileBase}-cash-flow.csv`,
      buildCashFlowCsv(r, fmt.currency),
      'text/csv;charset=utf-8',
    );

  const importDraft = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5_000_000) {
      setImportStatus({ kind: 'error', message: 'The file is larger than 5 MB.', details: [] });
      return;
    }
    const result = parseDraftText(await file.text());
    if (!result.ok) {
      setImportStatus({ kind: 'error', message: result.error, details: [] });
      return;
    }
    const incoming =
      result.state.caseName || result.state.inputs.applicationName.trim() || UNTITLED;
    // Nothing to lose when the user's own case is still empty and is what is on screen.
    const overwrites = demoMode || !workspace.isBlank;
    const replaced = demoMode ? 'your own case saved in this browser' : `"${caseName}"`;
    if (
      overwrites &&
      !window.confirm(
        `Open "${incoming}" from ${file.name}? It replaces ${replaced}. Save the current case to a file first if you want to keep it.`,
      )
    )
      return;
    workspace.loadOwnDraft(result.state);
    // Walkthrough answers travel with the case; keep the current ones when the file has none.
    if (result.guide) setGuide({ ...result.guide, introDismissed: true });
    setImportStatus({
      kind: 'success',
      message: `Opened "${incoming}".`,
      details: result.warnings,
    });
  };

  const importStatusBanner = importStatus && (
    <div className={importStatus.kind === 'error' ? 'warning' : 'success'}>
      {importStatus.kind === 'error' ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
      <div>
        <span>{importStatus.message}</span>
        {importStatus.details.length > 0 && (
          <ul>
            {importStatus.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        className="icon-button status-dismiss"
        aria-label="Dismiss message"
        onClick={() => setImportStatus(null)}
      >
        <X size={16} />
      </button>
    </div>
  );

  const metricCard = (
    formulaId: string,
    label: string,
    value: string,
    detail: string,
    featured = false,
  ) => (
    <article className={featured ? 'metric featured' : 'metric'}>
      <div className="metric-top">
        <span>{label}</span>
        <FormulaInfo id={formulaId} inputs={modeled} results={r} fmt={fmt} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );

  const scenarioTable = (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">Scenario comparison</caption>
        <thead>
          <tr>
            <th scope="col">Scenario</th>
            <th scope="col">Benefits</th>
            <th scope="col">TCO</th>
            <th scope="col">NPV</th>
            <th scope="col">ROI</th>
            <th scope="col">Payback</th>
          </tr>
        </thead>
        <tbody>
          {scenarioData.map((x) => (
            <tr key={x.name} className={scenario === x.name ? 'selected-row' : ''}>
              <th scope="row">
                <button
                  type="button"
                  className="link-button"
                  aria-pressed={scenario === x.name}
                  onClick={() => setScenario(x.name)}
                >
                  {x.name}
                </button>
              </th>
              <td>{fmt.money(x.totalBenefits)}</td>
              <td>{fmt.money(x.totalCosts)}</td>
              <td>{fmt.money(x.npv)}</td>
              <td>{fmt.percent(x.roi)}</td>
              <td>{payback(x.payback, x.hasFigures)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const warningList = (
    <div className="warning-list">
      {r.warnings.length ? (
        r.warnings.map((w) => (
          <div className="warning" key={w}>
            <AlertTriangle size={17} />
            <span>{w}</span>
          </div>
        ))
      ) : (
        <div className="success">
          <CheckCircle2 size={18} />
          <span>No material modeling warnings.</span>
        </div>
      )}
    </div>
  );

  const groups = FIELD_GROUPS[section];
  const guideHighlights = new Set<keyof Inputs>(
    guideOpen && guide.answers
      ? (stepsFor(guide.answers)
          .find((s) => s.id === guide.stepId)
          ?.examples.map((e) => e.key) ?? [])
      : [],
  );

  return (
    <WorkspaceProvider value={workspace}>
      <div className={guideOpen ? 'app-shell guide-open' : 'app-shell'}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <BriefcaseBusiness size={22} />
            </div>
            <div>
              <strong>Business Case</strong>
              <span className="brand-sub">
                Studio
                <button
                  type="button"
                  className={hasUnseenRelease ? 'version-pill unseen' : 'version-pill'}
                  aria-label={`Version ${APP_VERSION}${hasUnseenRelease ? ', new updates' : ''}. Show what's new`}
                  title="What's new"
                  onClick={openWhatsNew}
                >
                  v{APP_VERSION}
                </button>
              </span>
            </div>
          </div>
          <nav aria-label="Sections">
            {SECTIONS.map(([name, Icon]) => (
              <button
                type="button"
                key={name}
                className={section === name ? 'nav-item active' : 'nav-item'}
                aria-current={section === name ? 'page' : undefined}
                aria-label={name}
                title={name}
                onClick={() => setSection(name)}
              >
                <Icon size={18} />
                <span>{name}</span>
                {audience?.focusSections.includes(name) ? (
                  <span className="focus-dot" title={`Key page for ${audience.title}`}>
                    <span className="sr-only">Key page for {audience.title}</span>
                  </span>
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ))}
          </nav>
          <HintTooltip
            placement="top"
            className="sidebar-note-anchor"
            content={
              <>
                <strong>
                  {r.confidenceScore}% model confidence · {r.technicalRisk} technical risk
                </strong>
                <span>
                  How far the {scenario} figures can be trusted. A base of 55 points, plus up to 12
                  for adoption and 10 for benefit realization, plus 3 to 8 points each for testing,
                  security, and documentation (the higher amount when scored Strong or Good on
                  Technical Health).
                </span>
                <span>{confidenceBand(r.confidenceScore)}</span>
                <span>
                  Technical risk comes from the average of the ten Technical Health scores: Low,
                  Moderate, High, or Critical. Higher risk calls for a larger technical debt
                  reserve.
                </span>
              </>
            }
          >
            {(describedBy) => (
              <div
                className="sidebar-note"
                tabIndex={0}
                aria-label={`${r.confidenceScore}% model confidence, ${r.technicalRisk} technical risk`}
                aria-describedby={describedBy}
              >
                <Gauge size={18} />
                <div>
                  <strong>{r.confidenceScore}% model confidence</strong>
                  <span>{r.technicalRisk} technical risk</span>
                </div>
              </div>
            )}
          </HintTooltip>
        </aside>
        <main id="main" tabIndex={-1}>
          <header>
            <div>
              <span className="eyebrow">BUSINESS CASE / {section.toUpperCase()}</span>
              <CaseTitle
                caseName={ownCaseName}
                applicationName={base.applicationName}
                untitled={UNTITLED}
                onRename={setCaseName}
              />
              <p>Quantify value, ownership cost, delivery economics, and realized outcomes.</p>
            </div>
            <div className="header-actions">
              <div className="scenario-tabs" role="group" aria-label="Scenario">
                {SCENARIOS.map((x) => {
                  const info = explainScenario(x);
                  return (
                    <HintTooltip
                      key={x}
                      content={
                        <>
                          <strong>{x}</strong>
                          <span>{info.summary}</span>
                          {info.adjustments.length > 0 && (
                            <ul>
                              {info.adjustments.map((a) => (
                                <li key={a}>{a}</li>
                              ))}
                            </ul>
                          )}
                          {info.adjustments.length > 0 && (
                            <span className="tooltip-note">
                              Changes apply to your Expected inputs. Rates are capped at 100%.
                            </span>
                          )}
                        </>
                      }
                    >
                      {(describedBy) => (
                        <button
                          type="button"
                          className={scenario === x ? 'selected' : ''}
                          aria-pressed={scenario === x}
                          aria-describedby={describedBy}
                          onClick={() => setScenario(x)}
                        >
                          {x}
                        </button>
                      )}
                    </HintTooltip>
                  );
                })}
              </div>
              <button
                type="button"
                className={guideOpen ? 'reset guide-toggle active' : 'reset guide-toggle'}
                aria-pressed={guideOpen}
                onClick={() => (guideOpen ? setGuideOpen(false) : openGuide())}
              >
                <Compass size={16} />
                Guide
              </button>
              <DemoToggle />
              <button
                type="button"
                className="reset"
                title="Download this business case as a JSON file you can open later"
                onClick={exportDraft}
              >
                <Save size={16} />
                Save file
              </button>
              <button
                type="button"
                className="reset"
                title="Open a business case JSON file saved earlier"
                onClick={() => fileInput.current?.click()}
              >
                <FolderOpen size={16} />
                Open file
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="sr-only"
                tabIndex={-1}
                aria-label="Open business case file"
                onChange={importDraft}
              />
              <button type="button" className="reset" onClick={clearAllData}>
                <Eraser size={16} />
                Clear data
              </button>
              <span className="save-state" role="status">
                {!canPersist
                  ? 'Not saved: browser storage unavailable'
                  : demoMode
                    ? 'Demo data: changes are not saved'
                    : 'Saved in this browser'}
              </span>
            </div>
          </header>

          {demoMode && <DemoBanner />}

          <div role="status" aria-live="polite" className="import-status no-print">
            {importStatusBanner}
          </div>

          {section === 'Overview' && (
            <>
              {!hasFigures && (
                <OverviewEmptyState onNavigate={setSection} onStartGuide={() => openGuide()} />
              )}
              <section className="metric-grid" aria-label="Key metrics">
                {metricCard(
                  'roi',
                  `${r.annualBreakdown.length}-year ROI`,
                  fmt.percent(r.roi),
                  `${fmt.money(r.netBenefit)} net benefit`,
                  true,
                )}
                {metricCard(
                  'totalCosts',
                  'Total cost of ownership',
                  fmt.money(r.totalCosts),
                  `${fmt.money(r.initialCost)} initial investment`,
                )}
                {metricCard(
                  'npv',
                  'Net present value',
                  fmt.money(r.npv),
                  `${fmt.percent(modeled.discountRate)} discount rate`,
                )}
                {metricCard(
                  'paybackMonths',
                  'Payback',
                  payback(r.paybackMonths, hasFigures),
                  `${r.benefitCostRatio.toFixed(2)}× benefit-cost ratio`,
                )}
              </section>
              {hasFigures && (
                <>
                  <section className="dashboard-grid">
                    <article className="panel chart-panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Cumulative business value</h2>
                          <p>Annual modeled benefits and ownership costs.</p>
                        </div>
                      </div>
                      <div className="chart" aria-hidden="true">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={cash}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" />
                            <YAxis tickFormatter={fmt.moneyCompact} width={70} />
                            <Tooltip formatter={(v) => fmt.money(Number(v))} />
                            <Legend />
                            <Area
                              isAnimationActive={false}
                              type="monotone"
                              dataKey="benefits"
                              name="Benefits"
                              stroke={CHART_COLORS.benefits}
                              fill={CHART_COLORS.benefits}
                              fillOpacity={0.2}
                            />
                            <Area
                              isAnimationActive={false}
                              type="monotone"
                              dataKey="costs"
                              name="Costs"
                              stroke={CHART_COLORS.costs}
                              fill={CHART_COLORS.costs}
                              fillOpacity={0.12}
                            />
                            <Area
                              isAnimationActive={false}
                              type="monotone"
                              dataKey="cumulativeNet"
                              name="Cumulative net"
                              stroke={CHART_COLORS.net}
                              fill={CHART_COLORS.net}
                              fillOpacity={0.08}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <ChartTable
                        caption="Annual benefits, costs, and cumulative net value"
                        columns={['Year', 'Benefits', 'Costs', 'Cumulative net']}
                        rows={cash.map((y) => [
                          y.label,
                          fmt.money(y.benefits),
                          fmt.money(y.costs),
                          fmt.money(y.cumulativeNet),
                        ])}
                      />
                    </article>
                    <article className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Business-case quality</h2>
                          <p>Decision-readiness indicators.</p>
                        </div>
                      </div>
                      <dl className="score-list">
                        <div>
                          <dt>Model confidence</dt>
                          <dd>{r.confidenceScore}%</dd>
                        </div>
                        <div>
                          <dt>Technical health</dt>
                          <dd>{r.technicalHealthScore.toFixed(0)}/100</dd>
                        </div>
                        <div>
                          <dt>Technical risk</dt>
                          <dd>{r.technicalRisk}</dd>
                        </div>
                        <div>
                          <dt>Recovered capacity</dt>
                          <dd>{r.equivalentFte.toFixed(2)} FTE</dd>
                        </div>
                        <div>
                          <dt>One-time hiring deferral</dt>
                          <dd>{fmt.money(r.oneTimeBenefitBreakdown.hiringDeferral)}</dd>
                        </div>
                      </dl>
                    </article>
                  </section>
                  <section className="dashboard-grid">
                    <article className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Recurring annual benefit mix</h2>
                          <p>
                            Year-one recurring value. One-time hiring deferral is shown separately.
                          </p>
                        </div>
                      </div>
                      <div className="chart small" aria-hidden="true">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={benefitMix} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" tickFormatter={fmt.moneyCompact} />
                            <YAxis type="category" dataKey="name" width={140} />
                            <Tooltip formatter={(v) => fmt.money(Number(v))} />
                            <Bar
                              isAnimationActive={false}
                              dataKey="value"
                              name="Annual value"
                              fill={CHART_COLORS.bar}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <ChartTable
                        caption="Recurring annual benefit mix"
                        columns={['Benefit', 'Annual value']}
                        rows={benefitMix.map((b) => [b.name, fmt.money(b.value)])}
                      />
                    </article>
                    <article className="panel">
                      <div className="panel-heading">
                        <div>
                          <h2>Guardrails</h2>
                          <p>Items requiring evidence or review.</p>
                        </div>
                      </div>
                      {warningList}
                    </article>
                  </section>
                </>
              )}
            </>
          )}

          {section === 'Build vs Buy' && (
            <BuildVsBuyPanel
              inputs={modeled}
              results={r}
              assumptions={assumptions}
              fmt={fmt}
              onAddEvidence={() => {
                setAssumptions((items) => [
                  ...items,
                  { ...blankAssumption(BUILD_VS_BUY_CATEGORY), name: 'Vendor quote' },
                ]);
                setSection('Assumptions');
              }}
            />
          )}

          {groups && (
            <section className="form-layout">
              {groups.map((g) => (
                <article className="panel form-panel" key={g.title}>
                  <div className="panel-heading">
                    <div>
                      <h2>{g.title}</h2>
                      <p>{g.description}</p>
                    </div>
                  </div>
                  <div className="field-grid">
                    {g.fields.map((def) => (
                      <Field
                        key={def.key}
                        def={def}
                        highlight={guideHighlights.has(def.key)}
                        value={base[def.key]}
                        fmt={fmt}
                        onChange={update}
                      />
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}

          {section === 'AI Development' && (
            <section className="metric-grid detail" aria-label="AI development results">
              {metricCard(
                'aiAssistedBuildCost',
                'AI-assisted build',
                fmt.money(r.aiAssistedBuildCost),
                'Labor oversight + direct AI',
              )}
              {metricCard(
                'traditionalBuildCost',
                'Traditional estimate',
                fmt.money(r.traditionalBuildCost),
                `${fmt.number(base.traditionalBuildHours)} hours`,
              )}
              <article className="metric">
                <div className="metric-top">
                  <span>Development advantage</span>
                </div>
                <strong>{fmt.money(r.aiDevelopmentSavings)}</strong>
                <small>Traditional estimate − AI-assisted build</small>
              </article>
              {metricCard(
                'timeToMarketBenefit',
                'Earlier value',
                fmt.money(r.timeToMarketBenefit),
                `${base.monthsAccelerated} months accelerated`,
              )}
            </section>
          )}

          {section === 'Technical Health' && (
            <section className="dashboard-grid">
              <article className="panel health-card">
                <div className="health-score">
                  <HeartPulse size={28} />
                  <strong>{r.technicalHealthScore.toFixed(0)}</strong>
                  <span>out of 100</span>
                </div>
                <h2>{r.technicalRisk} maintainability risk</h2>
                <p>
                  The technical debt reserve currently adds{' '}
                  {fmt.money(r.costBreakdown.technicalDebt)} per year.
                </p>
              </article>
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Suggested technical-debt reserve</h2>
                    <p>A heuristic from the health score: 5% at best health, 30% at worst.</p>
                  </div>
                </div>
                <dl className="score-list">
                  <div>
                    <dt>Suggested reserve</dt>
                    <dd>{fmt.percent(r.suggestedTechnicalDebtReserveRate)}</dd>
                  </div>
                  <div>
                    <dt>Entered reserve (TCO page)</dt>
                    <dd>{fmt.percent(base.technicalDebtReserveRate)}</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  className="primary"
                  disabled={
                    Math.abs(base.technicalDebtReserveRate - r.suggestedTechnicalDebtReserveRate) <
                    0.0005
                  }
                  onClick={() =>
                    update(
                      'technicalDebtReserveRate',
                      Math.round(r.suggestedTechnicalDebtReserveRate * 1000) / 1000,
                    )
                  }
                >
                  Apply suggested reserve
                </button>
                <p className="body-copy">
                  Scores of 1 represent strong controls; scores of 5 represent critical gaps.
                  Prioritize ownership, tests, observability, and documentation before scaling
                  adoption.
                </p>
              </article>
            </section>
          )}

          {section === 'Scenarios' && (
            <section className="form-layout">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Scenario comparison</h2>
                    <p>
                      Compare value under different adoption, revenue, and maintenance assumptions.
                    </p>
                  </div>
                </div>
                {scenarioTable}
              </article>
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Scenario ROI</h2>
                    <p>ROI across the standard cases.</p>
                  </div>
                </div>
                <div className="chart" aria-hidden="true">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scenarioData.map((x) => ({ name: x.name, roi: x.roi * 100 }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                      <Bar
                        isAnimationActive={false}
                        dataKey="roi"
                        name="ROI"
                        fill={CHART_COLORS.bar}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartTable
                  caption="ROI by scenario"
                  columns={['Scenario', 'ROI']}
                  rows={scenarioData.map((x) => [x.name, fmt.percent(x.roi)])}
                />
              </article>
              <SensitivityPanel inputs={modeled} fmt={fmt} />
            </section>
          )}

          {section === 'Assumptions' && (
            <section className="form-layout">
              <article className="panel span-2">
                <div className="panel-heading">
                  <div>
                    <h2>Assumption register</h2>
                    <p>
                      Trace material inputs to owners, evidence, and approval status. Every material
                      figure should name its source.
                    </p>
                  </div>
                </div>
                <AssumptionRegister
                  items={assumptions}
                  onChange={setAssumptions}
                  categories={[...assumptions.map((a) => a.category), BUILD_VS_BUY_CATEGORY]}
                />
              </article>
            </section>
          )}

          {section === 'Actuals' && (
            <section className="dashboard-grid">
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Forecast versus actual</h2>
                    <p>Annualized realization against the {scenario} scenario.</p>
                  </div>
                </div>
                <dl className="variance-list">
                  <div>
                    <dt>Adoption</dt>
                    <dd>{fmt.percent(modeled.actualAdoptionRate)}</dd>
                    <small>{fmt.percent(actuals.adoptionVariance)} variance</small>
                  </div>
                  <div>
                    <dt>Annual recurring benefits</dt>
                    <dd>{fmt.money(modeled.actualAnnualBenefits)}</dd>
                    <small>{fmt.money(actuals.annualBenefitsVariance)} variance</small>
                  </div>
                  <div>
                    <dt>Annual run cost</dt>
                    <dd>{fmt.money(modeled.actualAnnualRunCost)}</dd>
                    <small>{fmt.money(actuals.annualRunCostVariance)} variance</small>
                  </div>
                  <div>
                    <dt>Annual net value</dt>
                    <dd>{fmt.money(actuals.actualAnnualNet)}</dd>
                    <small>{fmt.money(actuals.annualNetVariance)} variance</small>
                  </div>
                  <div>
                    <dt>Initial investment</dt>
                    <dd>{fmt.money(modeled.actualInitialCost)}</dd>
                    <small>{fmt.money(actuals.initialCostVariance)} variance</small>
                  </div>
                </dl>
              </article>
              <article className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Realization health</h2>
                    <p>How much of the modeled value is being captured.</p>
                  </div>
                </div>
                <div className="health-score">
                  <TrendingUp size={28} />
                  <strong>
                    {actuals.benefitRealization === null
                      ? '—'
                      : fmt.percent(actuals.benefitRealization)}
                  </strong>
                  <span>benefit realization</span>
                </div>
                <dl className="score-list">
                  <div>
                    <dt>Net value to date ({fmt.number(modeled.monthsSinceLaunch)} months)</dt>
                    <dd>{fmt.money(actuals.netToDate)}</dd>
                  </div>
                  <div>
                    <dt>Payback progress</dt>
                    <dd>
                      {actuals.paybackProgress === null
                        ? '—'
                        : fmt.percent(Math.max(actuals.paybackProgress, 0))}
                    </dd>
                  </div>
                  <div>
                    <dt>Payback at actual run rate</dt>
                    <dd>
                      {payback(
                        actuals.actualPaybackMonths,
                        base.actualInitialCost > 0 || actuals.actualAnnualNet !== 0,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>{r.annualBreakdown.length}-year ROI at actual run rate</dt>
                    <dd>{fmt.percent(actuals.actualRoi)}</dd>
                  </div>
                </dl>
              </article>
            </section>
          )}

          {section === 'Reports' && (
            <section className="form-layout report">
              <article className="panel report-card span-2">
                <ShieldCheck size={28} />
                <h2>Executive summary</h2>
                {hasFigures ? (
                  <p>
                    {caseName} ({scenario} scenario) is modeled to deliver{' '}
                    {fmt.money(r.totalBenefits)} in benefits against {fmt.money(r.totalCosts)} in{' '}
                    {r.annualBreakdown.length}-year TCO, producing {fmt.percent(r.roi)} ROI and{' '}
                    {fmt.money(r.npv)} NPV.{' '}
                    {r.paybackMonths === null
                      ? 'Payback is not reached.'
                      : `Payback is reached in ${fmt.months(r.paybackMonths)}.`}
                  </p>
                ) : (
                  <p>
                    {caseName} has no benefits or costs yet. Enter figures on the Benefits and TCO
                    pages to generate the summary.
                  </p>
                )}
                <div className="button-row no-print">
                  <button type="button" className="primary" onClick={exportDraft}>
                    <Download size={17} />
                    Save case file (JSON)
                  </button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => fileInput.current?.click()}
                  >
                    <Upload size={17} />
                    Open case file
                  </button>
                  <button type="button" className="secondary" onClick={exportCsv}>
                    <FileSpreadsheet size={17} />
                    Cash flow (CSV)
                  </button>
                  <button type="button" className="secondary" onClick={() => window.print()}>
                    <Printer size={17} />
                    Print / Save as PDF
                  </button>
                </div>
              </article>
              {audience && (
                <AudienceBriefing
                  audience={audience}
                  scenario={scenario}
                  results={r}
                  fmt={fmt}
                  onChangeAudience={() => openGuide(true)}
                />
              )}
              <article className="panel">
                <h2>Key metrics</h2>
                <dl className="score-list">
                  {[
                    'totalBenefits',
                    'totalCosts',
                    'initialCost',
                    'annualRunCost',
                    'npv',
                    'roi',
                    'paybackMonths',
                    'benefitCostRatio',
                  ].map((id) => {
                    const f = getFormula(id)!;
                    return (
                      <div key={id}>
                        <dt>{f.label}</dt>
                        <dd>{formatFormulaValue(f, r, fmt)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </article>
              <article className="panel">
                <h2>Guardrails</h2>
                {warningList}
              </article>
              {r.buildVsBuy.configured && (
                <article className="panel span-2">
                  <h2>Build versus buy</h2>
                  <p className="body-copy">
                    {buildVsBuyHeadline(r.buildVsBuy, fmt)} Commercial TCO{' '}
                    {fmt.money(r.buildVsBuy.buyTotalCost)} and NPV {fmt.money(r.buildVsBuy.buyNpv)}{' '}
                    versus build TCO {fmt.money(r.totalCosts)} and NPV {fmt.money(r.npv)}.
                    Non-financial factors: {checklistTally(modeled).build} favor build,{' '}
                    {checklistTally(modeled).buy} favor buy.
                  </p>
                </article>
              )}
              <article className="panel span-2">
                <h2>Scenarios</h2>
                {scenarioTable}
              </article>
              <article className="panel span-2">
                <h2>Assumptions</h2>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Assumption</th>
                        <th scope="col">Owner</th>
                        <th scope="col">Source</th>
                        <th scope="col">Confidence</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assumptions.map((a) => (
                        <tr key={a.id}>
                          <th scope="row">{a.name}</th>
                          <td>{a.owner}</td>
                          <td>{a.source}</td>
                          <td>{a.confidence}</td>
                          <td>{a.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <article className="panel span-2">
                <div className="panel-heading">
                  <div>
                    <h2>Calculation trace</h2>
                    <p>Every result, how it is calculated, and where each input is entered.</p>
                  </div>
                </div>
                <div className="trace-list">
                  {FORMULAS.map((f) => (
                    <section key={f.id} className="trace-item" aria-label={f.label}>
                      <h3>
                        <span>{f.label}</span>
                        <strong>{formatFormulaValue(f, r, fmt)}</strong>
                      </h3>
                      <FormulaDetails formula={f} inputs={modeled} results={r} fmt={fmt} />
                    </section>
                  ))}
                </div>
              </article>
              <article className="panel report-card span-2">
                <Users size={28} />
                <h2>Review checklist</h2>
                <ul>
                  <li>Finance validates labor rates and discount assumptions.</li>
                  <li>Business owners approve productivity and adoption evidence.</li>
                  <li>Engineering approves technical-health scores and reserve.</li>
                  <li>Security validates data handling and governance costs.</li>
                  <li>Actuals are reviewed quarterly after launch.</li>
                </ul>
                <p className="print-footer">
                  Business Case Studio v{APP_VERSION} · {new Date().toLocaleDateString()}
                </p>
              </article>
            </section>
          )}
          <footer className="app-footer no-print">
            <Calculator size={14} />
            <span>
              Business Case Studio{' '}
              <button
                type="button"
                className="link-button"
                aria-label={`Release notes for version ${APP_VERSION}`}
                onClick={openWhatsNew}
              >
                v{APP_VERSION}
              </button>
              . Inputs are saved only in this browser.
            </span>
          </footer>
          {whatsNewOpen && (
            <WhatsNewDialog
              releases={CHANGELOG}
              currentVersion={APP_VERSION}
              onClose={() => setWhatsNewOpen(false)}
            />
          )}
        </main>
        {guideOpen && (
          <Walkthrough
            state={guide}
            onStateChange={setGuide}
            onClose={() => setGuideOpen(false)}
            onNavigate={navigate}
            inputs={base}
            results={r}
            fmt={fmt}
            onApply={update}
          />
        )}
        {workspace.needsChoice && <WelcomeDialog onStartGuide={() => openGuide()} />}
      </div>
    </WorkspaceProvider>
  );
}

export default App;
