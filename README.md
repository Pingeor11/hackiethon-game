# ✦ OSHI NO KO — AI Murder Mystery Investigation

> *In a world built entirely on lies and constructed identities — AI fits in perfectly.*

🔗 **[Play it live → ai-no-ko-game.vercel.app](https://ai-no-ko-game.vercel.app/)**

A murder mystery investigation game set in the world of [Oshi no Ko](https://en.wikipedia.org/wiki/Oshi_no_Ko) — where idols, directors, and managers are all playing a role, relationships run on power and hidden motives, and nothing is ever quite what it seems.

**Ai Hoshino has been murdered.** You play as Aqua, her son, working your way through a web of suspects to find out who did it.

---

## What is this?

This is a full-stack Next.js game where every character is powered by a language model. There are no pre-scripted dialogue trees — you're having real conversations with NPCs who have personalities, secrets, memories, and relationships. They'll lie if they're the killer. They'll let things slip if you push the right buttons.

The game is also designed to teach **elicitation** — the art of getting information out of people who don't want to give it to you. A skill that's useful well beyond murder mysteries.

---

## Features

### 🎲 Randomised Scenarios
Every game is different. On start, `createNewGame()` picks one of **16 scenarios** — each with a different killer, motive, method, and set of clues. The killer gets their murder secret; every other suspect gets a randomly picked innocent cover. The same NPC might be the killer in one run and completely innocent in the next.

### 🗣️ Real AI Conversations
Each NPC is driven by a language model with a full character profile — personality, beliefs, fears, power dynamics, and a secret. The prompt system keeps them deeply in character across multiple turns, responding differently based on your tone, what you know, and how much they trust you.

### 🧠 Memory & Gossip
NPCs remember your previous conversations. Come back with a different angle and they'll already know what you've been up to. After every exchange, the game quietly generates a rumour and spreads it to other NPCs. Certain topic triggers cause direct backchannels — the Manager warns the Executive if finances come up, the Director warns the Executive if their arrangement is mentioned. Backchannelled NPCs become noticeably more guarded.

NPCs also **walk around the map independently** and interact with each other. When two NPCs get close, they may stop, huddle together, and exchange information — spreading rumours organically through the world.

### 🟢 Ruby — Your AI Agent
Ruby is Aqua's sister and your investigation partner. Whenever an NPC says something that contradicts a known clue, she butts in and calls it out — using natural language reasoning to match NPC replies against your verified facts. She's a bit brash, so she'll sometimes interject anyway. Very on brand.

### ❖ The Deal System
Information is currency. Ask an NPC for a deal and they'll propose a trade — they want something from you first. Go talk to someone else, dig up what they need, and come back. A second LLM call then judges whether what you've returned with is actually relevant. You can't just type "hi" and get away with it. Complete a deal and they'll reveal something that moves the investigation forward.

### 📓 The Notebook
Press `N` to open your investigation notes — scene clues, the method of murder (shown in orange), active and completed deals, confirmed truths earned through deals, and a **relationship map** showing the power dynamics between suspects. The map builds up gradually as you uncover connections.

### ⚡ Tension System
As the investigation heats up, tension rises — contradictions found, meaningful clues surfaced, and the passage of time all contribute. At high tension, NPCs become noticeably more guarded: shorter answers, deflecting questions, treating anything suspicious like a trap. The music also shifts — a calm idol track crossfades into a more dramatic score as pressure builds.

### 🎬 Confrontation Cinematic
Once you've made your decision, press **KILL** in the chat. The accused NPC delivers a final statement — a door closing, not a confession, if they're guilty. Shock or cold anger if they're innocent. The full truth is revealed on the end screen.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **LLM Provider:** [Groq](https://groq.com/) — `llama-3.1-8b-instant`
- **State:** No database — the entire game state is a JSON object passed back and forth on every turn
- **Styling:** Inline styles + CSS-in-JSX

---

## Getting Started
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

## How It Works — Under the Hood

**Every message turn:**
1. `page.tsx` POSTs to `/api/chat` with the NPC name, player message, and full world state
2. The route runs the NPC prompt through Groq to generate a reply
3. `Promise.all` runs extraction and Ruby interjection in parallel
4. Extraction returns structured JSON — trust/suspicion deltas, discovered clues, memory summary, rumours, backchannels
5. `applyExtractionToWorld` applies all changes and returns an updated world state
6. The client types out the reply and handles Ruby, deal reveals, and backchannels

**Deal completion uses two gates:**
- Gate 1: state check — did the player visit the right NPC productively?
- Gate 2: LLM judgment — did the player's report actually address the task?

Both must pass for the deal to fulfil.

---

## Inspiration

Based on the anime [Oshi no Ko](https://en.wikipedia.org/wiki/Oshi_no_Ko) by Aka Akasaka. All characters are original interpretations for game purposes.
