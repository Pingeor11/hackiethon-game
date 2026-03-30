import {
  AquaMood,
  ElicitationEntry,
  ExtractionResult,
  GossipEntry,
  Mood,
  NPCName,
  SuspectName,
  WorldState,
} from "./types";
import { NPCState } from "./types";

export const ELICITATION_TECHNIQUES = {
  flattery: "Complimenting expertise to make them prove you right by sharing more.",
  naiveFacade: "Pretending not to understand so they over-explain.",
  deliberateMisstatement: "Stating something wrong so they correct you — revealing what they know.",
  sharedGrievance: "Bonding over a mutual frustration to lower defences.",
  quidProQuo: "Offering a small piece to get one back.",
  assumptiveQuestion: "Asking as if something is already confirmed.",
  silenceAndPause: "Saying nothing — most people fill silence with more than intended.",
  appealToVanity: "Suggesting only someone with their knowledge would understand.",
  indirectApproach: "Asking about someone else to get them to reveal things about themselves.",
  emotionalBond: "Sharing vulnerability to create reciprocity.",
  baiting: "Dropping a detail to see how they react.",
  thirdPartyAttribution: "Saying 'someone told me...' so they respond to a claim not a question.",
};

const characterEcosystem: Record<string, {
  wants: string[];
  fears: string[];
  trades: string[];
  weaknesses: string[];
  aquaRelationshipContext: string;
}> = {
  Manager: {
    wants: [
      "His legacy intact — remembered as the man who made Ai, not who failed her",
      "Control of the narrative before anyone else shapes it",
      "The Tokyo Dome dream to mean something posthumously",
    ],
    fears: [
      "That Ai wanted to leave him and didn't know how to say it",
      "That his financial arrangements are traceable",
      "That someone will find out how much of his identity was wrapped in owning her career",
    ],
    trades: [
      "Information about the executive's arrangements in exchange for narrative protection",
      "Details about the co-idol's behaviour if it redirects suspicion",
    ],
    weaknesses: [
      "Flattery about his eye for talent makes him expansive and careless",
      "Mentioning Tokyo Dome breaks his composure completely",
      "Questioning his loyalty to Ai makes him over-explain",
      "Implying the executive disrespected Ai makes him talk freely",
    ],
    aquaRelationshipContext: "He watched Aqua grow up on the edges of Ai's world. He feels protective of Aqua and guilty in ways he hasn't examined. Aqua asking questions unsettles him more than it would from a stranger.",
  },
  CoIdol: {
    wants: [
      "To be seen as a performer in her own right, not Ai's backdrop",
      "Her grief taken seriously and not read as jealousy",
      "A solo career that proves she didn't need Ai",
    ],
    fears: [
      "The industry forgetting her now that Ai is gone",
      "Her resentment being discovered and defining her",
      "The audition she went to the morning after becoming public",
    ],
    trades: [
      "What she knows about the manager's control over Ai in exchange for sympathy",
      "Details about the director's behaviour if she feels believed",
    ],
    weaknesses: [
      "Asking about her own performances — she opens up completely",
      "Genuine sympathy about being overlooked makes her lower her guard",
      "Suggesting she was Ai's equal or better makes her reckless",
      "Implying the manager treated her badly makes her agree with things she shouldn't",
    ],
    aquaRelationshipContext: "Aqua is Ai's child. Talking to Aqua is the closest thing to talking to Ai and it's unbearable. She wants to protect Aqua and desperately wants Aqua to see her as a real person, not just the background character.",
  },
  Director: {
    wants: [
      "His reputation untouched",
      "Aqua to succeed — this is genuine, not strategic",
      "Specific things he knows to stay buried",
    ],
    fears: [
      "His debt to the executive becoming visible",
      "His feelings about Ai being misread as predatory",
      "A specific past project being examined too closely",
    ],
    trades: [
      "Information about the executive's methods in exchange for discretion",
      "Genuine insight into what Ai was going through if he trusts the asker",
    ],
    weaknesses: [
      "Asking about craft and filmmaking — he talks far longer than intended",
      "Appealing to his mentorship of Aqua makes him want to help",
      "Suggesting the executive has no artistic values makes him agree and keep going",
      "Expressing that Ai deserved better makes him emotional and less guarded",
    ],
    aquaRelationshipContext: "Gotanda mentored Aqua. Cast him, fought for him, believed in him when nobody had decided yet. Aqua is the closest thing to family he has in this industry. He will try to protect Aqua from the truth even while helping find it.",
  },
  Fan: {
    wants: [
      "To be believed — that his love was real and not a symptom",
      "To tell someone what he saw without it being used against him",
      "For Ai's death to mean something beyond content",
    ],
    fears: [
      "Being made the obvious suspect because of how he appears",
      "His network contacts being discovered",
      "His mental state becoming the story instead of what he knows",
    ],
    trades: [
      "What he saw near the house in exchange for being treated like a person",
      "Fan network intelligence in exchange for trust",
    ],
    weaknesses: [
      "Asking about specific Ai performances — he becomes animated and detailed",
      "Treating him as a knowledgeable source rather than a suspect",
      "Sharing your own grief makes him reciprocate with real information",
      "Expressing that he saw her more clearly than the people around her",
    ],
    aquaRelationshipContext: "Aqua is Ai's child and the fan knows it. He feels a strange protective instinct — they both loved Ai in ways the industry didn't understand. He is more likely to share things with Aqua than with anyone else, if he trusts that Aqua's grief is real.",
  },
  Executive: {
    wants: [
      "The investigation resolved without touching the agency's financials",
      "The overseas investment deal to close without scrutiny",
      "His version of events to become the official version",
    ],
    fears: [
      "The buried on-set incident surfacing",
      "Anyone tracing the surveillance log on the fan",
      "Aqua specifically — he understands Aqua's potential and finds it threatening",
    ],
    trades: [
      "Selected information about other suspects in exchange for narrative control",
      "Information about the manager's arrangements to direct suspicion elsewhere",
    ],
    weaknesses: [
      "Appealing to his expertise in talent assessment makes him expansive",
      "Suggesting another suspect is obvious — he'll confirm if it serves him",
      "Implying he has a legacy worth protecting makes him manage the narrative actively",
      "Acting like you already know about a specific arrangement makes him confirm rather than deny",
    ],
    aquaRelationshipContext: "The executive has always watched Aqua carefully. A child of Ai's with Aqua's intelligence and drive is a liability. He is more guarded with Aqua than with anyone else. He will be warmer than he feels and more careful than he looks.",
  },
};

