import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  clearStoredDraft,
  getBrowserStorage,
  loadStoredDraft,
  saveStoredDraft,
  type DraftState,
} from '../persistence/draft';
import type { AssumptionItem, Inputs, ScenarioName } from '../types';
import {
  blankDraft,
  hasEnteredData,
  resolveInitialWorkspace,
  sampleDraft,
  saveWorkspacePrefs,
  WORKSPACE_KEY,
} from './workspace';

/** Probe once: storage availability does not change during a session. */
function storageWritable(storage: Storage | undefined): boolean {
  if (!storage) return false;
  const probe = `${WORKSPACE_KEY}:probe`;
  try {
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/**
 * Mode switches that other features (the welcome dialog, a guided walkthrough) can call. Each one
 * replaces the whole working case, so none of them asks for confirmation; callers that discard
 * the user's own work must confirm first.
 */
export interface WorkspaceActions {
  /** Leave the demo (or the first-launch choice) with an empty case. Erases the saved draft. */
  startBlank: () => void;
  /** Show the sample case. The user's own draft stays saved and returns on `exitDemo`. */
  enterDemo: () => void;
  /** Return from the sample case to the user's saved draft, or to a blank case if none. */
  exitDemo: () => void;
  /** Zero every figure, empty every name, and remove all assumptions. Erases the saved draft. */
  clearAllData: () => void;
  /** Replace the case with the user's own data (an import), leaving demo mode. */
  loadOwnDraft: (draft: DraftState) => void;
}

export interface WorkspaceState {
  /** The business case's own title; empty until the user names it. */
  caseName: string;
  inputs: Inputs;
  scenario: ScenarioName;
  assumptions: AssumptionItem[];
  /** True while the sample case is shown; edits are not saved. */
  demoMode: boolean;
  /** True until the user chooses between a blank case and the demo on first launch. */
  needsChoice: boolean;
  /** True when the case has no names, figures, or assumptions yet. */
  isBlank: boolean;
  canPersist: boolean;
}

export interface Workspace extends WorkspaceState, WorkspaceActions {
  setCaseName: Dispatch<SetStateAction<string>>;
  setInputs: Dispatch<SetStateAction<Inputs>>;
  setScenario: Dispatch<SetStateAction<ScenarioName>>;
  setAssumptions: Dispatch<SetStateAction<AssumptionItem[]>>;
}

export function useWorkspaceState(): Workspace {
  const [initial] = useState(() => resolveInitialWorkspace(getBrowserStorage()));
  const [canPersist] = useState(() => storageWritable(getBrowserStorage()));
  const [caseName, setCaseName] = useState(initial.draft.caseName);
  const [inputs, setInputs] = useState<Inputs>(initial.draft.inputs);
  const [scenario, setScenario] = useState<ScenarioName>(initial.draft.scenario);
  const [assumptions, setAssumptions] = useState<AssumptionItem[]>(initial.draft.assumptions);
  const [demoMode, setDemoMode] = useState(initial.demoMode);
  const [needsChoice, setNeedsChoice] = useState(initial.needsChoice);

  const show = useCallback((draft: DraftState) => {
    setCaseName(draft.caseName);
    setInputs(draft.inputs);
    setScenario(draft.scenario);
    setAssumptions(draft.assumptions);
  }, []);

  const switchTo = useCallback(
    (draft: DraftState, demo: boolean, eraseSaved: boolean) => {
      const storage = getBrowserStorage();
      if (eraseSaved) clearStoredDraft(storage);
      saveWorkspacePrefs(storage, { demoMode: demo });
      setDemoMode(demo);
      setNeedsChoice(false);
      show(draft);
    },
    [show],
  );

  const actions = useMemo<WorkspaceActions>(
    () => ({
      startBlank: () => switchTo(blankDraft(), false, true),
      enterDemo: () => switchTo(sampleDraft(), true, false),
      exitDemo: () => switchTo(loadStoredDraft(getBrowserStorage()) ?? blankDraft(), false, false),
      clearAllData: () => switchTo(blankDraft(), false, true),
      loadOwnDraft: (draft) => switchTo(draft, false, false),
    }),
    [switchTo],
  );

  // Only the user's own case is saved; demo edits and the pre-choice preview stay in memory.
  useEffect(() => {
    if (canPersist && !demoMode && !needsChoice)
      saveStoredDraft(getBrowserStorage(), { caseName, inputs, scenario, assumptions });
  }, [canPersist, demoMode, needsChoice, caseName, inputs, scenario, assumptions]);

  const isBlank = !hasEnteredData({ caseName, inputs, scenario, assumptions });

  return {
    caseName,
    setCaseName,
    inputs,
    scenario,
    assumptions,
    demoMode,
    needsChoice,
    isBlank,
    canPersist,
    setInputs,
    setScenario,
    setAssumptions,
    ...actions,
  };
}

const WorkspaceContext = createContext<(WorkspaceState & WorkspaceActions) | null>(null);

export const WorkspaceProvider = WorkspaceContext.Provider;

/** Read the workspace mode and call its actions from any component under `App`. */
export function useWorkspace(): WorkspaceState & WorkspaceActions {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('useWorkspace must be used inside <WorkspaceProvider>.');
  return value;
}
