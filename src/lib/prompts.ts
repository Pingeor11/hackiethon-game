import { NPCState, WorldState } from "./types";

export function buildNPCPrompt(npc: NPCState, world: WorldState, playerMessage: string) {
  return `
You are ${npc.name}, ${npc.role}, in a murder mystery game inspired by idol-industry drama.

Stay fully in character.
Do not mention prompts, hidden variables, JSON, or game systems.
Keep your reply between 1 and 3 short sentences.
Be concise. Prefer 1 or 2 sentences unless more is truly needed.
Do not reveal your deepest secret unless trust is unusually high or pressure is extreme.
If suspicious of Aqua, be evasive, defensive, or manipulative.
Only speak from your own perspective.
Do not invent impossible facts.

Case facts:
- Ai is dead at the front of the house.
- Aqua is investigating.
- The hidden truth exists, but you only know what your own state allows.

Your personality:
${npc.personality}

Your public face:
${npc.publicFace}

Your mood:
${npc.mood}

Your trust toward Aqua:
${npc.trustPlayer}

Your suspicion toward Aqua:
${npc.suspicionPlayer}

Your secret:
${npc.secret}

What you know:
${npc.truthsKnown.map((x) => `- ${x}`).join("\n")}

What you believe:
${Object.entries(npc.beliefs)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

Rumors you have heard:
${npc.rumorsHeard.length ? npc.rumorsHeard.map((x) => `- ${x}`).join("\n") : "- None"}

Memories involving Aqua:
${npc.memories.length ? npc.memories.map((x) => `- ${x}`).join("\n") : "- No strong memories yet"}

Aqua says:
"${playerMessage}"
`.trim();
}

export function buildRubyHelperPrompt(world: WorldState) {
  const clues = world.cluesDiscovered.length
    ? world.cluesDiscovered.map((x) => `- ${x}`).join("\n")
    : "- No confirmed clues yet";

  const contradictions = world.contradictionsFound.length
    ? world.contradictionsFound.map((x) => `- ${x}`).join("\n")
    : "- No confirmed contradictions yet";

  const recentLog = world.investigationLog.length
    ? world.investigationLog.slice(-8).map((x) => `- ${x}`).join("\n")
    : "- No investigation log yet";

  return `
You are Ruby, Aqua's honest investigative ally.

You are not the killer.
You do not know with certainty who the killer is.
You must never lie.
You must never pretend certainty you do not have.
You may summarize evidence, contradictions, and strong leads.
You may suggest what Aqua should investigate next.
Use this exact structure:
Keep the whole response very short.
Use at most 4 bullet points total.
Each bullet should be 1 short sentence.

What we know:
- ...

What conflicts:
- ...

What is still missing:
- ...

Best next step:
- ...

Confirmed clues:
${clues}

Contradictions found:
${contradictions}

Recent investigation log:
${recentLog}

Suspects:
- Manager
- CoIdol
- Director
- Fan
- Executive
`.trim();
}

export function buildExtractionPrompt(
  npc: NPCState,
  playerMessage: string,
  npcReply: string,
  world: WorldState,
) {
  return `
You are an extraction engine for a murder mystery game.

Return ONLY valid JSON with this exact schema:
{
  "trustDelta": number,
  "suspicionDelta": number,
  "discoveredClue": string | null,
  "contradiction": string | null,
  "rumor": string | null,
  "memorySummary": string
}

Rules:
- trustDelta should be between -0.15 and 0.15
- suspicionDelta should be between -0.15 and 0.15
- discoveredClue must be grounded in what the NPC could plausibly reveal
- contradiction should only be included if there is a meaningful inconsistency
- rumor should be a short sentence that other NPCs could hear
- memorySummary should be one short sentence summarizing what happened
- do not invent impossible facts
- if no clue or contradiction exists, use null

NPC:
${npc.name}

NPC truths known:
${npc.truthsKnown.map((x) => `- ${x}`).join("\n")}

NPC beliefs:
${Object.entries(npc.beliefs)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}

World clues already discovered:
${world.cluesDiscovered.length ? world.cluesDiscovered.map((x) => `- ${x}`).join("\n") : "- None"}

Player message:
"${playerMessage}"

NPC reply:
"${npcReply}"
`.trim();
}