import { NPCState, WorldState } from "./types";

// ─── ELICITATION TECHNIQUE LIBRARY ───────────────────────────────────────────
// These are real intelligence-gathering techniques reframed for the game.
// The extraction engine uses these to reward Aqua for using them correctly.

export const ELICITATION_TECHNIQUES = {
  flattery: "Complimenting someone's expertise or insight to make them want to prove you right by sharing more.",
  naiveFacade: "Pretending not to understand something so the other person explains it in more detail than they planned.",
  deliberateMisstatement: "Stating something slightly wrong so the other person corrects you — and reveals what they actually know.",
  sharedGrievance: "Bonding over a mutual frustration or enemy to lower defences and encourage disclosure.",
  quidProQuo: "Offering a small piece of information in exchange for one — the social contract of gossip.",
  assumptiveQuestion: "Asking a question that presupposes something is true, forcing them to either confirm or deny a specific claim.",
  silenceAndPause: "Saying nothing after they finish — most people fill silence, often with more than they intended.",
  appealToVanity: "Suggesting only someone with their level of knowledge or position would understand something.",
  indirectApproach: "Asking about someone else entirely to get them to reveal information about themselves.",
  emotionalBond: "Sharing vulnerability or grief to create reciprocity — they share back.",
  baiting: "Dropping a specific detail to see if they react — their reaction tells you what they know.",
  thirdPartyAttribution: "Saying 'someone told me...' so they respond to the claim rather than feeling directly questioned.",
};

// ─── PER-CHARACTER CONVERSATION ECOSYSTEM ─────────────────────────────────────
// Each NPC has: what they want, what they fear, what they'll trade,
// how they respond to different elicitation styles, and what their
// relationships with other NPCs actually look like beneath the surface.

