import { NPCName, NPCState, ScenarioTemplate, SuspectName, WorldState } from "./types";

const baseNPCs: Record<NPCName, NPCState> = {
  Manager: {
    name: "Manager",
    role: "Ai's manager",
    personality: "careful, protective, politically aware",
    publicFace: "professional and calm",
    secret: "hiding industry secrets around Ai's schedule",
    truthsKnown: ["Ai was under mounting pressure around her public image."],
    beliefs: {
      CoIdol: "emotionally unstable under pressure",
      Director: "knows more than he says",
      Fan: "too obvious to trust at face value",
      Executive: "always protecting the agency first",
      Ruby: "honest, but only sees part of the picture",
    },
    trustPlayer: 0.55,
    suspicionPlayer: 0.15,
    mood: "calm",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
  },

  CoIdol: {
    name: "CoIdol",
    role: "Ai's co-idol and professional rival",
    personality: "emotional, image-conscious, defensive",
    publicFace: "heartbroken but composed for the cameras",
    secret: "resented how the spotlight always returned to Ai",
    truthsKnown: ["Ai had conflict inside the group before her death."],
    beliefs: {
      Manager: "too controlled to be innocent",
      Director: "used Ai for his own career",
      Fan: "dangerous, but maybe being used",
      Executive: "would sacrifice anyone for the brand",
      Ruby: "grieving honestly",
    },
    trustPlayer: 0.48,
    suspicionPlayer: 0.2,
    mood: "nervous",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
  },

  Director: {
    name: "Director",
    role: "director who worked with Ai in the past",
    personality: "smooth, strategic, evasive",
    publicFace: "cooperative and polished",
    secret: "worried old secrets tied to Ai could resurface",
    truthsKnown: ["Ai had unresolved conflict connected to her past work."],
    beliefs: {
      Manager: "protective to the point of suspicion",
      CoIdol: "easily pushed by jealousy",
      Fan: "either a tool or a fool",
      Executive: "always calculating fallout",
      Ruby: "honest but emotionally exposed",
    },
    trustPlayer: 0.45,
    suspicionPlayer: 0.25,
    mood: "guarded",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
  },

  Fan: {
    name: "Fan",
    role: "obsessive fan and unstable outsider suspect",
    personality: "intense, erratic, defensive",
    publicFace: "frightened and hard to read",
    secret: "was close to the house and may have been manipulated by someone else",
    truthsKnown: ["Saw someone connected to Ai shortly before the murder."],
    beliefs: {
      Manager: "controls everything",
      CoIdol: "smiles too perfectly",
      Director: "pretends to care",
      Executive: "powerful enough to bury anything",
      Ruby: "not part of the cover-up",
    },
    trustPlayer: 0.3,
    suspicionPlayer: 0.35,
    mood: "nervous",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
  },

  Executive: {
    name: "Executive",
    role: "senior agency executive",
    personality: "cold, measured, reputation-driven",
    publicFace: "sympathetic and authoritative",
    secret: "more concerned with scandal control than grief",
    truthsKnown: ["Ai's death could trigger catastrophic fallout for the agency."],
    beliefs: {
      Manager: "too emotionally compromised",
      CoIdol: "unstable under pressure",
      Director: "a liability with old baggage",
      Fan: "convenient, but maybe too convenient",
      Ruby: "genuinely searching for truth",
    },
    trustPlayer: 0.4,
    suspicionPlayer: 0.22,
    mood: "guarded",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: true,
  },

  Ruby: {
    name: "Ruby",
    role: "Aqua's sister and ally who helps organize the investigation",
    personality: "honest, emotionally intelligent, supportive",
    publicFace: "grieving but direct",
    secret: "she has no hidden agenda and is not the killer",
    truthsKnown: ["Ai had been under emotional strain, but Ruby does not know the killer."],
    beliefs: {
      Manager: "hiding something important",
      CoIdol: "hurt in ways she won't admit",
      Director: "dangerously smooth",
      Fan: "possibly manipulated",
      Executive: "cares more about image than truth",
    },
    trustPlayer: 0.95,
    suspicionPlayer: 0,
    mood: "helpful",
    memories: [],
    rumorsHeard: [],
    revealedClues: [],
    isKillerCandidate: false,
  },
};

