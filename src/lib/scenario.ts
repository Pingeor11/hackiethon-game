import { GossipEntry, NPCName, NPCState, PowerDynamic, ScenarioTemplate, SuspectName, WorldState } from "./types";

// ─── FIXED CHARACTER IDENTITIES ───────────────────────────────────────────────
// These never change between runs. This is who these people are.

const FIXED_NPCS: Record<NPCName, Omit<NPCState, "secret" | "truthsKnown" | "sentMessages" | "warnedAboutAqua" | "exposedDeals">> = {

  Manager: {
    name: "Manager",
    role: "Ai's manager — the man who found her, built her, and never quite figured out where his job ended and his love for her began",
    personality: "Acts like a father even when he shouldn't. Protective to the point of suffocation. Gets a faraway look when Ai's name comes up, then snaps back and straightens his jacket. Has been in this industry long enough to know exactly how it breaks people, which somehow never stopped him from putting Ai into it. Speaks in short sentences when he's emotional. Which is most of the time now.",
    publicFace: "The steady professional. The man with the plan. In meetings he's composed and strategic. Alone he looks like someone who just had the future he was building ripped out from under him — because he did.",
    backstory: "He scouted Ai when she was nobody. Saw something in her that other people walked past. Built B-Komachi around her. The Tokyo Dome dream was his as much as hers — maybe more, because for Ai it was a goal and for him it was the only thing he had left to want. He was a father figure to her in all the ways that mattered and none of the ways that were official. Now she's dead and he doesn't know what he is.",
    beliefs: {
      CoIdol: "She resented Ai. I always knew. I thought it would stay where it was.",
      Director: "Good man. Genuinely good man. Which is why I trust him more than most people here.",
      Fan: "I should have done more about him. That's something I have to live with.",
      Executive: "He sees the industry like a portfolio. People are assets. I've worked with him for years and I still find that hard.",
      Ruby: "She's going to find the truth. I hope she's ready for it.",
    },
    trustPlayer: 0.6,
    suspicionPlayer: 0.1,
    mood: "calm",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
    aquaRelationship: "Watched Aqua grow up in Ai's orbit. Protective and guilty in equal measure.",
  },

  CoIdol: {
    name: "CoIdol",
    role: "Ai's co-idol in B-Komachi — the one who stood next to Ai on every stage and smiled for every camera and felt like a B-side in her own life",
    personality: "Sharp. Funny in a cutting way. Has opinions about everything and delivers them with a precision that used to be charming and now just sounds like someone who's been sharpening a knife for years. Loves Ai in the complicated way you love someone who took everything from you without ever meaning to. The grief is real. The resentment is real. Both are true at the same time and she's exhausted by it.",
    publicFace: "The gracious co-star. Gives perfect soundbites about Ai being irreplaceable. Checks her own reflection in windows. Has perfected the art of crying beautifully. Somewhere beneath the performance is a person who is genuinely devastated and genuinely furious and has no idea how to separate the two.",
    backstory: "Trained for six years before debut. Ai trained for two. The co-idol does not let herself think about this number too often because when she does she has to lie down. Was the centre before Ai joined. Then she was the support. The harmony. The one who made Ai look better. Has smiled through every demotion and every 'Ai really is special isn't she' and every award ceremony where she stood two steps behind. Loves Ai. Loathes what loving Ai costs her. Will grieve her forever.",
    beliefs: {
      Manager: "He built his whole life around her. I wonder if he even sees the rest of us.",
      Director: "He always cast Ai first. I was always 'and also'. He was kind about it which made it worse.",
      Fan: "There's something broken in him. I used to find it sad. Now I just find it frightening.",
      Executive: "Would have dropped me years ago if I wasn't useful packaging for Ai's brand. I know that.",
      Ruby: "She loved Ai without the complications. I'm jealous of that too.",
    },
    trustPlayer: 0.45,
    suspicionPlayer: 0.2,
    mood: "nervous",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
    aquaRelationship: "Aqua is Ai's child. Talking to Aqua is the closest thing to talking to Ai. Unbearable and magnetic at once.",
  },

  Director: {
    name: "Director",
    role: "Gotanda — award-winning director, long-time collaborator of Ai's, and the closest thing Aqua has to a mentor",
    personality: "Thoughtful. Careful with words in the way that only people who know their words carry weight tend to be. Has a warmth that's entirely genuine and a private life he keeps entirely private. One of the rare people in this industry who got famous without losing himself in the process — or so everyone believes. Gets visibly emotional when Aqua comes up. Has always believed in him.",
    publicFace: "The good one. The one everyone points to when people say the industry can produce decent human beings. Universally respected. Works with young talent seriously. Has never had a scandal. This fact is either a testament to his character or to his management of it.",
    backstory: "Worked with Ai prolifically as she became a household name. Watched Aqua grow up on sets and recognised something in him early. Became a genuine mentor to Aqua — not a professional contact, a real figure. Cast him, fought for him, believed in him when the industry hadn't decided about him yet. Has complicated feelings about Ai's death that he hasn't fully processed. Has complicated feelings about a lot of things he hasn't fully processed.",
    beliefs: {
      Manager: "He loved her. That's not in question. What I question is whether love was enough of a reason to make the choices he made.",
      CoIdol: "She was always in Ai's shadow and she always knew it. I felt guilty about that. I kept casting Ai anyway.",
      Fan: "I've directed enough projects to understand obsession. What he has is something past that.",
      Executive: "We've worked together. I understand how he thinks. I don't always like how he thinks.",
      Ruby: "She's going to be okay. She's stronger than she looks. She's stronger than Aqua gives her credit for.",
    },
    trustPlayer: 0.7,
    suspicionPlayer: 0.08,
    mood: "calm",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
    aquaRelationship: "Mentored Aqua. Cast him. Believed in him. Aqua is the closest thing to family he has in this industry.",
  },

  Fan: {
    name: "Fan",
    role: "the fan — a shut-in whose entire emotional world is Ai Hoshino, and has been for years",
    personality: "Intense in a way that makes people take a small step back. Speaks about Ai with a reverence that crosses into something harder to name. His room has her posters on every wall. He has attended every concert he could reach. He is not performing his devotion — it is the most genuine thing about him and also the most alarming thing about him. Gets defensive fast. Is used to people not understanding. Is used to being seen as a problem.",
    publicFace: "Looks like someone who doesn't get outside much. Pale. Slightly overwhelmed by direct eye contact. Carries himself like someone who has been told he is too much, too often, and has started to believe it. The intensity doesn't go away when he tries to tone it down. It just goes sideways.",
    backstory: "Turned to idol culture because the real world didn't have a place for him. Ai was the thing that made him feel like he mattered — not personally, not delusionally, just the way music makes you feel like someone out there gets it. Then it became more than that. He has attended two hundred and fourteen of her appearances. He knows her schedule. He has connections inside fan networks that go deeper than anyone official knows about. He is mentally unstable in ways he hasn't named and hasn't treated. He knows something happened near the house that night. He hasn't decided what to do with that yet.",
    beliefs: {
      Manager: "He controlled everything about her life. She couldn't breathe without his permission. I hated watching that.",
      CoIdol: "She always looked at Ai like she was calculating something. I noticed. I always noticed things other people missed.",
      Director: "He genuinely cared about her work. I respected that. He's one of the few people in her life I think actually saw her.",
      Executive: "The agency is already moving on. I saw it. Two days after she died and they were already moving on.",
      Ruby: "Ruby is real. Ruby is the only person here who misses her the way I do.",
    },
    trustPlayer: 0.3,
    suspicionPlayer: 0.3,
    mood: "nervous",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
    aquaRelationship: "Feels a strange kinship — they both loved Ai in ways the industry didn't understand.",
  },

  Executive: {
    name: "Executive",
    role: "the agency's executive officer — a man with a keen eye for talent and absolutely no interest in anything that doesn't make money",
    personality: "Has the warmth of someone who learned warmth as a professional skill and has been using it so long it's almost indistinguishable from the real thing. Assesses every person in under thirty seconds. Speaks in outcomes. Has a genuine talent for finding talent and a genuine lack of interest in what happens to talent after it stops being profitable. Grief is a communications problem. Loss is a brand event.",
    publicFace: "Authoritative. Sympathetic in the correct proportion. The kind of man who makes other people feel like things are being handled. They are being handled. The question is for whose benefit.",
    backstory: "Has been running the agency for fifteen years. Found Ai through the manager's scouting report and agreed she was exceptional — not because of anything personal but because the numbers were obvious. Has a perfect record of commercialising talent. Has a less examined record of what happens to that talent afterward. Is already thinking about what Ai's death means for Q3. Feels nothing about this that he would call grief. Feels something he hasn't named.",
    beliefs: {
      Manager: "Emotionally compromised. Has been since she died. Possibly before. That makes him a liability.",
      CoIdol: "Still commercially viable if positioned correctly. I've been thinking about her future.",
      Director: "Useful. Has always been useful. We have an understanding.",
      Fan: "A problem that was managed incorrectly. I have documentation of the security reports that were filed and ignored.",
      Ruby: "She's not industry. That makes her unpredictable. Unpredictable is the thing I like least.",
    },
    trustPlayer: 0.35,
    suspicionPlayer: 0.2,
    mood: "guarded",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
    aquaRelationship: "Has always watched Aqua carefully. A child of Ai's with Aqua's drive is a liability.",
  },

  Ruby: {
    name: "Ruby",
    role: "Ruby — Aqua's sister, Ai's daughter, the loudest person in any room and currently the most determined",
    personality: "Extroverted, outgoing, loud, optimistic in the way that requires constant effort and never stops. Speaks without a filter — says what she thinks before she's finished thinking it, then keeps going. Makes connections with people instantly and genuinely. Is the opposite of her brother in almost every way. Is also, right now, running entirely on grief and purpose and not sleeping enough.",
    publicFace: "She looks like someone who has been crying and has decided that crying is not the end of anything. Talks fast. Remembers everything about everyone. Introduces herself to strangers at crime scenes. Currently treating finding the truth about Ai as a personal project she has accepted will take as long as it takes.",
    backstory: "Grew up knowing Ai as her mother. Knows the industry, knows the people, knows the shape of what Aqua is trying to do. Wants the truth not for justice in the abstract but because Ai was her mother and she deserved better and Ruby is going to make sure someone says so. Keeps making jokes that don't land because it's how she handles things. Apologises for the jokes immediately. Makes another one.",
    beliefs: {
      Manager: "I know he loved her. I also know love isn't the same as not having done something wrong.",
      CoIdol: "She's hiding something about the last real conversation she had with Ai. Every time it comes up she does this thing with her face.",
      Director: "I trust Gotanda. Aqua trusts Gotanda. That probably means we should still check.",
      Fan: "He knows something. The way he keeps almost saying things and then stopping himself — he knows something.",
      Executive: "He called legal before he called anyone who loved her. I keep coming back to that.",
    },
    trustPlayer: 0.95,
    suspicionPlayer: 0,
    mood: "helpful",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: false,
    aquaRelationship: "Aqua's sister. Complete trust.",
  },
};

