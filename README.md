# AI☆no☆Ko — A retro AI murder mystery investigation game built with Next.js for Melbourne Hackiethon 2026 (Theme: Integrate AI into a Game).

> *In a world built entirely on lies and constructed identities — AI fits in perfectly.*

🔗 **[Play it live → ai-no-ko-game.vercel.app](https://ai-no-ko-game.vercel.app/)**

A murder mystery investigation game set in the world of [Oshi no Ko](https://en.wikipedia.org/wiki/Oshi_no_Ko) where idols, directors, and managers are all playing a role, relationships run on power and hidden motives, and nothing is ever quite what it seems. Sounds like LinkedIn.

**Ai Hoshino has been murdered.** You play as Aqua, her son, working your way through a web of suspects to find out and kill who did it.
 
---

## How the LLM Works

The game uses Groq's `llama-3.1-8b-instant` with structured prompt engineering to enforce strict JSON schema responses.

After each message, the game sends the model:
- The NPC's full character profile (personality, secrets, beliefs, power dynamics)
- The player's message and current world state (tension, trust, suspicion, memories)
- Recent conversation history and rumours the NPC has heard
- Scene clues and confirmed truths from completed deals

The model returns structured responses for:
- **NPC dialogue** — free text reply, kept deeply in character
- **Extraction manifest** — trust/suspicion deltas, discovered clues, contradiction flags, memory summary, rumour to spread, backchannel target
- **Ruby interjection** — whether a contradiction was detected and Ruby's one-sentence callout
- **Deal completion judgment** — whether the player's report genuinely fulfilled the deal task

Every NPC runs the same pipeline but with entirely different context: the killer receives a murder secret that shapes what they avoid saying, while innocent NPCs receive unrelated personal secrets that make them evasive for different reasons.

## Features

### Randomised Scenarios
Every game is different. On start, `createNewGame()` picks one of **16 scenarios** — each with a different killer, motive, method, and set of clues. The killer gets their murder secret; every other suspect gets a randomly picked innocent cover red herring. The same NPC might be the killer in one run and completely innocent in the next.

### Real AI Conversations
Each NPC is driven by a language model with prompting of a full character profile: personality, beliefs, fears, power dynamics, and a secret. The prompt system keeps them deeply in character across multiple turns, responding differently based on your tone, what you know, and how much they trust you.

### Memory & Gossip
NPCs remember your previous conversations. Come back with a different angle and they'll already know what you've been up to. NPCs also **walk around the map independently** and interact with each other. When two NPCs get close, they may stop, huddle together, and exchange information, spreading rumours organically through the world where you'll see a popup.

### Ruby — Your AI Agent
Ruby is Aqua's sister and your investigation partner. Whenever an NPC says something that contradicts a known clue, she butts in and calls it out — using natural language reasoning to match NPC replies against your verified facts. She's a bit brash, so she'll sometimes interject anyway. Very on brand.

### The Deal System
Information is currency. Ask an NPC for a deal and they'll propose a trade: they want something from you first. Go talk to someone else, dig up what they need, and come back. A second LLM call then judges whether what you've returned with is actually relevant. Complete a deal and they'll reveal something that moves the investigation forward.

### The Notebook
Press `N` to open your investigation notes — scene clues, the method of murder, active and completed deals, confirmed truths earned through deals, and a relationship map showing the power dynamics between suspects. The notes builds up gradually as you uncover connections.

### Tension System
As the investigation heats up, tension rises where contradictions found, meaningful clues surfaced, and the passage of time all contribute. At high tension, NPCs become noticeably more guarded: shorter answers, deflecting questions, treating anything suspicious like a trap. The music also shifts from a calm idol track into a more dramatic score as pressure builds. You must decide on a suspect to kill before the system turns against you.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **LLM Provider:** [Groq](https://groq.com/) — `llama-3.1-8b-instant`
- **State:** No database — the entire game state is a JSON object passed back and forth on every turn
- **Styling:** Inline styles + CSS-in-JSX

---

## Getting Started On Own Device
```bash
npm install
```

Create a `.env.local` file:
```
GROQ_API_KEY=your_key_here
```
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Controls

| Key | Action |
|-----|--------|
| `WASD` / Arrow keys | Move |
| `E` | Talk to nearby NPC |
| `N` | Open / close notebook |
| `ESC` | Close dialog / notebook |
| `♪ ON/OFF` | Toggle music |

---

## Project Structure
```
src/
├── app/
│   ├── page.tsx          # Full frontend — game loop, rendering, audio
│   └── api/
│       ├── chat/route.ts # Main API — NPC responses, extraction, Ruby, deals
│       └── game/route.ts # New game initialisation
└── lib/
    ├── prompts.ts        # All LLM prompt builders
    ├── scenarios.ts      # 16 scenarios, NPC definitions, world builder
    ├── gameEngine.ts     # World state updates, memory, gossip, tension
    └── types.ts          # TypeScript interfaces
```

---
## Credits

### Music
- **Idol (Lo-fi Ver.)** — [YouTube](https://youtu.be/fB21NXYbv8s?si=ZxWrz-4zhsQ3jYHU)
- **Idol (Emotional & Dramatic Ver.)** — [YouTube](https://youtu.be/gRo6ZsK9dLA?si=JHKXUbtksjiVzVxL)

*No copyright infringement intended. All music belongs to their respective creators.*

---

## Inspiration

Based on the anime [Oshi no Ko](https://en.wikipedia.org/wiki/Oshi_no_Ko) by Aka Akasaka. All characters are original interpretations for game purposes.
