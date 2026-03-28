export type SuspectName =
  | "Manager"
  | "CoIdol"
  | "Director"
  | "Fan"
  | "Executive";

export type NPCName = SuspectName | "Ruby";

export type Mood = "calm" | "guarded" | "nervous" | "hostile" | "helpful";

export type AquaMood = "cold" | "grieving" | "focused" | "angry" | "desperate";

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
  // how this NPC feels about Aqua specifically beyond trust/suspicion
  aquaRelationship: string;
  // messages this NPC has sent to others after being questioned
  sentMessages: string[];
  // whether this NPC has been warned by someone else about Aqua
  warnedAboutAqua: boolean;
  // side deals this NPC is involved in that have been surfaced
  exposedDeals: string[];
}

export interface SideDeal {
  id: string;
  parties: NPCName[];
  description: string;          // what the deal is
  surfaceClue: string;          // what triggers it being discoverable
  exposedDescription: string;   // what Aqua learns when she discovers it
  discovered: boolean;
}

export interface ScenarioTemplate {
  id: string;
  killer: SuspectName;
  motive: string;
  method: string;
  truthSummary: string[];
  globalClues: string[];
  npcOverrides: Partial<Record<NPCName, Partial<NPCState>>>;
  sideDeals: SideDeal[];        // deals baked into this scenario
}

export interface WorldState {
  victim: string;
  playableCharacter: string;
  turn: number;
  tension: number;
  accusationUnlocked: boolean;
  gameOver: boolean;
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
  elicitationLog: ElicitationEntry[];

  // Aqua's current emotional state — driven by how she phrases things
  aquaMood: AquaMood;
  aquaReputation: string;       // one-line summary of how NPCs see Aqua right now

  // side deals in this run — some discovered, some hidden
  sideDeals: SideDeal[];

  // NPCs Aqua has spoken to this run (order matters)
  questionedOrder: NPCName[];

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
  sideDealSurfaced?: string | null;
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
  // detected emotional tone of Aqua's message
  aquaTone: "cold" | "grieving" | "focused" | "angry" | "desperate" | "neutral";
  // message this NPC would send to a specific other NPC after this exchange
  npcBackchannelTarget: NPCName | null;
  npcBackchannelMessage: string | null;
}