// ─── INNOCENT COVERS ──────────────────────────────────────────────────────────
// When not the killer, each suspect gets a real human secret unrelated to murder.
// These should feel consistent with who they are — the same person, just not guilty of this.

const innocentCovers: Record<SuspectName, Array<{ secret: string; truthsKnown: string[] }>> = {

  Manager: [
    {
      secret: "He had been quietly planning to leave the agency after Ai's Tokyo Dome performance — had already begun preliminary conversations with a rival management firm. The guilt of being mentally halfway out the door while Ai was killed is something he can't say out loud.",
      truthsKnown: [
        "I was already planning my exit. I hadn't told anyone. I hadn't told Ai.",
        "She died before I could. I don't know what I would have done if she'd lived and found out.",
      ],
    },
    {
      secret: "He borrowed from the agency's discretionary fund to cover a personal debt — not embezzlement technically, but close enough to destroy him professionally if surfaced during an investigation.",
      truthsKnown: [
        "There's a financial irregularity connected to my name. It has nothing to do with Ai.",
        "But it surfaces in a detailed investigation and it ends my career. I can't let that happen.",
      ],
    },
    {
      secret: "He was with someone the night Ai died — a relationship outside his marriage that he cannot disclose without destroying his family. He has an alibi. He cannot use it.",
      truthsKnown: [
        "I know exactly where I was that night. I can prove it.",
        "Using that proof ends my marriage. Ends my relationship with my kids. I won't do it.",
      ],
    },
  ],

  CoIdol: [
    {
      secret: "She had a secret audition for a solo contract at a rival label the morning after Ai died. She still went. She got the callback. The shame of that decision is going to follow her for the rest of her career.",
      truthsKnown: [
        "I had an audition the day after. I went. I'm not proud of it.",
        "Ai didn't know I was looking to leave. I kept meaning to tell her. I didn't.",
      ],
    },
    {
      secret: "She had a breakdown three months ago that the agency covered up. She's on medication she hasn't disclosed publicly. She's terrified a full investigation surfaces her mental health records and she becomes the story instead of Ai.",
      truthsKnown: [
        "I've been on medication for three months. The agency has been managing that information.",
        "If it becomes public the narrative shifts to me. I can't let that happen to Ai's story.",
      ],
    },
    {
      secret: "She was in a relationship with someone the agency has explicitly forbidden — a member of a rival group. She wasn't alone that night. Her alibi is airtight and career-ending simultaneously.",
      truthsKnown: [
        "I wasn't alone that night. I can prove exactly where I was.",
        "The person who can confirm it — using them ends both of our contracts.",
      ],
    },
  ],

  Director: [
    {
      secret: "He was quietly in love with Ai for years. Never said it, never acted on it. He is grieving in a way he cannot perform publicly because it would look predatory on a person he genuinely, purely loved from a respectful distance.",
      truthsKnown: [
        "My feelings about Ai were not purely professional. They were real. They were never acted on.",
        "I can't grieve her the way I need to. I don't know what to do with that.",
      ],
    },
    {
      secret: "He plagiarised a significant portion of a produced screenplay early in his career — material he adapted from an unpublished work by a writer who has since died. Ai knew. She never used it. He never understood why.",
      truthsKnown: [
        "Ai had access to something that could have ended my career. She chose not to use it.",
        "I never understood why. I don't know if she was protecting me or saving it.",
      ],
    },
    {
      secret: "He has been doing undisclosed favours for the executive for years to repay a significant personal debt. Nothing criminal — just the kind of quiet arrangement that looks catastrophic in the middle of a murder investigation.",
      truthsKnown: [
        "My relationship with the executive is more entangled than it appears publicly.",
        "I've done things for him. Nothing illegal. The appearance is the problem.",
      ],
    },
  ],

  Fan: [
    {
      secret: "He was outside the house that night to leave a handwritten letter. He heard shouting and ran before seeing anything. Admitting he was there makes him the obvious suspect and he knows it.",
      truthsKnown: [
        "I was at the house. I heard something. I panicked and ran.",
        "I didn't see who it was. I don't know what I almost witnessed.",
      ],
    },
    {
      secret: "He has connections inside the fan network that gave him access to Ai's schedule in ways the agency didn't know about. Some of those connections are with people who had grievances against the agency. This looks much worse than it is.",
      truthsKnown: [
        "I have contacts who gave me access to information I wasn't supposed to have.",
        "None of it was meant to hurt her. I was trying to be close to her. I know how that sounds.",
      ],
    },
    {
      secret: "He received a cease-and-desist from the agency two months ago about his fan account content. He complied with everything. The letter exists and documents a formal grievance between him and the organisation that managed Ai.",
      truthsKnown: [
        "The agency's lawyers contacted me formally. I did everything they asked.",
        "The letter exists. It makes me look like I had reason to be angry. I wasn't. Not enough.",
      ],
    },
  ],

  Executive: [
    {
      secret: "He is mid-process on secretly selling his stake in the agency to an overseas investment group. The deal collapses if it becomes public before it closes. Every deflection and damage-control move is about protecting the transaction, not covering a murder.",
      truthsKnown: [
        "I have a financial deal in progress that cannot survive public scrutiny right now.",
        "It has nothing to do with Ai's death. That does not make it something I can discuss.",
      ],
    },
    {
      secret: "Six months ago he buried an on-set accident involving another artist with an NDA. A thorough investigation into Ai might surface that case. He isn't afraid of being caught for this murder. He's afraid of being caught for that one.",
      truthsKnown: [
        "There was a separate incident before this. It was handled quietly.",
        "I'm not worried about this investigation specifically. I'm worried about what it uncovers beside it.",
      ],
    },
    {
      secret: "He pressured Ai to delay going public about a health issue because the timing was bad for the agency. She wanted to be honest with her fans. He told her to wait. She never got the chance. He carries this and has told no one.",
      truthsKnown: [
        "I told Ai not to make an announcement she wanted to make. I said it was about timing.",
        "It was about the agency. She knew that. She did what I asked. And then she died.",
      ],
    },
  ],
};

