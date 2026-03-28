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

  // Tension only rises when something real surfaces
  if (extraction.discoveredClue || extraction.contradiction) {
    next.tension += 1;
  }

  npc.trustPlayer = clamp(npc.trustPlayer + extraction.trustDelta);
  npc.suspicionPlayer = clamp(npc.suspicionPlayer + extraction.suspicionDelta);
  npc.mood = deriveMood(npc.trustPlayer, npc.suspicionPlayer);

  // Store memory — cap at 6 so prompts don't bloat
  pushUnique(npc.memories, extraction.memorySummary);
  if (npc.memories.length > 6) npc.memories = npc.memories.slice(-6);

  pushUnique(next.cluesDiscovered, extraction.discoveredClue);
  pushUnique(next.contradictionsFound, extraction.contradiction);

  if (extraction.discoveredClue) {
    next.investigationLog.push(`[${npcName}] ${extraction.discoveredClue}`);
    pushUnique(npc.revealedClues, extraction.discoveredClue);
  }

  if (extraction.contradiction) {
    next.investigationLog.push(`[contradiction] ${extraction.contradiction}`);
  }

  // Spread rumours — random pair, capped at 4 rumours each
  if (extraction.rumor) {
    const others = (Object.keys(next.npcs) as NPCName[])
      .filter((n) => n !== npcName && n !== "Ruby")
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    others.forEach((otherName) => {
      pushUnique(next.npcs[otherName].rumorsHeard, extraction.rumor!);
      if (next.npcs[otherName].rumorsHeard.length > 4) {
        next.npcs[otherName].rumorsHeard = next.npcs[otherName].rumorsHeard.slice(-4);
      }
      next.npcs[otherName].suspicionPlayer = clamp(
        next.npcs[otherName].suspicionPlayer + 0.03,
      );
      next.npcs[otherName].mood = deriveMood(
        next.npcs[otherName].trustPlayer,
        next.npcs[otherName].suspicionPlayer,
      );
    });
  }

  // Unlock kill option — lower bar so it doesn't take forever
  // 4 turns OR 1 clue — whichever comes first
  if (next.turn >= 4 || next.cluesDiscovered.length >= 1) {
    next.accusationUnlocked = true;
  }

  // Late game tension spike
  if (next.turn >= 10) {
    next.tension += 1;
  }

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
