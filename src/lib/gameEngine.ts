import {
  AquaMood,
  ElicitationEntry,
  ExtractionResult,
  Mood,
  NPCName,
  SuspectName,
  WorldState,
} from "./types";

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function pushUnique(arr: string[], value?: string | null) {
  if (!value) return;
  if (!arr.includes(value)) arr.push(value);
}

function deriveMood(trust: number, suspicion: number): Mood {
  if (suspicion > 0.7) return "hostile";
  if (suspicion > 0.45) return "guarded";
  if (trust > 0.75) return "helpful";
  if (trust < 0.35) return "nervous";
  return "calm";
}

function deriveReputation(world: WorldState): string {
  const questioned = world.questionedOrder.length;
  const tension = world.tension;
  const clues = world.cluesDiscovered.length;

  if (questioned === 0) return "Unknown — nobody has spoken to Aqua yet.";
  if (tension >= 8) return "Everyone knows Aqua is digging. The agency is nervous. People are choosing sides.";
  if (tension >= 5) return "Word has spread that Aqua is asking hard questions. Some are warned. Some are curious.";
  if (clues >= 3) return "Aqua has clearly found something. The people who matter have noticed.";
  if (questioned >= 3) return "Aqua has been seen talking to several people. Rumours are forming.";
  return "Aqua has started asking around. A few people know.";
}

// ─── HOW AQUA'S TONE AFFECTS EACH NPC ────────────────────────────────────────
// Returns trust/suspicion modifier based on Aqua's mood and NPC's relationship

function toneEffect(
  aquaTone: ExtractionResult["aquaTone"],
  npcName: NPCName,
): { trustMod: number; suspicionMod: number } {
  const effects: Record<string, Record<string, { trustMod: number; suspicionMod: number }>> = {
    Manager: {
      grieving: { trustMod: 0.06, suspicionMod: -0.03 },   // he responds to shared grief
      angry:    { trustMod: -0.05, suspicionMod: 0.08 },   // anger makes him defensive
      cold:     { trustMod: -0.03, suspicionMod: 0.04 },
      focused:  { trustMod: 0.02, suspicionMod: 0.02 },
      desperate: { trustMod: 0.04, suspicionMod: 0.03 },
      neutral:  { trustMod: 0, suspicionMod: 0 },
    },
    CoIdol: {
      grieving: { trustMod: 0.08, suspicionMod: -0.04 },   // grief disarms her
      angry:    { trustMod: 0.03, suspicionMod: -0.02 },   // anger she understands
      cold:     { trustMod: -0.06, suspicionMod: 0.05 },   // coldness shuts her down
      focused:  { trustMod: -0.02, suspicionMod: 0.03 },
      desperate: { trustMod: 0.05, suspicionMod: 0.0 },
      neutral:  { trustMod: 0, suspicionMod: 0 },
    },
    Director: {
      grieving: { trustMod: 0.04, suspicionMod: -0.02 },
      angry:    { trustMod: -0.03, suspicionMod: 0.05 },
      cold:     { trustMod: 0.03, suspicionMod: -0.01 },   // composure earns his respect
      focused:  { trustMod: 0.05, suspicionMod: -0.02 },   // focus earns his respect most
      desperate: { trustMod: -0.02, suspicionMod: 0.04 },
      neutral:  { trustMod: 0, suspicionMod: 0 },
    },
    Fan: {
      grieving: { trustMod: 0.1, suspicionMod: -0.06 },    // shared grief is his language
      angry:    { trustMod: 0.04, suspicionMod: -0.03 },   // anger at the industry he gets
      cold:     { trustMod: -0.08, suspicionMod: 0.06 },   // coldness scares him
      focused:  { trustMod: -0.02, suspicionMod: 0.04 },
      desperate: { trustMod: 0.07, suspicionMod: -0.04 },
      neutral:  { trustMod: 0, suspicionMod: 0 },
    },
    Executive: {
      grieving: { trustMod: -0.04, suspicionMod: 0.05 },   // grief reads as weakness
      angry:    { trustMod: -0.06, suspicionMod: 0.07 },
      cold:     { trustMod: 0.05, suspicionMod: -0.03 },   // coldness he respects
      focused:  { trustMod: 0.03, suspicionMod: -0.01 },
      desperate: { trustMod: -0.03, suspicionMod: 0.06 },
      neutral:  { trustMod: 0, suspicionMod: 0 },
    },
    Ruby: {
      grieving: { trustMod: 0.05, suspicionMod: 0 },
      angry:    { trustMod: 0.03, suspicionMod: 0 },
      cold:     { trustMod: -0.02, suspicionMod: 0 },
      focused:  { trustMod: 0.03, suspicionMod: 0 },
      desperate: { trustMod: 0.04, suspicionMod: 0 },
      neutral:  { trustMod: 0, suspicionMod: 0 },
    },
  };

  return effects[npcName]?.[aquaTone] ?? { trustMod: 0, suspicionMod: 0 };
}