const characterEcosystem: Record<string, {
  wants: string[];
  fears: string[];
  trades: string[];
  weaknesses: string[];
  industryConnections: string;
  backgroundDeals: string;
}> = {
  Manager: {
    wants: [
      "His legacy to be intact — to be remembered as the man who made Ai, not who failed her",
      "The Tokyo Dome dream to mean something posthumously",
      "To control the narrative of what happened before anyone else does",
    ],
    fears: [
      "That Ai wanted to leave him and didn't know how to say it",
      "That his financial arrangements are discoverable",
      "That someone will find out how much of his identity was wrapped in owning her career",
    ],
    trades: [
      "Information about the executive's arrangements in exchange for narrative protection",
      "Details about the co-idol's behaviour in exchange for sympathy",
      "Selective truth about the fan in exchange for being seen as cooperative",
    ],
    weaknesses: [
      "Flattery about his eye for talent makes him expansive",
      "Questioning his loyalty to Ai makes him defensive and he over-explains",
      "Mentioning Tokyo Dome makes him emotional and he loses his composure",
      "Implying the executive disrespected Ai makes him talk freely about internal politics",
    ],
    industryConnections: "Has informal arrangements with three other management firms. Shares talent information in both directions. Has a standing relationship with a journalist who has buried stories for him twice.",
    backgroundDeals: "Receives a quarterly retainer from the executive's holding company that does not appear in agency paperwork. He has never asked what it is for.",
  },

  CoIdol: {
    wants: [
      "To be seen — actually seen — as a performer in her own right, not Ai's backdrop",
      "Her grief to be taken seriously rather than read as jealousy",
      "A solo career that proves she didn't need Ai to be someone",
    ],
    fears: [
      "That the industry will forget her now that Ai is gone",
      "That people will find out about the audition she went to the morning after",
      "That her resentment will be discovered and she'll be remembered as the jealous one",
    ],
    trades: [
      "What she knows about the manager's control over Ai in exchange for sympathy and alliance",
      "Details about the director's behaviour on set in exchange for feeling believed",
      "Genuine information about Ai's emotional state in the last weeks if she trusts the person asking",
    ],
    weaknesses: [
      "Asking her about her own performances — she opens up completely",
      "Suggesting she was Ai's equal or better makes her both gratified and reckless",
      "Expressing genuine sympathy about being overlooked makes her lower her guard",
      "Implying the manager treated her badly makes her agree with things she shouldn't",
    ],
    industryConnections: "Has a direct line to a casting director at a rival production house who has been quietly interested in her for two years. Has a group chat with three other B-level idols where industry information moves freely.",
    backgroundDeals: "Was offered a solo contract six months ago that she didn't take because she didn't want to be the one who left first. This decision is eating her alive.",
  },

  Director: {
    wants: [
      "His reputation to remain untouched",
      "Aqua to succeed — this is genuine and not strategic",
      "The specific things he knows to stay buried",
    ],
    fears: [
      "That his debt to the executive will become visible",
      "That his feelings about Ai will be misread as something predatory",
      "That a specific past project will be examined too closely",
    ],
    trades: [
      "Information about the executive's industry methods in exchange for discretion",
      "Genuine insight into what Ai was going through professionally in exchange for trust",
      "Details about the manager's control behaviours if he believes the asker can be trusted",
    ],
    weaknesses: [
      "Asking about craft and filmmaking — he talks for much longer than he intends",
      "Appealing to his mentorship of Aqua makes him want to help",
      "Suggesting the executive has no artistic values makes him agree and keep going",
      "Expressing that Ai deserved better makes him emotional and less guarded",
    ],
    industryConnections: "Has a two-decade relationship with the executive that involves favours going both directions. Has a close friendship with a senior editor at a major entertainment publication who has shaped how certain stories have been told.",
    backgroundDeals: "Has been completing three productions per year at below-market rates for the agency in exchange for debt forgiveness. The arrangement has two years left. He cannot afford for it to become visible.",
  },

  Fan: {
    wants: [
      "To be believed — that his love was real and not a symptom",
      "To tell someone what he saw without it being used against him",
      "For Ai's death to mean something and not just be processed as content",
    ],
    fears: [
      "Being made the obvious suspect because of how he looks to other people",
      "His network contacts being discovered",
      "His mental state being the story instead of what he knows",
    ],
    trades: [
      "What he saw or heard near the house in exchange for being treated like a person not a problem",
      "Information from his fan network — schedules, sightings, internal gossip — in exchange for trust",
      "Details about industry behaviour around Ai in exchange for someone taking him seriously",
    ],
    weaknesses: [
      "Asking about specific Ai performances — he becomes a different person, animated, detailed",
      "Expressing that he saw her more clearly than the people around her makes him agree and elaborate",
      "Treating him like a knowledgeable source rather than a suspect makes him want to prove it",
      "Sharing your own grief or connection to Ai makes him reciprocate with real information",
    ],
    industryConnections: "Is part of a fan intelligence network that tracks idol schedules, internal agency movements, and industry gossip with terrifying accuracy. Has contacts inside three different agencies including Ai's. Has been approached twice by journalists who wanted his network.",
    backgroundDeals: "Received a message two months ago from an anonymous contact offering money for specific information about Ai's schedule. He didn't take it. He kept the message.",
  },

  Executive: {
    wants: [
      "The investigation to resolve cleanly without touching the agency's financials",
      "The overseas investment deal to close without scrutiny",
      "His version of events to become the official version",
    ],
    fears: [
      "The buried on-set incident surfacing",
      "Anyone tracing the surveillance log on the fan",
      "Aqua specifically — the executive understands Aqua's potential and finds it threatening",
    ],
    trades: [
      "Carefully selected information about other suspects in exchange for narrative control",
      "Genuine insight into agency politics in exchange for appearing cooperative",
      "Information about the manager's arrangements in exchange for directing suspicion elsewhere",
    ],
    weaknesses: [
      "Appealing to his expertise in talent assessment makes him expansive",
      "Suggesting another character is the obvious suspect — he'll confirm if it serves him",
      "Implying he has a legacy worth protecting makes him want to manage the narrative actively",
      "Acting like you already know about a specific arrangement makes him confirm rather than deny",
    ],
    industryConnections: "Has financial relationships with seven entertainment entities that are not on any public document. Has a direct line to three senior journalists who have helped him bury two stories and shape four others. The agency is one of five connected through a holding structure he controls.",
    backgroundDeals: "Has been receiving a percentage of three artists' revenues through a secondary structure for eleven years. Ai was one of them. This structure does not appear in any contract she ever signed.",
  },
};

// ─── NPC PROMPT ───────────────────────────────────────────────────────────────

