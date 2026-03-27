import { ExtractionResult, Mood, NPCName, SuspectName, WorldState } from "./types";

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

export function applyExtractionToWorld(
  world: WorldState,
  npcName: NPCName,
  playerMessage: string,
  extraction: ExtractionResult,
): WorldState {
  const next: WorldState = JSON.parse(JSON.stringify(world));
  const npc = next.npcs[npcName];

  next.turn += 1;
  next.tension += 1;

  npc.trustPlayer = clamp(npc.trustPlayer + extraction.trustDelta);
  npc.suspicionPlayer = clamp(npc.suspicionPlayer + extraction.suspicionDelta);
  npc.mood = deriveMood(npc.trustPlayer, npc.suspicionPlayer);

  pushUnique(npc.memories, extraction.memorySummary);
  pushUnique(npc.memories, `Aqua asked: ${playerMessage}`);

  pushUnique(next.cluesDiscovered, extraction.discoveredClue);
  pushUnique(next.contradictionsFound, extraction.contradiction);

  if (extraction.discoveredClue) {
    next.investigationLog.push(`Clue from ${npcName}: ${extraction.discoveredClue}`);
    pushUnique(npc.revealedClues, extraction.discoveredClue);
  }

  if (extraction.contradiction) {
    next.investigationLog.push(`Contradiction noted: ${extraction.contradiction}`);
  }

  const rumor = extraction.rumor ?? `Aqua pressed ${npcName} during questioning.`;

  (Object.keys(next.npcs) as NPCName[])
    .filter((name) => name !== npcName && name !== "Ruby")
    .slice(0, 2)
    .forEach((otherName) => {
      pushUnique(next.npcs[otherName].rumorsHeard, rumor);
      next.npcs[otherName].suspicionPlayer = clamp(
        next.npcs[otherName].suspicionPlayer + 0.03,
      );
      next.npcs[otherName].mood = deriveMood(
        next.npcs[otherName].trustPlayer,
        next.npcs[otherName].suspicionPlayer,
      );
    });

  if (next.turn >= 5) {
    next.accusationUnlocked = true;
  }

  if (next.turn >= 8) {
    next.tension += 1;
  }

  return next;
}

export function accuse(world: WorldState, accused: SuspectName): WorldState {
  const next: WorldState = JSON.parse(JSON.stringify(world));
  next.gameOver = true;
  next.winner = accused === next.killer;

  next.investigationLog.push(
    next.winner
      ? `Aqua accused ${accused}. The accusation was correct.`
      : `Aqua accused ${accused}. The accusation was wrong.`,
  );

  return next;
}