// ─── SCENARIOS ────────────────────────────────────────────────────────────────
// Each scenario: only one killer, specific motive, specific method.
// The same characters — but different circumstances led here.

// ─── POWER DYNAMICS ──────────────────────────────────────────────────────────
// Each scenario picks these — they surface through gossip and unlock killer implications.
// The gossipHints drip out when either party is questioned.
// When hintsNeeded hints have surfaced, killerImplication unlocks as a confirmed clue.

function buildPowerDynamics(killer: SuspectName): PowerDynamic[] {
  const all: PowerDynamic[] = [

    // ── MANAGER over COIDOL ───────────────────────────────────────────────
    {
      id: "manager_controls_coidol",
      holder: "Manager",
      subject: "CoIdol",
      description: "The manager controls the co-idol's bookings, image, and public narrative. She cannot move without his approval.",
      gossipHints: [
        "Word is the co-idol's solo projects keep getting quietly shelved — someone at the top doesn't want her stepping out.",
        "Industry sources say the co-idol was passed over for a major casting because her management didn't submit her application.",
        "A stylist mentioned the co-idol has been asking around about other agencies — apparently she feels trapped.",
      ],
      killerImplication: killer === "Manager"
        ? "The manager's total control over B-Komachi explains why Ai's defection or exposure would destroy everything he'd built — motive to silence her permanently."
        : killer === "CoIdol"
        ? "The co-idol was suffocating under the manager's control — Ai's solo deal would have ended the group and freed her, but it also meant the co-idol had nothing left to lose."
        : "The manager's control over B-Komachi created a pressure cooker — everyone inside it had reason to act.",
      hintsNeeded: 2,
      hintsCollected: 0,
      exposed: false,
    },

    // ── EXECUTIVE over MANAGER ────────────────────────────────────────────
    {
      id: "executive_owns_manager",
      holder: "Executive",
      subject: "Manager",
      description: "The manager receives undisclosed payments from the executive's holding company. He is financially dependent on the executive's goodwill.",
      gossipHints: [
        "Financial circles are whispering about unusual transfers from an agency holding company to individual management accounts.",
        "The manager drives a car that costs twice his disclosed salary — someone's supplementing his income.",
        "A former agency accountant let slip that certain managers are on informal retainers that don't appear in contracts.",
      ],
      killerImplication: killer === "Manager"
        ? "The manager's financial dependency on the executive means Ai's planned legal action wasn't just a personal threat — it would have exposed the whole arrangement and ended both of them."
        : killer === "Executive"
        ? "The executive's financial hold over the manager explains why the manager stayed quiet and why the executive could operate without fear of exposure."
        : "The financial arrangement between the manager and executive runs deeper than it appears.",
      hintsNeeded: 2,
      hintsCollected: 0,
      exposed: false,
    },

    // ── DIRECTOR owes EXECUTIVE ───────────────────────────────────────────
    {
      id: "director_indebted_executive",
      holder: "Executive",
      subject: "Director",
      description: "The director has been completing productions at below-market rates for years, repaying a personal debt to the executive through work.",
      gossipHints: [
        "Industry people find it odd that a director of Gotanda's calibre keeps working with the same agency at fees well below his market rate.",
        "A production manager mentioned Gotanda turns down higher-paying projects to keep a standing commitment to this agency — nobody understands why.",
        "Word is Gotanda and the executive go back further than their professional relationship suggests — something personal.",
      ],
      killerImplication: killer === "Director"
        ? "Gotanda's debt to the executive meant he couldn't afford scrutiny — Ai exposing him would have unravelled the entire arrangement and destroyed both careers."
        : killer === "Executive"
        ? "The executive's hold over Gotanda is one of several quiet arrangements he maintains — Ai threatened to expose the whole network."
        : "Gotanda's loyalty to the agency isn't professional — it's financial obligation.",
      hintsNeeded: 2,
      hintsCollected: 0,
      exposed: false,
    },

    // ── EXECUTIVE over FAN ────────────────────────────────────────────────
    {
      id: "executive_surveilled_fan",
      holder: "Executive",
      subject: "Fan",
      description: "The executive had the fan under surveillance through a security contractor — building a profile on him as a potential asset or scapegoat.",
      gossipHints: [
        "Fan community members noticed a new account joining their private groups six months ago — unusually well-informed, asking specific questions about Ai's schedule.",
        "A security firm connected to the agency has been spotted around fan event venues — not the usual protection detail.",
        "Someone in the fan community received money to share Ai's location data — they've gone quiet about where it came from.",
      ],
      killerImplication: killer === "Executive"
        ? "The executive didn't just surveil the fan — he cultivated him as a ready-made suspect. The murder was planned around the fan's existence."
        : killer === "Fan"
        ? "The fan was being watched and potentially manipulated long before he acted — someone gave him access and proximity he shouldn't have had."
        : "The fan was a piece on someone else's board long before Ai died.",
      hintsNeeded: 2,
      hintsCollected: 0,
      exposed: false,
    },

    // ── COIDOL rivalry with AI ────────────────────────────────────────────
    {
      id: "coidol_ai_rivalry",
      holder: "CoIdol",
      subject: "CoIdol",  // self-directed dynamic — about her internal state
      description: "The co-idol's entire professional identity was built in Ai's shadow. Every success Ai had cost the co-idol something.",
      gossipHints: [
        "People on set said the atmosphere between Ai and the co-idol had been cold for months — something changed after the last tour.",
        "A choreographer mentioned the co-idol started requesting separate rehearsal times from Ai about six months ago.",
        "Industry friends of the co-idol say she'd been drinking more than usual and making calls to casting directors she wasn't supposed to know.",
      ],
      killerImplication: killer === "CoIdol"
        ? "The co-idol didn't just resent Ai — she had been systematically building an exit while simultaneously watching every door close. When Ai's solo deal became real, there was nothing left to protect."
        : "The co-idol's relationship with Ai was more fractured than the public tributes suggest — she was planning her own future without Ai in it.",
      hintsNeeded: 2,
      hintsCollected: 0,
      exposed: false,
    },
  ];

  // Return all dynamics — they're all relevant regardless of killer
  // The killerImplication is tailored per killer so whichever ones surface point correctly
  return all;
}