// ─── SIDE DEAL DETECTION ──────────────────────────────────────────────────────

function checkSideDeals(world: WorldState, npcName: NPCName, clue: string | null): string | null {
  if (!clue) return null;

  for (const deal of world.sideDeals) {
    if (deal.discovered) continue;
    if (!deal.parties.includes(npcName)) continue;

    // Check if the discovered clue contains keywords from the surface trigger
    const triggerWords = deal.surfaceClue.toLowerCase().split(" ").filter(w => w.length > 4);
    const clueLower = clue.toLowerCase();
    const matches = triggerWords.filter(w => clueLower.includes(w));

    if (matches.length >= 2) {
      deal.discovered = true;
      return deal.exposedDescription;
    }
  }

  return null;
}

// ─── MAIN ENGINE ──────────────────────────────────────────────────────────────

export function applyExtractionToWorld(
  world: WorldState,
  npcName: NPCName,
  playerMessage: string,
  extraction: ExtractionResult,
): WorldState {
  const next: WorldState = JSON.parse(JSON.stringify(world));
  const npc = next.npcs[npcName];

  next.turn += 1;

  // ── Update questioned order ──────────────────────────────────────────────
  if (!next.questionedOrder.includes(npcName)) {
    next.questionedOrder.push(npcName);
  }

  // ── Aqua's mood ──────────────────────────────────────────────────────────
  if (extraction.aquaTone && extraction.aquaTone !== "neutral") {
    next.aquaMood = extraction.aquaTone as AquaMood;
  }

  // ── Tension ─────────────────────────────────────────────────────────────
  if (extraction.discoveredClue || extraction.contradiction) {
    next.tension += 1;
  }

  // ── Trust / suspicion — base + tone effect ───────────────────────────────
  const tone = toneEffect(extraction.aquaTone, npcName);
  const elicitationBonus = extraction.elicitationWorked ? 0.04 : 0;
  npc.trustPlayer = clamp(npc.trustPlayer + extraction.trustDelta + tone.trustMod + elicitationBonus);
  npc.suspicionPlayer = clamp(npc.suspicionPlayer + extraction.suspicionDelta + tone.suspicionMod);
  npc.mood = deriveMood(npc.trustPlayer, npc.suspicionPlayer);

  // ── Memory ───────────────────────────────────────────────────────────────
  pushUnique(npc.memories, extraction.memorySummary);
  if (npc.memories.length > 6) npc.memories = npc.memories.slice(-6);

  // ── Clues and contradictions ─────────────────────────────────────────────
  pushUnique(next.cluesDiscovered, extraction.discoveredClue);
  pushUnique(next.contradictionsFound, extraction.contradiction);

  if (extraction.discoveredClue) {
    next.investigationLog.push(`[${npcName}] ${extraction.discoveredClue}`);
    pushUnique(npc.revealedClues, extraction.discoveredClue);
  }

  if (extraction.contradiction) {
    next.investigationLog.push(`[contradiction] ${extraction.contradiction}`);
  }

  // ── Side deal detection ──────────────────────────────────────────────────
  const surfacedDeal = checkSideDeals(next, npcName, extraction.discoveredClue);
  if (surfacedDeal) {
    next.investigationLog.push(`[side deal exposed] ${surfacedDeal}`);
    pushUnique(next.cluesDiscovered, surfacedDeal);

    // Both parties in the deal now know Aqua is getting close
    const deal = next.sideDeals.find(d => d.exposedDescription === surfacedDeal);
    if (deal) {
      deal.parties.forEach(partyName => {
        if (next.npcs[partyName]) {
          next.npcs[partyName].exposedDeals.push(surfacedDeal);
          next.npcs[partyName].suspicionPlayer = clamp(
            next.npcs[partyName].suspicionPlayer + 0.1
          );
          next.npcs[partyName].mood = deriveMood(
            next.npcs[partyName].trustPlayer,
            next.npcs[partyName].suspicionPlayer
          );
        }
      });
    }
  }

  // ── Elicitation log ──────────────────────────────────────────────────────
  if (extraction.elicitationWorked && extraction.elicitationNote) {
    const entry: ElicitationEntry = {
      turn: next.turn,
      npcName,
      technique: extraction.elicitationNote,
      note: extraction.elicitationNote,
    };
    if (!next.elicitationLog) next.elicitationLog = [];
    next.elicitationLog.push(entry);
    next.investigationLog.push(`[technique worked] ${extraction.elicitationNote}`);
  }

  // ── NPC backchannel — they message someone after being questioned ─────────
  if (extraction.npcBackchannelTarget && extraction.npcBackchannelMessage) {
    const target = extraction.npcBackchannelTarget;
    if (next.npcs[target] && target !== npcName) {
      const message = `${npcName} told me: "${extraction.npcBackchannelMessage}"`;
      pushUnique(next.npcs[target].rumorsHeard, message);
      next.npcs[target].sentMessages = next.npcs[target].sentMessages ?? [];

      // Being warned makes the target more suspicious of Aqua
      next.npcs[target].suspicionPlayer = clamp(
        next.npcs[target].suspicionPlayer + 0.08
      );
      next.npcs[target].warnedAboutAqua = true;
      next.npcs[target].mood = deriveMood(
        next.npcs[target].trustPlayer,
        next.npcs[target].suspicionPlayer
      );

      next.investigationLog.push(
        `[backchannel] ${npcName} contacted ${target} after speaking with Aqua.`
      );
    }
  }

  // ── Rumour spread (existing system) ─────────────────────────────────────
  if (extraction.rumor) {
    const others = (Object.keys(next.npcs) as NPCName[])
      .filter(n => n !== npcName && n !== "Ruby")
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    others.forEach(otherName => {
      pushUnique(next.npcs[otherName].rumorsHeard, extraction.rumor!);
      if (next.npcs[otherName].rumorsHeard.length > 5) {
        next.npcs[otherName].rumorsHeard = next.npcs[otherName].rumorsHeard.slice(-5);
      }
      next.npcs[otherName].suspicionPlayer = clamp(
        next.npcs[otherName].suspicionPlayer + 0.02
      );
      next.npcs[otherName].mood = deriveMood(
        next.npcs[otherName].trustPlayer,
        next.npcs[otherName].suspicionPlayer
      );
    });
  }

  // ── Reputation update ────────────────────────────────────────────────────
  next.aquaReputation = deriveReputation(next);

  // ── Unlock kill ──────────────────────────────────────────────────────────
  if (next.turn >= 3 || next.cluesDiscovered.length >= 1) {
    next.accusationUnlocked = true;
  }

  // ── Late game tension spike ──────────────────────────────────────────────
  if (next.turn >= 10) next.tension += 1;

  return next;
}

export function kill(world: WorldState, target: SuspectName): WorldState {
  const next: WorldState = JSON.parse(JSON.stringify(world));
  next.gameOver = true;
  next.winner = target === next.killer;

  next.investigationLog.push(
    next.winner
      ? `Aqua killed ${target}. Correct — ${target} was responsible for Ai's death.`
      : `Aqua killed ${target}. Wrong — ${target} was innocent. The real killer was ${next.killer}.`,
  );

  return next;
}