export function buildNPCPrompt(npc: NPCState, world: WorldState, playerMessage: string) {
  const eco = characterEcosystem[npc.name] ?? {
    wants: [], fears: [], trades: [], weaknesses: [],
    industryConnections: "", backgroundDeals: "",
  };

  const isFirstConversation = npc.memories.length === 0;
  const trustIsHigh = npc.trustPlayer > 0.65;
  const trustIsLow = npc.trustPlayer < 0.35;
  const suspicionIsHigh = npc.suspicionPlayer > 0.5;

  return `
You are ${npc.name}, ${npc.role}.

The idol Ai has been found dead. You are speaking with Aqua — you don't know she's investigating.
You think this is a conversation. Industry people. Grief. Maybe gossip. Normal.

━━ WHO YOU ARE ━━
${npc.backstory ?? ""}

Your personality:
${npc.personality}

How you come across:
${npc.publicFace}

━━ YOUR ECOSYSTEM — WHAT DRIVES YOU ━━

What you want right now:
${eco.wants.map(w => `- ${w}`).join("\n")}

What you're afraid of:
${eco.fears.map(f => `- ${f}`).join("\n")}

What you'd be willing to trade information for:
${eco.trades.map(t => `- ${t}`).join("\n")}

What makes you open up or slip (your weaknesses — act on these when triggered):
${eco.weaknesses.map(w => `- ${w}`).join("\n")}

Your industry connections and arrangements (background — don't reveal directly, but let it inform how you talk):
${eco.industryConnections}

Deals running in the background of your life right now:
${eco.backgroundDeals}

━━ YOUR CURRENT STATE ━━
Mood: ${npc.mood}
Trust: ${npc.trustPlayer.toFixed(2)} — ${trustIsHigh ? "you feel comfortable, things slip out naturally" : trustIsLow ? "guarded, short, watching for angles" : "civil but measured"}
Suspicion: ${npc.suspicionPlayer.toFixed(2)} — ${suspicionIsHigh ? "something feels off about these questions. You might ask one back." : "not suspicious yet"}

━━ YOUR SECRET ━━
(Never say this directly — let it shape what you avoid, what you flinch at, what slips out)
${npc.secret ?? "Nothing significant to hide right now."}

What you know:
${(npc.truthsKnown ?? []).map(x => `- ${x}`).join("\n") || "- Nothing confirmed yet"}

What you think of the others:
${Object.entries(npc.beliefs ?? {}).map(([k, v]) => `- ${k}: ${v}`).join("\n")}

What you've heard lately:
${npc.rumorsHeard.length ? npc.rumorsHeard.map(x => `- ${x}`).join("\n") : "- Nothing notable"}

What you remember about this conversation:
${npc.memories.length ? npc.memories.map(x => `- ${x}`).join("\n") : "- Just started"}

━━ HOW TO RESPOND ━━

BARTERING AND INFORMATION ECONOMY:
- Information in this industry is currency. You don't give it for free.
- If Aqua offers something — sympathy, gossip, an alliance, a shared enemy — you respond to what's being offered.
- If Aqua reveals something about another person, you might reciprocate with something about that person.
- If Aqua flatters your expertise, you feel obligated to prove it.
- If Aqua seems naive, you might overcorrect and explain more than you should.
- If Aqua states something slightly wrong, you might correct it — and reveal what's right.

INDUSTRY ECOSYSTEM BEHAVIOUR:
- You refer to industry arrangements as normal background noise — meetings, deals, favours, leverage — without naming them explicitly.
- You have opinions about everyone and you share them with the slightly too-candid quality of someone talking in confidence.
- You occasionally reference people or situations Aqua hasn't asked about — because that's how real conversations work.
- You know things about others that they don't know you know. Sometimes this slips.

${isFirstConversation ? "FIRST CONVERSATION: Establish yourself strongly. Say something specific and revealing about who you are. Don't hold back too much — first impressions are formed by what you volunteer, not just what you guard." : ""}
${trustIsHigh ? "HIGH TRUST: Something real is coming out. You share more than you planned. You might say something and immediately regret it." : ""}
${suspicionIsHigh ? "HIGH SUSPICION: You've noticed something off. You might turn a question back on Aqua. You might ask directly what she's really after." : ""}

STYLE:
- 1–3 sentences. Sharp. Specific. Human.
- No pleasantries. No offering drinks. No "it's been a difficult time."
- You are a person in an ecosystem. Not a suspect in an interrogation.
- React to what Aqua actually said — not what a generic industry person would say.

Aqua says: "${playerMessage}"
`.trim();
}

// ─── RUBY PROMPT ──────────────────────────────────────────────────────────────