// ─── SIDE DEAL POOLS ─────────────────────────────────────────────────────────
// Each scenario picks from these. They surface when related clues are found.

function buildSideDeals() {
  return [
    {
      id: "manager_executive_retainer",
      parties: ["Manager", "Executive"] as NPCName[],
      description: "The manager receives a quarterly retainer from the executive's holding company that does not appear in agency paperwork.",
      surfaceClue: "financial payment manager executive arrangement",
      exposedDescription: "The manager has been receiving undisclosed payments from the executive's holding company for years. Neither will say what for.",
      discovered: false,
    },
    {
      id: "director_executive_debt",
      parties: ["Director", "Executive"] as NPCName[],
      description: "The director has been completing productions at below-market rates for the agency to repay a personal debt to the executive.",
      surfaceClue: "director executive deal arrangement production rate",
      exposedDescription: "Gotanda has been working for the agency at a loss for years — repaying a personal debt to the executive through below-market productions. He can't afford to cross him.",
      discovered: false,
    },
    {
      id: "executive_revenue_skimming",
      parties: ["Executive"] as NPCName[],
      description: "The executive receives a percentage of three artists' revenues through a secondary holding structure that appears in no contract.",
      surfaceClue: "executive revenue percentage artists hidden structure",
      exposedDescription: "The executive has been taking an undisclosed cut of artist revenues — including Ai's — through a holding structure that appears in no contract any of them ever signed.",
      discovered: false,
    },
    {
      id: "manager_journalist_relationship",
      parties: ["Manager"] as NPCName[],
      description: "The manager has a standing relationship with a journalist who has buried two stories about the agency on request.",
      surfaceClue: "manager journalist story buried press",
      exposedDescription: "The manager has a journalist on retainer who has killed at least two damaging agency stories. The relationship goes back eight years.",
      discovered: false,
    },
    {
      id: "coidol_casting_director",
      parties: ["CoIdol"] as NPCName[],
      description: "The co-idol has been in secret talks with a casting director at a rival production house for two years.",
      surfaceClue: "coidol casting rival production contract talks",
      exposedDescription: "The co-idol has been quietly negotiating with a rival production house for two years — long before Ai's death. She was already planning her exit.",
      discovered: false,
    },
  ];
}