const scenarios: ScenarioTemplate[] = [
  {
    id: "manager_coverup",
    killer: "Manager",
    motive: "Ai was about to reveal a secret that would destroy the manager's control and expose agency lies.",
    method: "A staged front-door killing after a private confrontation.",
    truthSummary: [
      "The manager arranged the confrontation.",
      "The fan was nearby but is not the true killer.",
      "Ruby sensed tension earlier in the evening but does not know the killer.",
      "The executive is covering up scandal, not the murder itself.",
    ],
    globalClues: [
      "The manager's timeline does not match later testimony.",
      "The fan saw someone calm, not panicked, leaving the scene.",
      "Ai expected a confrontation that night.",
    ],
    npcOverrides: {
      Manager: {
        secret: "Killed Ai to preserve control and silence a revelation.",
        truthsKnown: [
          "I confronted Ai before her death.",
          "I know exactly how the timeline unfolded.",
        ],
      },
    },
  },

  {
    id: "coidol_jealousy",
    killer: "CoIdol",
    motive: "Years of resentment, pressure, and jealousy finally exploded into violence.",
    method: "A personal confrontation that spiraled out of control at the front of the house.",
    truthSummary: [
      "The co-idol met Ai privately that night.",
      "The manager is hiding unrelated industry secrets.",
      "Ruby noticed signs of emotional fracture inside the group.",
      "The fan becomes an easy scapegoat once panic spreads.",
    ],
    globalClues: [
      "The co-idol's grief sounds rehearsed in places.",
      "Someone in the group knew Ai would be alone.",
      "The emotional motive is real, but not sufficient on its own.",
    ],
    npcOverrides: {
      CoIdol: {
        secret: "Killed Ai in a burst of buried resentment and panic.",
        truthsKnown: [
          "I met Ai that night.",
          "I cannot let Aqua understand why.",
        ],
      },
    },
  },

  {
    id: "director_scandal",
    killer: "Director",
    motive: "Ai had information that could expose the director's exploitative actions and ruin his career.",
    method: "A confrontation disguised to implicate a more obvious suspect.",
    truthSummary: [
      "The director had a hidden meeting with Ai.",
      "The manager is covering up industry damage, not the murder.",
      "Ruby overheard fragments of old conflict resurfacing.",
      "The fan saw something connected to Ai's professional circle.",
    ],
    globalClues: [
      "The director lies about never visiting the house.",
      "A production-related detail links him to the scene.",
      "Someone with old access re-entered Ai's orbit.",
    ],
    npcOverrides: {
      Director: {
        secret: "Killed Ai to stop a scandal from destroying him.",
        truthsKnown: [
          "I met Ai privately that night.",
          "I need someone else blamed.",
        ],
      },
    },
  },

  {
    id: "fan_manipulated",
    killer: "Fan",
    motive: "The fan was manipulated and psychologically pushed into committing the murder.",
    method: "A direct killing driven by obsession, panic, and external manipulation.",
    truthSummary: [
      "The fan committed the murder.",
      "Someone else primed the fan emotionally and directed suspicion.",
      "Ruby can identify what is known versus guessed.",
      "The executive and manager both care more about narrative control once the case breaks.",
    ],
    globalClues: [
      "The fan's story keeps breaking under pressure.",
      "The fan knew details that should have been impossible.",
      "The killer may also be a victim of manipulation.",
    ],
    npcOverrides: {
      Fan: {
        secret: "Killed Ai, but was manipulated into it by someone who fed obsession and access.",
        truthsKnown: [
          "I was there.",
          "Someone made me believe I had to do it.",
        ],
      },
    },
  },

  {
    id: "executive_cleanup",
    killer: "Executive",
    motive: "The executive believed Ai had become a catastrophic threat to the agency's future.",
    method: "A calculated killing followed by immediate narrative control.",
    truthSummary: [
      "The executive acted to protect the agency.",
      "The manager is terrified but not the killer.",
      "Ruby knows only fragments and never claims certainty she doesn't have.",
      "The fan is suspicious but not necessarily the murderer in this run.",
    ],
    globalClues: [
      "The executive frames every answer around damage control.",
      "Someone powerful moved too fast after the death.",
      "Narrative control began almost immediately.",
    ],
    npcOverrides: {
      Executive: {
        secret: "Killed Ai to preserve the agency and control the fallout.",
        truthsKnown: [
          "I acted before the scandal could erupt.",
          "I can still shape what everyone believes happened.",
        ],
      },
    },
  },
];

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function createNewGame(): WorldState {
  const selected = scenarios[Math.floor(Math.random() * scenarios.length)];
  const npcs = deepClone(baseNPCs);

  for (const [name, overrides] of Object.entries(selected.npcOverrides)) {
    Object.assign(npcs[name as NPCName], overrides);
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
    investigationLog: [
      "Ai has been found dead at the front of the house.",
      "Aqua begins the investigation.",
    ],

    npcs,
  };
}