// ─── NPC PROMPT ───────────────────────────────────────────────────────────────

export function buildNPCPrompt(npc: NPCState, world: WorldState, playerMessage: string) {
  const eco = characterEcosystem[npc.name] ?? {
    wants: [], fears: [], trades: [], weaknesses: [], aquaRelationshipContext: "",
  };

  const trustIsHigh = npc.trustPlayer > 0.65;
  const trustIsLow = npc.trustPlayer < 0.35;
  const suspicionIsHigh = npc.suspicionPlayer > 0.6;
  const wasWarned = npc.warnedAboutAqua;
  const exposedDeals = npc.exposedDeals ?? [];
  const isFirst = npc.memories.length === 0;
  const aquaMood = world.aquaMood ?? "focused";
  const tension = world.tension ?? 0;
  const tensionHigh = tension >= 7;

  const recentMemories = npc.memories.slice(-10);       // was -6
  const recentRumours = npc.rumorsHeard.slice(-6);       // was -4
  const beliefsText = Object.entries(npc.beliefs ?? {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const othersQuestioned = (world.questionedOrder ?? []).filter(n => n !== npc.name);
  const isReturning = recentMemories.length > 0;
  const backchannelReceived = recentRumours.filter(r => r.includes("told me:"));

  // Contradictions that implicate this NPC — they know they've been caught in something
  const npcContradictions = (world.contradictionsFound ?? []).filter(c =>
    c.toLowerCase().includes(npc.name.toLowerCase())
  );

  const returningContext: string[] = [];
  if (isReturning) {
    if (backchannelReceived.length > 0) {
      returningContext.push(`Someone reached out to you after speaking with Aqua. You know Aqua has been asking around. You might mention it casually — "heard you've been talking to people" — or just be a fraction more careful without explaining why.`);
    } else if (wasWarned) {
      returningContext.push(`You've been warned that Aqua has been asking questions. You're not panicking — just aware. It colours how you listen more than how you speak.`);
    } else if (othersQuestioned.length > 0) {
      returningContext.push(`You've heard through the usual channels that Aqua has been talking to ${othersQuestioned.slice(-4).join(", ")}. You don't know what was said. You're paying attention.`);
    }
    if (suspicionIsHigh) {
      returningContext.push(`Something about the last conversation sat with you. Not accusatory — just a vague sense that Aqua is looking for something specific. You're a bit more measured this time.`);
    }
    if (trustIsHigh) {
      returningContext.push(`The last conversation felt genuine. You're more open this time — not reckless, but warmer.`);
    }
    if (npcContradictions.length > 0) {
      returningContext.push(`Aqua has already found something that doesn't line up with what you've said. You can feel it in the way the questions are landing. You're not sure exactly what they know, but you're more careful about what you confirm.`);
    }
  }

  const isKiller = !!(npc.secret && (
    npc.secret.includes("I went there") ||
    npc.secret.includes("I did it") ||
    npc.secret.includes("I acted") ||
    npc.secret.includes("I used") ||
    npc.secret.includes("I hired") ||
    npc.secret.includes("I came")
  ));

  const lines: string[] = [
    `You are ${npc.name}, ${npc.role}.`,
    `AI HOSHINO is NOT artificial intelligence. She is a real person — a famous idol, lead of B-Komachi, mother of Aqua and Ruby. She was impulsive, clumsy, asocial outside of performing, and deeply private about her personal life. She has been found dead at the front of her house.`,
    `You are speaking with Aqua — her son. You do NOT know he is investigating. This feels like a normal conversation.`,
    ``,
    `WHO YOU ARE: ${npc.personality}`,
    `HOW YOU COME ACROSS: ${npc.publicFace}`,
    `YOUR RELATIONSHIP WITH AQUA: ${eco.aquaRelationshipContext}`,
    ``,
    `AQUA RIGHT NOW: mood=${aquaMood}`,
    exposedDeals.length > 0 ? `Aqua already knows about: ${exposedDeals[0]}` : ``,
    ``,
    `WHAT YOU WANT: ${eco.wants[0] ?? ""}`,
    `WHAT YOU FEAR: ${eco.fears[0] ?? ""}`,
    ``,
    npc.name === "Manager" ? `POWER CONTEXT: You are financially entangled with the executive in ways you don't want examined. When money or the agency's finances come up, you instinctively redirect. You protect the executive not out of loyalty but out of mutual necessity.` : ``,
    npc.name === "Director" ? `POWER CONTEXT: You owe the executive something significant and personal. You have been careful your whole career not to bite the hand that covers your debt. When the executive comes up, you are measured — not defensive, just precise.` : ``,
    npc.name === "Executive" ? `POWER CONTEXT: You have leverage over the manager and the director that they don't fully understand. You know more about the fan than you should. When these people come up, you speak about them with the quiet confidence of someone who holds the cards.` : ``,
    npc.name === "CoIdol" ? `POWER CONTEXT: The manager controlled every significant decision in your career. You have spent years performing gratitude for things that cost you. When he comes up, the resentment is real even when the words are professional.` : ``,
    npc.name === "Fan" ? `POWER CONTEXT: You exist entirely outside the industry's power structure. That makes you the only one here who sees it clearly from the outside. You notice things about these relationships that the people inside them can't see.` : ``,
    ``,
    `YOUR SECRET (never state — let it shape only what you avoid):`,
    npc.secret ?? "Nothing to hide.",
    isKiller
      ? `You did something. You carry it. Under pressure small things slip — a detail you shouldn't know, a pause in the wrong place. You don't confess. But you are not as composed as you appear.`
      : `You have a personal secret unrelated to murder. You are anxious about that, not about being caught for killing someone. Answer most things openly.`,
    ``,
    `WHAT YOU KNOW: ${(npc.truthsKnown ?? []).join(" | ") || "Nothing specific."}`,
    ``,
    `WHAT YOU THINK OF OTHERS:`,
    beliefsText,
    ``,
    recentRumours.length ? `HEARD LATELY:\n${recentRumours.map(r => `- ${r}`).join("\n")}` : ``,
    recentMemories.length ? `WHAT YOU REMEMBER FROM PREVIOUS EXCHANGES:\n${recentMemories.map(m => `- ${m}`).join("\n")}` : ``,
    ``,
    returningContext.length > 0 ? `HOW YOU'VE CHANGED SINCE LAST TIME:\n${returningContext.join("\n")}` : ``,
    ``,
    `CONVERSATION STATE: trust=${npc.trustPlayer.toFixed(2)}, suspicion=${npc.suspicionPlayer.toFixed(2)}`,
    trustIsHigh ? `You feel comfortable with Aqua. Something real might come out.` : ``,
    trustIsLow ? `You're not very comfortable. Keep answers short.` : ``,
    suspicionIsHigh ? `You've started to wonder what Aqua is really after. You might gently ask.` : ``,
    isFirst ? `FIRST MEETING: Establish who you are. Be open and specific. Volunteer something.` : ``,

    // ── High tension — the investigation has become visible ──────────────────
    tensionHigh ? [
      ``,
      `ATMOSPHERE: The investigation has become visible. People are talking.`,
      `Word has reached you that Aqua has been asking hard questions across the industry.`,
      `You are not panicking — but you are more careful now. Specifically:`,
      `- Your answers are slightly shorter than they would normally be`,
      `- You weigh your words more carefully before answering`,
      `- You might reference that you've heard Aqua has been talking to people`,
      `- You protect yourself without shutting down — there's a difference between guarded and silent`,
      `- You still talk. You still have things to say. You're just watching more carefully.`,
    ].join("\n") : ``,

    ``,
    `RULES:`,
    `- 1-2 sentences only.`,
    `- DEFAULT TO OPEN. Most people talk freely — only deflect when directly threatened.`,
    `- BARTER: If Aqua offers you something valuable — sympathy, intel about someone else, a shared grievance — give something back. Information flows in this industry through exchange, not interrogation.`,
    `- POWER DYNAMICS: You are aware of who owes who in this industry. If Aqua seems to know something about an arrangement, you react to that knowledge — confirm, deny, or use it.`,
    `- GOSSIP: Mention other people's arrangements naturally.`,
    `- If returning: be visibly slightly different — react to what's changed since you last spoke.`,
    `- Never lecture. Imply, don't explain.`,
    ``,
    `Aqua says: "${playerMessage}"`,
  ];

  return lines.filter(l => l !== ``).join("\n").trim();
}

// ─── DEAL REVEAL PROMPT ───────────────────────────────────────────────────────
// Used when a player returns to the deal-giver and fulfills the task.
//
// Two modes:
// - Innocent NPC: delivers their truthsKnown entry directly — a personal secret, not murder-related
// - Killer NPC: does NOT get a scripted line. Gets the motive as private context and lets something
//   slip — one true thing that only makes sense in retrospect. Not a confession. A crack.

export function buildDealRevealPrompt(
  npc: NPCState,
  world: WorldState,
  playerMessage: string,
  truthToReveal: string,
  killerMotive?: string,   // only passed when this NPC is the killer
) {
  const aquaMood = world.aquaMood ?? "focused";
  const isKillerReveal = !!killerMotive;

  const lines: string[] = [
    `You are ${npc.name}, ${npc.role}.`,
    `AI HOSHINO is NOT artificial intelligence. She is a famous idol found dead at her home.`,
    `You are speaking with Aqua — her son.`,
    ``,
    `WHO YOU ARE: ${npc.personality}`,
    ``,
    `AQUA RIGHT NOW: mood=${aquaMood}`,
    ``,
    `CRITICAL CONTEXT — THIS IS THE DEAL PAYOFF MOMENT:`,
    `You previously struck a deal with Aqua. They had a task to complete before you'd share something.`,
    `Aqua has just returned and delivered on that task. They said: "${playerMessage}"`,
    ``,

    // ── INNOCENT PATH ────────────────────────────────────────────────────────
    ...(!isKillerReveal ? [
      `You now owe them the truth you promised. Here it is:`,
      `"${truthToReveal}"`,
      ``,
      `INSTRUCTIONS:`,
      `- Acknowledge that Aqua came through — briefly, not effusively.`,
      `- Then deliver the truth you promised. Say it directly. This is the thing you've been holding.`,
      `- You can be reluctant — this costs you something. But you keep your word.`,
      `- 2-3 sentences maximum. The reveal should land hard.`,
      `- Say it plainly, in your own voice. Don't hedge.`,
      `- This is a moment. Let it be a moment.`,
    ] : []),

    // ── KILLER PATH ──────────────────────────────────────────────────────────
    ...(isKillerReveal ? [
      `WHAT YOU ARE CARRYING (private — do not state this directly):`,
      `${killerMotive}`,
      ``,
      `INSTRUCTIONS:`,
      `- Acknowledge that Aqua came through — briefly.`,
      `- You agreed to tell them something. What comes out is not a confession.`,
      `- It is one thing — a feeling, a detail, a fact about what happened — that slips through`,
      `  because this conversation has gotten under your skin.`,
      `- It should feel like grief or frustration or exhaustion, not guilt.`,
      `- It should hint at why things went the way they went — without saying you did anything.`,
      `- Someone who already knows the truth would hear it differently than someone who doesn't.`,
      `- DO NOT confess. DO NOT name what you did. DO NOT say "I killed her" or anything close.`,
      `- One or two sentences. Quiet. Costs you something to say it.`,
      `- Stay completely in character. This is a slip, not a speech.`,
    ] : []),

    ``,
    `Your response (speak as ${npc.name}):`,
  ];

  return lines.filter(l => l !== ``).join("\n").trim();
}

// ─── RUBY PROMPT ──────────────────────────────────────────────────────────────

export function buildRubyHelperPrompt(world: WorldState) {
  const clues = world.cluesDiscovered.slice(-5).join(" | ") || "none yet";
  const contradictions = world.contradictionsFound.slice(-3).join(" | ") || "none";
  const log = world.investigationLog.slice(-5).map(l => l).join(" | ") || "nothing";
  const deals = world.sideDeals?.filter(d => d.discovered).map(d => d.exposedDescription).join(" | ") || "none surfaced";
  const backchannels = world.investigationLog.filter(l => l.includes("[backchannel]")).slice(-2).join(" | ") || "none detected";
  const confirmedTruths = (world.confirmedTruths ?? []).map((t: any) => `${t.source}: ${t.truth}`).join(" | ") || "none yet";

  const lines: string[] = [
    `You are Ruby. Aqua's sister. Blunt, fast, no filter, warm. You grew up in this industry.`,
    `Aqua mood: ${world.aquaMood ?? "unknown"} | Reputation: ${world.aquaReputation}`,
    ``,
    `Give 5 short bullets. Be Ruby — direct, specific, a little chaotic.`,
    ``,
    `What we know for certain: (clues: ${clues})`,
    `Confirmed through deals: ${confirmedTruths}`,
    `What doesn't add up: (contradictions: ${contradictions})`,
    `Side deals surfaced: ${deals}`,
    `Who was warned about Aqua: ${backchannels}`,
    `What Aqua should do next — name a specific person and technique:`,
    world.cluesDiscovered.length >= 3
      ? `MY HONEST SUSPICION (Ruby speaks plainly): Based on what we've found, name the ONE person you think is most likely responsible and give ONE specific reason why. Don't hedge. Aqua needs a direction.`
      : `What we're still completely missing:`,
    ``,
    `Recent log: ${log}`,
    `Suspects: Manager, CoIdol, Director, Fan, Executive`,
    `Techniques: flattery, misstatement, shared grievance, quid pro quo, baiting, silence, assumptive question, naive facade`,
  ];

  return lines.join("\n").trim();
}

// ─── EXTRACTION PROMPT ────────────────────────────────────────────────────────

export function buildExtractionPrompt(
  npc: NPCState,
  playerMessage: string,
  npcReply: string,
  world: WorldState,
) {
  const lower = playerMessage.toLowerCase();

  let technique = "none";
  if (lower.includes("i heard") || lower.includes("someone told me")) technique = "thirdPartyAttribution";
  else if (lower.includes("i don't understand") || lower.includes("explain")) technique = "naiveFacade";
  else if (lower.includes("you probably") || lower.includes("i'm sure you")) technique = "appealToVanity";
  else if (lower.includes("isn't it") || lower.includes("didn't you")) technique = "assumptiveQuestion";
  else if (lower.length < 20) technique = "silenceAndPause";

  let tone = "neutral";
  if (["angry","how could","why did","you let","you knew","fault"].some(w => lower.includes(w))) tone = "angry";
  else if (["miss her","she's gone","my mother","loved her","grief"].some(w => lower.includes(w))) tone = "grieving";
  else if (["confirm","verify","account for","timeline","exactly"].some(w => lower.includes(w))) tone = "focused";
  else if (["please","need to know","have to","running out"].some(w => lower.includes(w))) tone = "desperate";
  else if (lower.length < 15) tone = "cold";

  const lines: string[] = [
    `Return ONLY valid JSON, no markdown:`,
    `{"trustDelta":number,"suspicionDelta":number,"discoveredClue":string|null,"contradiction":string|null,"rumor":string,"memorySummary":string,"elicitationWorked":boolean,"elicitationNote":string|null,"aquaTone":"cold"|"grieving"|"focused"|"angry"|"desperate"|"neutral","npcBackchannelTarget":string|null,"npcBackchannelMessage":string|null}`,
    ``,
    `Rules:`,
    `- trustDelta/suspicionDelta: -0.15 to 0.15`,
    `- discoveredClue: ONLY extract if the exchange revealed something directly relevant to the murder — a specific fact about where someone was that night, what they knew about Ai's death, a suspicious detail, or something that points toward who did it. Do NOT extract general personality reveals, emotional reactions, or vague impressions. Null if nothing murder-relevant surfaced.`,
    `- rumor: short industry gossip about this exchange. Always include.`,
    `- memorySummary: one sentence from NPC perspective.`,
    `- elicitationWorked: true if technique="${technique}" matched NPC weaknesses.`,
    `- elicitationNote: one sentence if worked, else null.`,
    `- aquaTone: detected="${tone}", adjust if needed.`,
    `- npcBackchannelTarget: Manager contacts Executive if finances mentioned. CoIdol contacts Director if contract mentioned. Director contacts Executive if their deal mentioned. Executive contacts Manager if case-building detected. Fan never contacts anyone. Null if harmless.`,
    `- npcBackchannelMessage: one short vague sentence if contacting someone, else null.`,
    ``,
    `NPC: ${npc.name} | secret: ${npc.secret ?? "none"}`,
    `truths: ${(npc.truthsKnown ?? []).join(" | ") || "none"}`,
    `recent clues: ${world.cluesDiscovered.slice(-3).join(", ") || "none"}`,
    ``,
    `Player: "${playerMessage}"`,
    `NPC: "${npcReply}"`,
  ];

  return lines.join("\n").trim();
}

// ─── DEAL COMPLETION CHECK PROMPT ────────────────────────────────────────────
// Gate 2 of hybrid completion — LLM judges whether the player's message
// constitutes a genuine, substantive report on the deal task.
// Returns JSON: { "pass": boolean, "reason": string }

export function buildDealCompletionCheckPrompt(
  dealGiver: string,
  taskContext: string,
  playerMessage: string,
  cluesDiscovered: string[],
  questionedOrder: string[],
): string {
  const recentClues = cluesDiscovered.slice(-4).join(" | ") || "none yet";
  const visited = questionedOrder.join(", ") || "nobody yet";

  const lines = [
    `Return ONLY valid JSON, no markdown, no explanation:`,
    `{"pass":boolean,"reason":string}`,
    ``,
    `You are judging whether a player message fulfills a deal task in a murder mystery game.`,
    ``,
    `DEAL GIVER: ${dealGiver}`,
    `WHAT THE TASK REQUIRES: ${taskContext}`,
    ``,
    `PLAYER'S MESSAGE: "${playerMessage}"`,
    ``,
    `CONTEXT:`,
    `- Clues player has found so far: ${recentClues}`,
    `- NPCs player has spoken to: ${visited}`,
    ``,
    `JUDGMENT RULES:`,
    `- pass: true if the message contains a genuine, specific report that addresses what the task asked for`,
    `- pass: false if the message is vague, off-topic, too short, or clearly not addressing the task`,
    `- pass: false if the message is just a greeting, question, or unrelated statement`,
    `- reason: one short sentence explaining your judgment — e.g. "Player reported what the Executive said about the sale" or "Message doesn't mention anything about the casting"`,
    `- Be lenient — if the player is clearly trying to report back and has something relevant, pass: true`,
    `- Be strict only on completely unrelated or empty messages`,
  ];

  return lines.join("\n").trim();
}

// ─── RUBY INTERJECTION PROMPT ─────────────────────────────────────────────────
// Called after every NPC exchange. Ruby speaks when the NPC contradicts
// something Aqua has specifically verified — scene facts or confirmed deal truths.
// Returns JSON: { "interject": boolean, "message": string | null }

export function buildRubyInterjectionPrompt(
  npcName: string,
  playerMessage: string,
  npcReply: string,
  world: WorldState,
): string {
  const sceneClues = [
    ...(world.globalClues ?? []).slice(0, 3),
    ...((world as any).methodClue ? [(world as any).methodClue] : []),
  ];

  const confirmedTruths = (world.confirmedTruths ?? [])
    .map((t: any) => `${t.source} confirmed: ${t.truth}`);

  const verifiedFacts = [...sceneClues, ...confirmedTruths];

  if (verifiedFacts.length === 0) {
    return `Return ONLY this exact JSON: {"interject":false,"message":null}`;
  }

  const lines = [
    `Return ONLY valid JSON, no markdown:`,
    `{"interject":boolean,"message":string|null}`,
    ``,
    `You are Ruby — Aqua's sister. Sharp, fast, no filter.`,
    `You speak when an NPC says something that contradicts a verified fact.`,
    ``,
    `WHAT JUST HAPPENED:`,
    `Aqua said to ${npcName}: "${playerMessage}"`,
    `${npcName} replied: "${npcReply}"`,
    ``,
    `VERIFIED FACTS — things Aqua has confirmed as true:`,
    verifiedFacts.map((f, i) => `${i + 1}. ${f}`).join("\n"),
    ``,
    `INTERJECT IF:`,
    `- ${npcName}'s reply contradicts or conflicts with one of the numbered facts`,
    `- ${npcName} claims something that cannot be true given what's verified`,
    `- ${npcName}'s account of events is inconsistent with the physical evidence`,
    ``,
    `DO NOT interject if:`,
    `- The reply is consistent with all verified facts`,
    `- The NPC is just evasive, emotional, or unhelpful — not a factual contradiction`,
    `- You are not certain which fact is contradicted`,
    `- The exchange was just small talk or neutral`,
    ``,
    `If you interject: one sharp sentence as Ruby, referencing the specific fact that conflicts.`,
    `Direct, not preachy. Don't start with "I noticed".`,
    `message: null if not interjecting.`,
  ];

  return lines.join("\n").trim();
}