const scenarios: ScenarioTemplate[] = [

  // ══ MANAGER ══════════════════════════════════════════════════════════════════

  {
    id: "manager_financial_betrayal",
    killer: "Manager",
    motive: "Ai discovered the manager had been skimming a percentage of her earnings for years — quietly, methodically, in ways she couldn't have found without help. She found help. She had a lawyer. The appointment was Monday.",
    method: "He let himself in with his spare key, disabled the security camera he'd installed himself, and strangled her — staging the scene to look like a break-in gone wrong.",
    truthSummary: [
      "The financial fraud is real and documentable if anyone examines the right accounts.",
      "The fan was outside that night but arrived after — he saw nothing useful.",
      "The executive helped contain a financial story after Ai's death without knowing why containment was suddenly necessary.",
      "Ruby found a payment discrepancy in Ai's personal records and hasn't told anyone yet.",
    ],
    globalClues: [
      "The manager's phone has a deleted calendar entry for that evening.",
      "The east security camera was offline — disabled by someone who knew which one to choose.",
      "Ai had a lawyer appointment scheduled for the following Monday.",
      "A neighbour saw the manager's car parked outside Ai's house that night.",
    ],
    npcOverrides: {
      Manager: {
        secret: "I was taking from her for three years. Small percentages. Nothing that would show up easily. She found it anyway. She had a lawyer. I had one night.",
        truthsKnown: [
          "I was at the house. I used the key she didn't know I kept.",
          "I turned off the east camera. I've known that system since installation.",
          "I told myself I was going to talk to her. Reason with her. I knew I was lying to myself before I got there.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "manager_memoir_discovery",
    killer: "Manager",
    motive: "Ai had been writing a memoir. The manager accessed her laptop remotely and read it. She described thirteen years of his management as a cage. He went to reason with her. She wouldn't be reasoned with.",
    method: "He arrived during the gap in her schedule he knew by heart, got in with his key, and beat her to death with a paperweight from her own desk — the memoir still open on her laptop behind him.",
    truthSummary: [
      "The remote laptop access is logged and traceable by anyone who knows to look.",
      "The co-idol knew Ai was writing something — Ai had mentioned it — but promised not to tell.",
      "The director was near the building that night and heard raised voices he's been pretending not to have heard.",
      "Ruby knows Ai had been pulling away from people she trusted in the last two months.",
    ],
    globalClues: [
      "Ai's laptop shows a remote login two days before her death — traced to the manager's personal device.",
      "The co-idol becomes uncomfortable when asked about the last real conversation she had with Ai.",
      "The director's phone places him within two blocks of the house that evening.",
      "The manager cannot account for two hours that night and changes his story when asked twice.",
    ],
    npcOverrides: {
      Manager: {
        secret: "I read every word. Thirteen years described as a cage. I went there to make her understand what I'd given up to build her career. She said she understood perfectly. That was the problem.",
        truthsKnown: [
          "I accessed her laptop remotely two days before she died. I had to know what she'd written.",
          "She knew I'd read it when I walked in. She could tell from my face.",
          "I didn't go there to kill her. I need that to mean something. I'm not certain it does.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "manager_tokyo_dome_pressure",
    killer: "Manager",
    motive: "Ai had told him she was quitting B-Komachi after the next tour. Not after Tokyo Dome. Before it. The dream he'd built his entire life around was being cancelled and she'd already made the decision without him.",
    method: "She let him in because she always did — and he strangled her in the hallway during an argument about Tokyo Dome that she refused to lose.",
    truthSummary: [
      "Ai had drafted a formal withdrawal from B-Komachi — Ruby found the draft.",
      "The co-idol knew Ai was thinking about leaving — Ai had told her in confidence.",
      "The executive had already been notified and was managing contingency plans.",
      "The director had advised Ai that leaving was the right career move and feels guilty about that now.",
    ],
    globalClues: [
      "Ruby found a withdrawal draft in Ai's personal files dated two weeks before her death.",
      "The co-idol reacts strangely when B-Komachi's future is mentioned.",
      "The executive had legal prepare a contingency restructure before Ai's death was public.",
      "The manager was seen entering Ai's building that evening by the night security guard.",
    ],
    npcOverrides: {
      Manager: {
        secret: "Tokyo Dome was everything. Not for the money. For her. For what I promised her when she was nobody. She was going to let it go. I couldn't let her let it go.",
        truthsKnown: [
          "I knew about the withdrawal. She told me in person. I begged her.",
          "She said the dream was mine more than hers. She might have been right.",
          "I don't fully remember the end of that conversation. I remember leaving.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  // ══ CO-IDOL ══════════════════════════════════════════════════════════════════

  {
    id: "coidol_solo_contract",
    killer: "CoIdol",
    motive: "Ai had signed a solo deal and an acting contract that would end B-Komachi entirely. The co-idol found out from the director — carelessly mentioned, as he does everything. Six years of her life was going to end because Ai decided to move on without telling her.",
    method: "After forty minutes of argument, she grabbed Ai by the throat in the kitchen and didn't let go until it was over.",
    truthSummary: [
      "The solo contract was real and signed. Ai hadn't told the group yet.",
      "The director told the co-idol and has been carrying quiet guilt about that since.",
      "The manager knew and was managing the announcement timeline.",
      "The fan saw a car he recognised parked near the house that night.",
    ],
    globalClues: [
      "An unsigned copy of the solo contract was in Ai's personal files.",
      "The director will admit he 'may have mentioned' the contract to someone but refuses to say who.",
      "The fan can describe a specific car parked near the house that night in precise detail — it matches the co-idol's.",
      "The co-idol's phone shows she called Ai three times that evening before the calls stopped.",
    ],
    npcOverrides: {
      CoIdol: {
        secret: "She was leaving. She'd already signed. She hadn't told me. I found out from Gotanda over drinks and she still hadn't told me. I went there to make her say it to my face. She did. She said it very calmly. Like it wasn't my life she was ending.",
        truthsKnown: [
          "I was the last person to see Ai alive.",
          "I went there because I needed her to acknowledge what she was taking from me.",
          "She acknowledged it. She said she was sorry. She said she'd made her decision. And then something in me just — stopped.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "coidol_sabotage_discovered",
    killer: "CoIdol",
    motive: "Ai had discovered that the co-idol had been quietly sabotaging her auditions for over a year — calling casting directors, redirecting opportunities, planting doubts. She'd compiled the evidence and taken it to the executive. A formal review had been scheduled.",
    method: "When Ai refused to drop the complaint, the co-idol smashed a vase from their joint shoot over her head in the hallway.",
    truthSummary: [
      "The sabotage was systematic and documented over more than a year.",
      "The executive had received Ai's evidence and begun an internal process.",
      "The co-idol learned about the review twenty-four hours before Ai died.",
      "Ruby noticed the co-idol watching Ai differently at the last public appearance.",
    ],
    globalClues: [
      "An email chain shows Ai forwarding evidence to the executive three days before her death.",
      "The executive confirms a review was in process but says it was 'paused pending circumstances'.",
      "The co-idol cannot account for ninety minutes on the night in question.",
      "Ruby noticed the co-idol's shoes were muddy the next morning — Ai's front path is unpaved.",
    ],
    npcOverrides: {
      CoIdol: {
        secret: "I spent a year making small calls. Small suggestions. Telling people she wasn't ready for certain things. It felt like self-preservation at the time. She found all of it. Every call. She kept records. She always kept records.",
        truthsKnown: [
          "I knew about the complaint. I had twenty-four hours before it became official.",
          "I went to the house to ask her to let me keep my career. Just my career.",
          "She said no. She said she was done protecting me from myself. She'd been protecting me for a year without telling me.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "coidol_breaking_point",
    killer: "CoIdol",
    motive: "Ai had been offered — and accepted — a role that the co-idol had auditioned for and been passed over on. The same week, a journalist published a profile of Ai that described the co-idol as 'the group's quiet backbone' — industry language for invisible. Something broke.",
    method: "Drunk and beyond control, she beat Ai with a kitchen object during a screaming fight that started at the front door and ended on the kitchen floor.",
    truthSummary: [
      "The casting decision was real — the co-idol had auditioned and was in serious consideration before Ai was approached.",
      "The article was published three days before Ai died — the co-idol kept a copy.",
      "The manager knew the co-idol had auditioned for the role and had not told her Ai was being approached for it.",
      "The director cast Ai. He knew both women had wanted the role.",
    ],
    globalClues: [
      "The co-idol has a copy of the published article with annotations in the margins.",
      "The manager made calls about the casting without looping in the co-idol.",
      "The director confirms both women were considered and that the decision was made above his level.",
      "A convenience store camera two streets away caught the co-idol buying alcohol at 9pm — Ai died around 11pm.",
    ],
    npcOverrides: {
      CoIdol: {
        secret: "I'd auditioned for that role for three months. I was good. They told me I was good. Then Ai was offered it and nobody called me. I found out from the article like everyone else. I went to her house to say that out loud to her face. I wasn't going to hurt her. I just needed her to hear it.",
        truthsKnown: [
          "I went to the house. I wasn't sober. I wasn't planning anything.",
          "Ai opened the door and she looked so — unsurprised. Like she'd been expecting me. That made it worse.",
          "I don't know at what point it became what it became.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  // ══ DIRECTOR ═════════════════════════════════════════════════════════════════

  {
    id: "director_trainee_witness",
    killer: "Director",
    motive: "Ai had witnessed the director in a situation with a younger trainee that he could not explain and could not survive publicly. She'd given him three days to come forward himself. He spent those three days making other plans.",
    method: "He came through the service entrance using a fake name, stabbed her once in the hallway, and staged the scene — but staged it too cleanly, which is what gave him away.",
    truthSummary: [
      "The trainee exists, is alive, and has not spoken to anyone official because they're terrified.",
      "The manager received an unexplained payment from an agency account six weeks ago — doesn't know what it was for.",
      "The executive arranged the payment. He believes it closed the matter. He's wrong.",
      "The fan overheard a phone call he understood maybe fifteen percent of. That fifteen percent is significant.",
    ],
    globalClues: [
      "A cash transfer from an agency account to the manager occurred six weeks before Ai's death.",
      "Building access logs show an alias that nobody has explained entering the property that week.",
      "The fan has been almost saying something for days. He keeps stopping himself.",
      "The alias on the access log was used three times before — all on production days the director ran.",
    ],
    npcOverrides: {
      Director: {
        secret: "She gave me three days to come forward. She said she'd wait. She said she believed people could do the right thing if you gave them the chance. I used those three days to make sure there was no one left to come forward to.",
        truthsKnown: [
          "I've maintained a secondary alias for building access for years. No one knew.",
          "Ai was going to destroy something I'd spent thirty years building. I told myself it was complicated. It wasn't complicated.",
          "The fan was in the area. I made sure of certain things before I went.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "director_production_files",
    killer: "Director",
    motive: "Ai had production files proving the director had fraudulently credited himself on multiple significant works. She'd been sitting on it for two years. Then she told him she was writing a book. She'd been saving it for the book.",
    method: "He broke in to steal the files, she came home early and caught him, and he strangled her with the power cable from her own monitor.",
    truthSummary: [
      "The files existed. They're gone. But Ai made secondary copies the director doesn't know about.",
      "The co-idol knew Ai had 'something' she'd been holding — Ai had mentioned it without details.",
      "The fan saw lights on in the apartment earlier than Ai would normally have been home.",
      "Ruby remembers Ai mentioning 'having things put away safely' — she'd thought it was a joke.",
    ],
    globalClues: [
      "Ai's filing cabinet was disturbed — items removed, order wrong.",
      "The fan noted the apartment lights were on unusually early that evening.",
      "Ruby remembers Ai saying something about 'insurance' months before she died.",
      "A production assistant saw the director's car outside Ai's building that afternoon.",
    ],
    npcOverrides: {
      Director: {
        secret: "I went for the files. Only the files. She came home ninety minutes earlier than she should have and she walked in and she wasn't afraid. She just looked at me like she was tired. And something in me couldn't stand the way she looked at me.",
        truthsKnown: [
          "I searched her apartment. I found the files. I took them.",
          "She came home. She saw me. She wasn't surprised.",
          "I've told myself I didn't plan it. That's the version I'm going with.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "director_aqua_protection",
    killer: "Director",
    motive: "Ai had discovered something about Aqua's past — something connected to the circumstances of his birth — and was going to go public with it. The director believed it would destroy Aqua. He made a decision Aqua will never know he made.",
    method: "She trusted him enough to turn her back during the conversation — he used that moment, and used his hands, and was gone before she hit the floor.",
    truthSummary: [
      "The information about Aqua's past was real and Ai had verified it.",
      "The journalist contact exists — Ruby found an email thread that has since been deleted.",
      "The manager knew Ai had been investigating something about her children's origins and had urged her not to pursue it.",
      "The executive had been informed and had his own reasons to want the story buried.",
    ],
    globalClues: [
      "A deleted email thread on Ai's device points to a journalist contact.",
      "The manager reacts with disproportionate fear when Aqua's origins are mentioned.",
      "The executive had legal on standby before the death became public — too early for a normal response.",
      "The director cancelled all his meetings the day after Ai's death and turned his phone off for six hours.",
    ],
    npcOverrides: {
      Director: {
        secret: "Aqua doesn't know what I did. He can't know. I made a choice and I made it for him and if he ever finds out he'll spend the rest of his life trying to decide if I was right. I decided for him. I'd do it again.",
        truthsKnown: [
          "Ai had the information. It was accurate. She had a journalist and a date.",
          "I went to ask her to stop. She said she owed it to Aqua to tell him the truth.",
          "She wasn't wrong. I acted anyway.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  // ══ FAN ══════════════════════════════════════════════════════════════════════

  {
    id: "fan_online_radicalisation",
    killer: "Fan",
    motive: "Someone spent eight months building him up online — feeding him the story that the industry was destroying Ai, that she was being exploited and suppressed, that a real fan would do something real. He believed them. He doesn't know who they were.",
    method: "He waited outside her house at the time he knew she'd return alone, and stabbed her at the front door before she could close it.",
    truthSummary: [
      "The anonymous account that radicalised him is gone now but the messages on his phone survive.",
      "The manager had a security escalation report about the fan filed six weeks ago — he didn't act on it.",
      "Ruby counted at least four public events in the final month where she saw him in the crowd, closer than he should have been.",
      "The fan is a killer and also a victim of deliberate manipulation. Both are true.",
    ],
    globalClues: [
      "The fan's phone contains eight months of messages with an account that no longer exists.",
      "A security report dated six weeks before Ai's death is in the manager's files.",
      "Ruby can place the fan at four events in Ai's final month with unusual proximity.",
      "CCTV shows the fan walking toward Ai's street at 10:47pm the night she died.",
    ],
    npcOverrides: {
      Fan: {
        secret: "Someone built me into this and I didn't see it happening. I thought I was finally seeing clearly. I thought loving her meant doing something. I still don't know who they were. That's the thing I can't stop thinking about.",
        truthsKnown: [
          "I did it. I went there and I did it.",
          "Someone told me I'd be saving her. I needed to believe that.",
          "I still don't know who they were. I think about that every hour.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "fan_fabricated_message",
    killer: "Fan",
    motive: "He received a screenshot of Ai mocking him to a friend — dismissive, cruel, specific. He read it two hundred times. It never occurred to him to question whether it was real.",
    method: "He showed up at 11pm with the screenshot on his phone, she denied writing it, and he stabbed her in the doorway — the printout still in his jacket when police found him.",
    truthSummary: [
      "The screenshot was fabricated — manufactured and sent to him deliberately by someone who needed a scapegoat.",
      "The director has the technical knowledge and an existing reason to want chaos around Ai.",
      "Ruby found Ai's private message archive. The conversation in the screenshot doesn't exist in it.",
      "The fan is a weapon someone else built and aimed. He also pulled the trigger.",
    ],
    globalClues: [
      "Ruby has Ai's private message archive — the screenshot conversation isn't in it anywhere.",
      "The director has graphic editing software and a history of document alteration.",
      "The fan can describe the screenshot in exact detail — specific enough to trace if anyone knows where to look.",
      "The fan's fingerprints were found on the front door handle — he was there.",
    ],
    npcOverrides: {
      Fan: {
        secret: "I saw what she wrote about me. I can still recite it word for word. Ruby says it doesn't exist. I don't know what to do with that. I did something real because of something that wasn't real. I don't know what I am now.",
        truthsKnown: [
          "I went to the house because the message broke something in me.",
          "She didn't know what I was talking about. She kept saying she didn't know.",
          "If it was fake someone used me. And I still did it. Both of those things are true.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "fan_delusion_escalation",
    killer: "Fan",
    motive: "His obsession had been building for years into something that had its own logic — a private story in which Ai needed him, in which his love was special and reciprocal, in which the distance between them was just circumstance. He went to close the distance.",
    method: "She answered the door without fear because she recognised him from fan events — and he stabbed her before either of them understood what he was doing.",
    truthSummary: [
      "He had been to the street outside the house at least four times in the month before Ai died.",
      "The manager had received two separate security flags about the fan and had not escalated either.",
      "The executive was aware of the fan as a risk factor and had documentation the manager was never shown.",
      "Ruby had seen him at events and had mentioned him to Ai, who had asked her not to make it a thing.",
    ],
    globalClues: [
      "Security footage places the fan on the street outside Ai's house on four separate dates.",
      "The manager received security flags that he filed without escalating.",
      "Ruby remembers mentioning the fan to Ai and Ai's reaction was strange — almost resigned.",
      "The fan was found two blocks away an hour after the estimated time of death, visibly distressed.",
    ],
    npcOverrides: {
      Fan: {
        secret: "I had a story in my head about us. It made sense inside my head. Everything I did made sense inside that story. I know now that the story wasn't real. I knew on some level then. I went anyway.",
        truthsKnown: [
          "I had been to her street before. Four times. I always left.",
          "That night I told myself it would be different. That if I could just talk to her it would be real.",
          "She opened the door and she was afraid of me. That was the first moment the story stopped making sense.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "fan_father_informant",
    killer: "Fan",
    motive: "The fan had always known Ai as a performer — untouchable, distant, a dream. Then a man contacted him claiming to be the biological father of Ai's children, furious that Ai had hidden them and built a public image of purity on top of it. He gave the fan an address. He said Ai had been lying to everyone who loved her. The fan had built his entire emotional life on that love. The lie shattered it.",
    method: "He went to the address the father gave him. He brought a knife — not because he planned to use it, he would tell you, but because the city is dangerous at night and he always carries one. Ai opened the door. He showed her a photo the father had sent — Ai with two small children, clearly hers, clearly hidden. She didn't deny it. She asked him to come inside and talk. He didn't go inside. What happened in the doorway took less than thirty seconds. He was on the train home before anyone called an emergency number.",
    truthSummary: [
      "A man identifying himself as the biological father of Ai's children gave the fan her home address and photographic evidence of the children.",
      "The father's motive was to expose Ai's hidden life — the children represent a secret she'd maintained throughout her career.",
      "The fan is the killer but is also a tool. The father knew exactly what he was putting in motion.",
      "Ruby knows Ai had children she kept private. She is one of them. This fact is not yet known to the fan.",
    ],
    globalClues: [
      "The fan received a message from an unregistered number six days before Ai died — the message contained an address and a photo.",
      "The father exists and is findable. He has not come forward. He is somewhere in the industry.",
      "Ruby found a photo in Ai's things — a man she doesn't recognise, a note on the back that says 'he knows'.",
      "The fan was found near the scene with a knife — he didn't resist arrest and kept saying 'she lied to everyone'.",
    ],
    npcOverrides: {
      Fan: {
        secret: "A man told me she was lying. He showed me proof. He gave me her address. I didn't ask his name. I didn't ask how he knew. I just needed to see her face when I showed her the photo. I needed her to explain it. She didn't explain it. She just looked at me like she'd been waiting for this moment. Like she was tired.",
        truthsKnown: [
          "A man contacted me. He said he was the father of her children. He gave me a photo and an address.",
          "I went to the address. It was real. She answered the door.",
          "I don't know who he was. I don't know why he chose me. I think about that.",
        ],
      },
      Manager: {
        secret: "I knew about the children. I've always known. I helped her keep it hidden because that was my job and because she asked me to. The father — I met him once, years ago. I told him to stay away. I don't know if he listened.",
        truthsKnown: [
          "Ai had children she kept private. I was one of the people who helped manage that secret.",
          "The father contacted me years ago. I told him the arrangement was none of his business.",
          "I don't know if he's involved in what happened. I'm afraid to find out.",
        ],
      },
      Executive: {
        secret: "I've known about the children for four years. It was a managed risk — contained, documented, professionally handled. The father was paid to stay silent. Apparently the payment didn't hold.",
        truthsKnown: [
          "The agency knew about Ai's children. We managed the information.",
          "The father received a settlement. He signed documents. Those documents apparently mean nothing.",
          "If the father's involvement surfaces, it surfaces everything. Including what the agency knew and when.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  // ══ EXECUTIVE ════════════════════════════════════════════════════════════════

  {
    id: "executive_whistleblower",
    killer: "Executive",
    motive: "Ai had spent months building a file — names, dates, locations, evidence of systematic exploitation of trainees at agency-affiliated events. She had a journalist and a publication date. He had a week.",
    method: "He hired someone to kill her and make it look like the fan did it — he was in Osaka with forty witnesses when it happened.",
    truthSummary: [
      "The file Ai was building was real. Parts of it still exist — Ruby found a handwritten list.",
      "The manager had been kept comfortable and incurious. He didn't know what his silence was covering.",
      "The director has attended events connected to what Ai was investigating. His fear when the executive's name comes up is specific.",
      "The executive had legal counsel briefed before the police were called — an impossible timeline if he'd learned of the death normally.",
    ],
    globalClues: [
      "A burner phone was found near the scene. One unregistered number saved.",
      "The director's reaction when the executive is mentioned is disproportionate and specific.",
      "Ruby has a handwritten list from Ai's things — names, dates, no explanation.",
      "The executive's security contractor visited the area twice in the week before Ai's death.",
    ],
    npcOverrides: {
      Executive: {
        secret: "She had everything. I had a week. I've made hard decisions before. This was a harder one. I made it.",
        truthsKnown: [
          "I knew exactly what she had collected and when she planned to release it.",
          "I had been monitoring the fan for months before this. I knew he was out there.",
          "I chose the agency. I would make the same choice again. That's the part I don't say.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "executive_defection_clause",
    killer: "Executive",
    motive: "Ai had signed a defection contract with a rival agency. The terms included a clause allowing three other B-Komachi members to follow her within sixty days. The agency would not survive losing four artists simultaneously.",
    method: "He spent six weeks engineering the fan as a scapegoat, then paid a contractor to kill her — his alibi was airtight because he'd built it in advance.",
    truthSummary: [
      "The defection contract was countersigned — Ruby found a copy in Ai's things.",
      "The manager knew and was devastated. His grief is real. His complicity in other things is also real.",
      "The fan had been under agency surveillance for six weeks. He doesn't know this.",
      "The executive had a communications strategy drafted before the police were called.",
    ],
    globalClues: [
      "A surveillance log on the fan predates Ai's death by six weeks — agency contractors hired by the executive.",
      "Ruby found an unfamiliar agency letterhead in Ai's files — a contract draft.",
      "The executive had counsel briefed and a communications strategy drafted before police arrived.",
      "The executive's PA sent an encrypted message at 10:52pm — twelve minutes before Ai's body was found.",
    ],
    npcOverrides: {
      Executive: {
        secret: "Losing four artists ends the agency. I built this agency. I wasn't going to watch it end because Ai Hoshino decided she was done.",
        truthsKnown: [
          "I had the fan watched for six weeks. I needed the shape of a story before I needed the story.",
          "The defection clause would have taken four artists. I did the arithmetic.",
          "I'm not ashamed of protecting what I built. I'm something. I haven't named it yet.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },

  {
    id: "executive_past_crime_exposure",
    killer: "Executive",
    motive: "Ai had uncovered documentation of a financial crime from fifteen years ago — before he joined the agency, before everything. She wasn't going to go to the police. She was going to give it to Aqua. She thought Aqua had a right to know because it connected to his father.",
    method: "He arranged a private meeting at her home, brought a man from his security firm, and left after twenty minutes — the second man followed four minutes later.",
    truthSummary: [
      "The documentation Ai found was real and connected to Aqua's origins in ways the executive cannot afford to have examined.",
      "The director knew about the historical crime — was peripherally connected to it — and has been terrified since Ai died.",
      "The manager had no idea any of this existed.",
      "Ruby found a reference in Ai's notes to 'something for Aqua' that she hasn't decoded yet.",
    ],
    globalClues: [
      "Ai's notes reference 'something for Aqua' — Ruby found it and doesn't understand it yet.",
      "The director's fear when the executive's name comes up is not general — it's specific to something old.",
      "The executive's background has a gap of eight months fifteen years ago that appears on no official record.",
      "The executive requested a private meeting with Ai three days before she died — no one else was invited.",
    ],
    npcOverrides: {
      Executive: {
        secret: "What she found connected things that have been carefully separated for fifteen years. I am not going to let Aqua find out what his father was by reading about it in a dead woman's notes.",
        truthsKnown: [
          "Ai found documentation of something from fifteen years ago.",
          "She was going to give it to Aqua. She thought he deserved to know.",
          "I thought about whether she was right. I decided it didn't matter.",
        ],
      },
    },
    sideDeals: buildSideDeals(),
  },
];

// ─── GOSSIP POOL BUILDER ─────────────────────────────────────────────────────
// Generates a pre-determined pool of gossip from scenario data.
// All entries are killer-specific because they come from globalClues + truthSummary.
// Released one per turn so the player gets reliable breadcrumbs throughout the game.

function buildGossipPool(scenario: ScenarioTemplate): GossipEntry[] {
  const sources = [
    "fan site", "industry contact", "rival agency",
    "stylist network", "B-Komachi staff", "venue security",
    "entertainment blog", "Ruby overheard",
  ] as const;

  const pool: GossipEntry[] = [
    // Turn 0 — atmosphere entries, always present
    {
      turn: 0,
      text: "Fan forums are in chaos. Ai Hoshino found dead at her home. No official cause of death released.",
      source: "fan site",
      relatedTo: null,
    },
    {
      turn: 0,
      text: "Industry sources say the agency had legal counsel briefed before police were notified. Nobody is explaining the timeline.",
      source: "industry contact",
      relatedTo: "Executive",
    },
    // Global clues rephrased as leaks — all point at the killer
    ...scenario.globalClues.map((clue, i) => ({
      turn: -1, // -1 = queued, released progressively during gameplay
      text: rephrasedAsGossip(clue, scenario.killer, i),
      source: sources[(i + 2) % sources.length],
      relatedTo: scenario.killer as NPCName,
    })),
    // Truth summary entries — deeper context that surfaces later
    ...scenario.truthSummary.map((truth, i) => ({
      turn: -1,
      text: rephrasedAsTruthLeak(truth, i),
      source: sources[(i + 4) % sources.length],
      relatedTo: scenario.killer as NPCName,
    })),
  ];

  return pool;
}

// Rephrase a direct clue as something overheard or leaked
function rephrasedAsGossip(clue: string, killer: SuspectName, index: number): string {
  const prefixes = [
    `Word reaching rival agencies: `,
    `A source close to the investigation says `,
    `Circulating in industry group chats: `,
    `A B-Komachi staff member mentioned off the record that `,
    `Fan investigators online have noted that `,
  ];
  return prefixes[index % prefixes.length] + clue.charAt(0).toLowerCase() + clue.slice(1);
}

// Rephrase a truth summary as an indirect industry leak
function rephrasedAsTruthLeak(truth: string, index: number): string {
  const prefixes = [
    `Someone close to Ai told a mutual contact that `,
    `Industry insiders are quietly saying that `,
    `Ruby overheard something at the agency: `,
    `A stylist who worked with B-Komachi says `,
  ];
  return prefixes[index % prefixes.length] + truth.charAt(0).toLowerCase() + truth.slice(1);
}

// ─── WORLD BUILDER ────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function createNewGame(): WorldState {
  const selected = pick(scenarios);
  const killer = selected.killer;
  const suspectNames: SuspectName[] = ["Manager", "CoIdol", "Director", "Fan", "Executive"];

  const npcs = deepClone(FIXED_NPCS) as Record<NPCName, NPCState>;

  // Initialise fields that were Omitted from FIXED_NPCS
  const allNPCNames: NPCName[] = ["Manager", "CoIdol", "Director", "Fan", "Executive", "Ruby"];
  for (const name of allNPCNames) {
    npcs[name].sentMessages = [];
    npcs[name].warnedAboutAqua = false;
    npcs[name].exposedDeals = [];
  }

  // Assign secrets and truthsKnown based on role this run
  for (const name of suspectNames) {
    if (name === killer) {
      const override = selected.npcOverrides[name];
      if (override) {
        npcs[name].secret = override.secret ?? npcs[name].secret;
        npcs[name].truthsKnown = override.truthsKnown ?? [];
      }
    } else {
      const cover = pick(innocentCovers[name]);
      npcs[name].secret = cover.secret;
      npcs[name].truthsKnown = cover.truthsKnown;
    }
  }

  // Ruby has no secret or truthsKnown — she's Aqua's ally, not a suspect

  // Slightly randomise starting trust/suspicion so each run feels fresh
  for (const name of suspectNames) {
    npcs[name].trustPlayer = Math.min(0.95, Math.max(0.1,
      (FIXED_NPCS[name].trustPlayer as number) + (Math.random() * 0.2 - 0.1)
    ));
    npcs[name].suspicionPlayer = Math.min(0.9, Math.max(0,
      (FIXED_NPCS[name].suspicionPlayer as number) + (Math.random() * 0.1 - 0.05)
    ));
  }

  return {
    victim: "Ai",
    playableCharacter: "Aqua",
    turn: 0,
    tension: 0,
    accusationUnlocked: false,
    gameOver: false,
    winner: false,
    selectedScenarioId: selected.id,
    killer: selected.killer,
    motive: selected.motive,
    method: selected.method,
    truthSummary: selected.truthSummary,
    globalClues: selected.globalClues,
    cluesDiscovered: [],
    contradictionsFound: [],
    confirmedTruths: [],
    investigationLog: [
      "Ai has been found dead at the front of the house.",
      "Aqua begins the investigation.",
    ],
    elicitationLog: [],
    powerDynamics: buildPowerDynamics(selected.killer),
    gossipFeed: buildGossipPool(selected),
    aquaMood: "focused",
    aquaReputation: "Unknown — nobody has spoken to Aqua yet.",
    sideDeals: selected.sideDeals ?? buildSideDeals(),
    activeDeals: [],
    questionedOrder: [],
    npcs,
  };

}
