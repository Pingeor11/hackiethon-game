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
  pronouns: string;
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
  aquaRelationship: string;
  sentMessages: string[];
  warnedAboutAqua: boolean;
  exposedDeals: string[];
  // Gate 1 of hybrid deal completion — set when this NPC yielded real info
  // that satisfies a pending deal's task. Value is the deal-giver's name.
  completedTaskFor: NPCName[];
}

export interface SideDeal {
  id: string;
  parties: NPCName[];
  description: string;
  surfaceClue: string;
  exposedDescription: string;
  discovered: boolean;
}

export interface PowerDynamic {
  id: string;
  holder: NPCName;
  subject: NPCName;
  description: string;
  gossipHints: string[];
  killerImplication: string;
  hintsNeeded: number;
  hintsCollected: number;
  exposed: boolean;
}

export interface ScenarioTemplate {
  id: string;
  killer: SuspectName;
  motive: string;
  method: string;
  methodClue: string;  // short forensic clue shown in notebook — no names, no context
  truthSummary: string[];
  globalClues: string[];
  npcOverrides: Partial<Record<NPCName, Partial<NPCState>>>;
  sideDeals: SideDeal[];
}

export interface GossipEntry {
  turn: number;
  text: string;
  source: string;
  relatedTo: NPCName | null;
}

// ── Confirmed Truth — earned by completing a deal ────────────────────────────
export interface ConfirmedTruth {
  source: NPCName;   // who revealed it
  truth: string;     // what they said
  turn: number;      // when it was earned
}

export interface WorldState {
  victim: string;
  playableCharacter: string;
  turn: number;
  tension: number;
  accusationUnlocked: boolean;
  gameOver: boolean;
  winner: boolean;
  gossipFeed: GossipEntry[];
  powerDynamics: PowerDynamic[];

  selectedScenarioId: string;
  killer: SuspectName;
  motive: string;
  method: string;
  methodClue: string;  // short forensic clue shown in notebook
  truthSummary: string[];
  globalClues: string[];

  cluesDiscovered: string[];
  contradictionsFound: string[];
  investigationLog: string[];
  elicitationLog: ElicitationEntry[];

  aquaMood: AquaMood;
  aquaReputation: string;

  sideDeals: SideDeal[];
  activeDeals: ActiveDeal[];

  // Truths confirmed through completed deals — shown in notebook
  confirmedTruths: ConfirmedTruth[];

  // Facts Ruby has already flagged — she won't repeat the same one
  rubyFlagged: string[];

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
  barterOffer?: BarterOffer | null;
  // New — triggers cinematic reveal
  dealFulfilled?: DealFulfilledPayload | null;
}

export interface DealFulfilledPayload {
  npcName: NPCName;
  truth: string;
  reward: string;
}

export interface BarterOffer {
  npcName: NPCName;
  offer: string;
  asking: string;
  taskTarget: NPCName | null;
  truthIndex: number;
}

export interface ActiveDeal {
  npcName: NPCName;
  task: string;
  taskTarget: NPCName | null;
  reward: string;
  truthIndex: number;
  status: "pending" | "fulfilled";
  revealedTruth?: string;   // populated when fulfilled
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
  aquaTone: "cold" | "grieving" | "focused" | "angry" | "desperate" | "neutral";
  npcBackchannelTarget: NPCName | null;
  npcBackchannelMessage: string | null;
  industryGossip: string | null;
  gossipSource: string | null;
  gossipRelatedTo: NPCName | null;
}
