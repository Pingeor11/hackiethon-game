export type SuspectName =
  | "Manager"
  | "CoIdol"
  | "Director"
  | "Fan"
  | "Executive";

export type NPCName = SuspectName | "Ruby";

export type Mood = "calm" | "guarded" | "nervous" | "hostile" | "helpful";

export interface NPCState {
  name: NPCName;
  role: string;
  personality: string;
  publicFace: string;
  backstory?: string;
  secret?: string;
  truthsKnown?: string[];
  beliefs: Record<string, string>;
  trustPlayer: number;
  suspicionPlayer: number;
  mood: Mood;
  memories: string[];
  rumorsHeard: string[];
  revealedClues: string[];
  isKillerCandidate: boolean;
}

export interface ScenarioTemplate {
  id: string;
  killer: SuspectName;
  motive: string;
  method: string;
  truthSummary: string[];
  globalClues: string[];
  npcOverrides: Partial<Record<NPCName, Partial<NPCState>>>;
}

export interface WorldState {
  victim: string;
  playableCharacter: string;
  turn: number;
  tension: number;
  accusationUnlocked: boolean;
  gameOver: false | true;
  winner: boolean;

  selectedScenarioId: string;
  killer: SuspectName;
  motive: string;
  method: string;
  truthSummary: string[];
  globalClues: string[];

  cluesDiscovered: string[];
  contradictionsFound: string[];
  investigationLog: string[];

  // tracks which elicitation techniques have worked — shown to player as feedback
  elicitationLog: ElicitationEntry[];

  npcs: Record<NPCName, NPCState>;
}

export interface ElicitationEntry {
  turn: number;
  npcName: NPCName;
  technique: string;
  note: string;
}

export interface ChatRequestBody {
  npcName: NPCName;
  playerMessage: string;
  worldState: WorldState;
  kill?: SuspectName;
  rubyHelp?: boolean;
}

export interface ChatResponseBody {
  reply: string;
  updatedWorldState: WorldState;
  elicitationFeedback?: string | null;
}

export interface ExtractionResult {
  trustDelta: number;
  suspicionDelta: number;
  discoveredClue: string | null;
  contradiction: string | null;
  rumor: string | null;
  memorySummary: string;
  elicitationWorked: boolean;
  elicitationNote: string | null;
}