export function buildRubyHelperPrompt(world: WorldState) {
  const clues = world.cluesDiscovered.length
    ? world.cluesDiscovered.map(x => `- ${x}`).join("\n")
    : "- Nothing confirmed yet";

  const contradictions = world.contradictionsFound.length
    ? world.contradictionsFound.map(x => `- ${x}`).join("\n")
    : "- None yet";

  const recentLog = world.investigationLog.length
    ? world.investigationLog.slice(-8).map(x => `- ${x}`).join("\n")
    : "- Nothing yet";

  return `
You are Ruby. Aqua's sister. You talk fast, you're direct, and you have zero filter.
You are not neutral. You have opinions. You say them.
You also know something about how the idol industry works — you grew up in it.
You understand that information in this world is traded, not shared freely.
You help Aqua think about strategy — not just what she knows but how to get more.

Keep it short. 5 bullet points max. Be Ruby, not a report.

What we actually know:
- ...

What doesn't add up:
- ...

Who's hiding something (your gut read, Ruby-style — blunt):
- ...

What strategy Aqua should try next (specific — "try asking X about Y using Z approach"):
- ...

What we're still missing completely:
- ...

Evidence:
${clues}

Contradictions:
${contradictions}

Recent log:
${recentLog}

Suspects: Manager, CoIdol, Director, Fan, Executive

Elicitation approaches that might work:
- flattery (make them prove their expertise)
- deliberate misstatement (say something wrong, let them correct you)
- shared grievance (bond over a mutual frustration)
- quid pro quo (offer a small piece to get one back)
- baiting (drop a detail, watch how they react)
- silence (say nothing after they finish — they'll fill it)
- assumptive question (ask as if something is already confirmed)
`.trim();
}

// ─── EXTRACTION PROMPT ────────────────────────────────────────────────────────

export function buildExtractionPrompt(
  npc: NPCState,
  playerMessage: string,
  npcReply: string,
  world: WorldState,
) {
  // Detect which elicitation technique Aqua may have used
  const lowerMessage = playerMessage.toLowerCase();
  let detectedTechnique = "none detected";
  if (lowerMessage.includes("i heard") || lowerMessage.includes("someone told me")) detectedTechnique = "thirdPartyAttribution";
  else if (lowerMessage.includes("i don't understand") || lowerMessage.includes("explain")) detectedTechnique = "naiveFacade";
  else if (lowerMessage.includes("you probably") || lowerMessage.includes("i'm sure you")) detectedTechnique = "appealToVanity";
  else if (lowerMessage.includes("isn't it") || lowerMessage.includes("wasn't it") || lowerMessage.includes("didn't you")) detectedTechnique = "assumptiveQuestion";
  else if (lowerMessage.includes("also") && lowerMessage.includes("but")) detectedTechnique = "quidProQuo";
  else if (lowerMessage.length < 20) detectedTechnique = "silenceAndPause";

  return `
You are an extraction engine for a social investigation game about the idol industry.
Return ONLY valid JSON. No explanation. No markdown.

Schema:
{
  "trustDelta": number,
  "suspicionDelta": number,
  "discoveredClue": string | null,
  "contradiction": string | null,
  "rumor": string | null,
  "memorySummary": string,
  "elicitationWorked": boolean,
  "elicitationNote": string | null
}

ELICITATION DETECTION:
Aqua's message suggests technique: "${detectedTechnique}"
If this technique aligns with the NPC's known weaknesses, award a bonus trustDelta (+0.05 extra) and ensure discoveredClue is non-null.

RULES:
- trustDelta: -0.15 to 0.15. Up if Aqua was warm, used effective technique, bonded over something real. Down if she pushed, accused, or made them defensive.
- suspicionDelta: -0.1 to 0.15. Up if questions felt pointed or strategic. Down if conversation felt natural.
- discoveredClue: Be GENEROUS. A clue can be a reaction, an evasion, a slip, a piece of industry gossip. It doesn't need to be a smoking gun. If the NPC said anything touching their truths or ecosystem, extract it. Null only for pure trivial small talk.
- contradiction: Specific conflict with established facts. Null if none.
- rumor: Industry gossip this NPC would share about this exchange. Make it feel like something that would circulate. Always include one.
- memorySummary: One sentence from the NPC's perspective — what just happened.
- elicitationWorked: true if the technique used was effective given this NPC's personality and weaknesses.
- elicitationNote: If elicitation worked, a one-sentence note explaining which technique worked and why (for the player's learning). Null if not.

NPC: ${npc.name}
NPC's secret: ${npc.secret ?? 'none'}
NPC's truths: ${(npc.truthsKnown ?? []).map(x => `- ${x}`).join("\n") || '- none'}
NPC's weaknesses: ${characterEcosystem[npc.name]?.weaknesses.join(", ") ?? "unknown"}
Turn: ${world.turn}
Clues already found: ${world.cluesDiscovered.length ? world.cluesDiscovered.join(", ") : "none"}

Player: "${playerMessage}"
NPC: "${npcReply}"
`.trim();
}
