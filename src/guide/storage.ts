import { VALUE_LEVERS, isAudienceId, type ValueLever } from './audiences';
import { GUIDE_STEPS, type Answer, type GuideAnswers, type Stage } from './steps';

export const GUIDE_STORAGE_KEY = 'business-case-studio:guide';

/** Walkthrough progress. Kept apart from the draft so exports and resets do not touch it. */
export interface GuideState {
  /** Null until the setup questions are answered. */
  answers: GuideAnswers | null;
  /** The step the user was last on. */
  stepId: string | null;
  /** Steps marked done. */
  done: string[];
  /** The first-visit invitation was dismissed. */
  introDismissed: boolean;
}

export const emptyGuideState = (): GuideState => ({
  answers: null,
  stepId: null,
  done: [],
  introDismissed: false,
});

const STAGES: Stage[] = ['idea', 'built', 'live'];
const ANSWERS: Answer[] = ['yes', 'no', 'unsure'];
const LEVERS = VALUE_LEVERS.map((l) => l.id);
const STEP_IDS = new Set(GUIDE_STEPS.map((s) => s.id));

function parseAnswers(value: unknown): GuideAnswers | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!isAudienceId(v.audience)) return null;
  const stage = STAGES.includes(v.stage as Stage) ? (v.stage as Stage) : 'idea';
  const aiAssisted = ANSWERS.includes(v.aiAssisted as Answer) ? (v.aiAssisted as Answer) : 'unsure';
  const buyOption = ANSWERS.includes(v.buyOption as Answer) ? (v.buyOption as Answer) : 'unsure';
  const levers = Array.isArray(v.levers)
    ? (v.levers.filter((l) => LEVERS.includes(l as ValueLever)) as ValueLever[])
    : [];
  return { audience: v.audience, stage, aiAssisted, buyOption, levers };
}

/** Validates an untrusted guide state object, dropping anything unrecognized. Never throws. */
export function parseGuideValue(raw: unknown): GuideState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyGuideState();
  const v = raw as Record<string, unknown>;
  return {
    answers: parseAnswers(v.answers),
    stepId: typeof v.stepId === 'string' && STEP_IDS.has(v.stepId) ? v.stepId : null,
    done: Array.isArray(v.done)
      ? v.done.filter((id): id is string => typeof id === 'string' && STEP_IDS.has(id))
      : [],
    introDismissed: v.introDismissed === true,
  };
}

/** Parses stored guide state, dropping anything unrecognized. Never throws. */
export function parseGuideState(text: string | null): GuideState {
  if (!text) return emptyGuideState();
  try {
    return parseGuideValue(JSON.parse(text));
  } catch {
    return emptyGuideState();
  }
}

export function loadGuideState(storage: Storage | undefined): GuideState {
  try {
    return parseGuideState(storage?.getItem(GUIDE_STORAGE_KEY) ?? null);
  } catch {
    return emptyGuideState();
  }
}

export function saveGuideState(storage: Storage | undefined, state: GuideState): void {
  try {
    storage?.setItem(GUIDE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the guide still works for this session.
  }
}
