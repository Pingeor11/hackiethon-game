"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NPCName, SuspectName, WorldState, DealFulfilledPayload, ConfirmedTruth } from "@/lib/types";

interface LocalMessage {
  speaker: "user" | "npc" | "ruby";
  text: string;
}

type Facing = "left" | "right";

const SCENE_WIDTH = 1056;
const SCENE_HEIGHT = 584;
const PLAYER_SIZE = 54;
const MOVE_SPEED = 5;
const TALK_DISTANCE = 90;

const WALK_MIN_X = 100;
const WALK_MAX_X = 1300;
const WALK_MIN_Y = 480;
const WALK_MAX_Y = 650;

const initialMessages: Record<NPCName, LocalMessage[]> = {
  Manager: [],
  CoIdol: [],
  Director: [],
  Fan: [],
  Executive: [],
  Ruby: [],
};

const aquaSprites = {
  left: "/sprites/aqua-left.png",
  right: "/sprites/aqua-right.png",
};

const npcSpriteMap: Record<NPCName, string> = {
  Director: "/sprites/director.png",
  Fan: "/sprites/fan.png",
  Manager: "/sprites/manager.png",
  Executive: "/sprites/executive.png",
  CoIdol: "/sprites/coidol.png",
  Ruby: "/sprites/ruby.png",
};

const npcPositions: Record<NPCName, { x: number; y: number }> = {
  Director: { x: 1320, y: 530 },
  Fan: { x: 1200, y: 735 },
  Manager: { x: 385, y: 500 },
  Executive: { x: 430, y: 500 },
  CoIdol: { x: 520, y: 650 },
  Ruby: { x: 720, y: 600 },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ── Deal cinematic overlay ────────────────────────────────────────────────────
function DealRevealCinematic({
  payload,
  onClose,
}: {
  payload: DealFulfilledPayload;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"enter" | "reveal" | "truth" | "out">("enter");

  useEffect(() => {
    // Phase 1 → reveal after 600ms
    const t1 = setTimeout(() => setPhase("reveal"), 600);
    // Phase 2 → show truth after 1800ms
    const t2 = setTimeout(() => setPhase("truth"), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 800,
        background: "rgba(4,0,10,0.97)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "0",
        fontFamily: "'Press Start 2P', monospace",
        cursor: "pointer",
        animation: "cinematic-in 0.4s ease forwards",
      }}
      onClick={onClose}
    >
      {/* CRT */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(to bottom,transparent 0,transparent 3px,rgba(0,0,0,0.18) 3px,rgba(0,0,0,0.18) 4px)", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center,transparent 30%,rgba(4,0,10,0.9) 100%)", zIndex: 3 }} />

      <div style={{
        position: "relative", zIndex: 10,
        maxWidth: "680px", width: "90%",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "32px",
        padding: "48px 40px",
        border: "2px solid #f472b644",
        background: "rgba(14,4,24,0.98)",
        boxShadow: "0 0 80px #f472b622, 0 0 160px #f472b611",
      }}>
        {/* Source label */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "7px", color: "#6b3080", letterSpacing: "0.2em",
          opacity: phase === "enter" ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}>
          ❖ {payload.npcName.toUpperCase()} KEEPS THEIR WORD
        </div>

        {/* Divider */}
        <div style={{
          width: phase === "enter" ? "0px" : "100%",
          height: "1px", background: "#f472b633",
          transition: "width 0.8s ease",
        }} />

        {/* The truth */}
        <div style={{
          fontFamily: "'VT323', monospace",
          fontSize: "26px", color: "#f0e8ff",
          lineHeight: "1.6", textAlign: "center",
          letterSpacing: "0.03em",
          opacity: phase === "truth" ? 1 : 0,
          transform: phase === "truth" ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
          maxWidth: "560px",
        }}>
          "{payload.truth}"
        </div>

        {/* Source attribution */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "6px", color: "#f472b6",
          letterSpacing: "0.12em",
          opacity: phase === "truth" ? 1 : 0,
          transition: "opacity 0.7s ease 0.4s",
        }}>
          — {payload.npcName.toUpperCase()}
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: "1px", background: "#f472b633", opacity: phase === "truth" ? 1 : 0, transition: "opacity 0.5s ease 0.6s" }} />

        {/* Confirmed truth badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          opacity: phase === "truth" ? 1 : 0,
          transition: "opacity 0.6s ease 0.8s",
        }}>
          <span style={{ fontSize: "10px", color: "#f472b6" }}>★</span>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "7px", color: "#c084fc", letterSpacing: "0.1em",
          }}>CONFIRMED TRUTH ADDED TO NOTEBOOK</span>
          <span style={{ fontSize: "10px", color: "#f472b6" }}>★</span>
        </div>

        {/* Dismiss hint */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "6px", color: "#3a1050", letterSpacing: "0.1em",
          animation: "blink 1.2s step-end infinite",
          opacity: phase === "truth" ? 1 : 0,
          transition: "opacity 0.4s ease 1.2s",
          marginTop: "8px",
        }}>
          CLICK TO CONTINUE
        </div>
      </div>

      <style jsx>{`
        @keyframes cinematic-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
      `}</style>
    </div>
  );
}

// ── Confrontation Cinematic ───────────────────────────────────────────────────
function ConfrontationCinematic({
  npcName,
  reply,
  isCorrect,
  onComplete,
}: {
  npcName: SuspectName;
  reply: string;
  isCorrect: boolean;
  onComplete: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [done, setDone] = useState(false);

  // Type out the confrontation reply word by word
  useEffect(() => {
    const words = reply.split(" ");
    let i = 0;
    let current = "";
    const interval = setInterval(() => {
      if (i >= words.length) {
        clearInterval(interval);
        setDone(true);
        return;
      }
      current += (i === 0 ? "" : " ") + words[i];
      setDisplayedText(current);
      i++;
    }, 40);
    return () => clearInterval(interval);
  }, [reply]);

  const accentColor = isCorrect ? "#ff4a6a" : "#f472b6";
  const accentDim   = isCorrect ? "#ff4a6a22" : "#f472b622";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 850,
        background: "rgba(2,0,6,0.98)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column",
        fontFamily: "'Press Start 2P', monospace",
        animation: "cinematic-in 0.5s ease forwards",
        cursor: done ? "pointer" : "default",
      }}
      onClick={done ? onComplete : undefined}
    >
      {/* CRT */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "repeating-linear-gradient(to bottom,transparent 0,transparent 3px,rgba(0,0,0,0.2) 3px,rgba(0,0,0,0.2) 4px)", zIndex: 2 }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center,transparent 25%,rgba(2,0,6,0.92) 100%)", zIndex: 3 }} />

      <div style={{
        position: "relative", zIndex: 10,
        maxWidth: "700px", width: "90%",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "28px",
        padding: "52px 44px",
        border: `2px solid ${accentColor}33`,
        background: "rgba(8,2,14,0.99)",
        boxShadow: `0 0 100px ${accentDim}`,
      }}>
        {/* NPC portrait + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{
            width: "48px", height: "48px",
            border: `1px solid ${accentColor}55`, background: "#0a0116",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", imageRendering: "pixelated",
          }}>
            <img
              src={npcSpriteMap[npcName]}
              alt={npcName}
              style={{ width: "44px", height: "44px", objectFit: "contain", imageRendering: "pixelated" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontSize: "8px", color: accentColor, letterSpacing: "0.14em" }}>
              {npcName.toUpperCase()}
            </div>
            <div style={{ fontSize: "6px", color: "#6b3080", letterSpacing: "0.1em" }}>
              CONFRONTED
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: "100%", height: "1px", background: `${accentColor}22` }} />

        {/* The reply */}
        <div style={{
          fontFamily: "'VT323', monospace",
          fontSize: "24px", color: "#f0e8ff",
          lineHeight: "1.7", textAlign: "center",
          letterSpacing: "0.02em",
          minHeight: "80px",
          maxWidth: "580px",
        }}>
          "{displayedText}
          {!done && <span style={{ animation: "blink .55s step-end infinite", color: accentColor }}>▌</span>}"
        </div>

        {/* Dismiss hint — appears after typing finishes */}
        {done && (
          <div style={{
            fontSize: "6px", color: "#3a1050", letterSpacing: "0.12em",
            animation: "blink 1.2s step-end infinite",
          }}>
            CLICK TO CONTINUE
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes cinematic-in { from{opacity:0} to{opacity:1} }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
      `}</style>
    </div>
  );
}


// Pentagon layout of the 5 suspects. Directed arrows show power dynamics.
// Unexposed = faint dashed. Partially hinted = dim solid. Fully exposed = bright + label.

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  Manager:   { x: 130, y: 30  },
  CoIdol:    { x: 240, y: 105 },
  Director:  { x: 195, y: 225 },
  Fan:       { x: 65,  y: 225 },
  Executive: { x: 20,  y: 105 },
};

const DYNAMIC_ENDPOINTS: Record<string, { from: string; to: string }> = {
  manager_controls_coidol:     { from: "Manager",   to: "CoIdol"   },
  executive_owns_manager:      { from: "Executive", to: "Manager"  },
  director_indebted_executive: { from: "Director",  to: "Executive"},
  executive_surveilled_fan:    { from: "Executive", to: "Fan"      },
  coidol_ai_rivalry:           { from: "CoIdol",    to: "CoIdol"   },
};

function RelationshipMap({ dynamics }: { dynamics: any[] }) {
  const W = 260, H = 260;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", marginTop: "6px" }}>
      <defs>
        {["dim", "mid", "bright"].map(level => (
          <marker key={level} id={`arrow-${level}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill={level === "bright" ? "#f472b6" : level === "mid" ? "#6b3080" : "#2a0a38"} />
          </marker>
        ))}
      </defs>

      {/* ── Edges ── */}
      {dynamics.map((d: any) => {
        const ep = DYNAMIC_ENDPOINTS[d.id];
        if (!ep) return null;
        const from = NODE_POSITIONS[ep.from];
        const to   = NODE_POSITIONS[ep.to];
        if (!from || !to) return null;

        // Self-loop (CoIdol rivalry)
        if (ep.from === ep.to) {
          const cx = from.x;
          const cy = from.y - 22;
          const exposed = d.exposed;
          const hinted  = d.hintsCollected > 0;
          return (
            <g key={d.id}>
              <path
                d={`M${cx - 10},${from.y - 8} Q${cx - 28},${cy} ${cx + 10},${from.y - 8}`}
                fill="none"
                stroke={exposed ? "#f472b6" : hinted ? "#6b3080" : "#2a0a38"}
                strokeWidth={exposed ? 1.5 : 1}
                strokeDasharray={exposed ? "none" : hinted ? "none" : "3 3"}
                markerEnd={`url(#arrow-${exposed ? "bright" : hinted ? "mid" : "dim"})`}
                opacity={exposed ? 1 : hinted ? 0.6 : 0.3}
              />
              {exposed && (
                <text x={cx - 26} y={cy - 4} fontSize="5" fill="#f472b699"
                  fontFamily="'Press Start 2P', monospace" style={{ letterSpacing: "0.02em" }}>
                  RIVALRY
                </text>
              )}
            </g>
          );
        }

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = dx / len, ny = dy / len;
        const r = 16;
        const x1 = from.x + nx * r;
        const y1 = from.y + ny * r;
        const x2 = to.x - nx * (r + 4);
        const y2 = to.y - ny * (r + 4);
        const mx = (x1 + x2) / 2 - ny * 18;
        const my = (y1 + y2) / 2 + nx * 18;
        const lx = 0.25 * x1 + 0.5 * mx + 0.25 * x2;
        const ly = 0.25 * y1 + 0.5 * my + 0.25 * y2;

        const exposed = d.exposed;
        const hinted  = d.hintsCollected > 0;

        return (
          <g key={d.id}>
            <path
              d={`M${x1},${y1} Q${mx},${my} ${x2},${y2}`}
              fill="none"
              stroke={exposed ? "#f472b6" : hinted ? "#6b3080" : "#2a0a38"}
              strokeWidth={exposed ? 1.5 : 1}
              strokeDasharray={exposed ? "none" : hinted ? "none" : "3 3"}
              markerEnd={`url(#arrow-${exposed ? "bright" : hinted ? "mid" : "dim"})`}
              opacity={exposed ? 1 : hinted ? 0.65 : 0.3}
            />
            {hinted && !exposed && (
              <text x={lx} y={ly} fontSize="6" fill="#6b3080" fontFamily="monospace" textAnchor="middle">
                {d.hintsCollected}/{d.hintsNeeded}
              </text>
            )}
            {exposed && (
              <text x={lx} y={ly - 3} fontSize="5" fill="#f472b699"
                fontFamily="'Press Start 2P', monospace" textAnchor="middle"
                style={{ letterSpacing: "0.02em" }}>
                {d.id === "executive_owns_manager"      ? "OWNS"     :
                 d.id === "manager_controls_coidol"     ? "CONTROLS" :
                 d.id === "director_indebted_executive" ? "OWES"     :
                 d.id === "executive_surveilled_fan"    ? "SURVEILS" : "↑"}
              </text>
            )}
          </g>
        );
      })}

      {/* ── Nodes ── */}
      {Object.entries(NODE_POSITIONS).map(([name, pos]) => {
        const isActive = dynamics.some(d => d.exposed && (
          DYNAMIC_ENDPOINTS[d.id]?.from === name || DYNAMIC_ENDPOINTS[d.id]?.to === name
        ));
        const isHinted = !isActive && dynamics.some(d => d.hintsCollected > 0 && (
          DYNAMIC_ENDPOINTS[d.id]?.from === name || DYNAMIC_ENDPOINTS[d.id]?.to === name
        ));
        return (
          <g key={name}>
            {isActive && (
              <circle cx={pos.x} cy={pos.y} r={19} fill="none" stroke="#f472b6" strokeWidth="0.5" opacity="0.3" />
            )}
            <circle cx={pos.x} cy={pos.y} r={14} fill="#0e0420"
              stroke={isActive ? "#f472b6" : isHinted ? "#6b3080" : "#2a0a38"}
              strokeWidth={isActive ? 1.5 : 1}
            />
            <text x={pos.x} y={pos.y + 2} fontSize="5"
              fill={isActive ? "#f472b6" : isHinted ? "#c084fc" : "#4a1060"}
              fontFamily="'Press Start 2P', monospace" textAnchor="middle" dominantBaseline="middle">
              {name === "CoIdol" ? "CO" : name === "Executive" ? "EXEC" : name.slice(0, 3).toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* ── Legend ── */}
      <g transform="translate(0, 248)">
        <line x1="0" y1="5" x2="10" y2="5" stroke="#2a0a38" strokeWidth="1" strokeDasharray="3 2" />
        <text x="13" y="8" fontSize="5" fill="#3a1050" fontFamily="monospace">UNKNOWN</text>
        <line x1="60" y1="5" x2="70" y2="5" stroke="#6b3080" strokeWidth="1" />
        <text x="73" y="8" fontSize="5" fill="#6b3080" fontFamily="monospace">HINTED</text>
        <line x1="112" y1="5" x2="122" y2="5" stroke="#f472b6" strokeWidth="1.5" />
        <text x="125" y="8" fontSize="5" fill="#f472b699" fontFamily="monospace">EXPOSED</text>
      </g>
    </svg>
  );
}

export default function HomePage() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [messages, setMessages] = useState<Record<NPCName, LocalMessage[]>>(initialMessages);
  const [playerPos, setPlayerPos] = useState({ x: 530, y: 470 });
  const [facing, setFacing] = useState<Facing>("right");
  const [selectedNPC, setSelectedNPC] = useState<NPCName | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingNPC, setTypingNPC] = useState<NPCName | null>(null);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [elicitationToast, setElicitationToast] = useState<string | null>(null);
  const [barterOffer, setBarterOffer] = useState<{
    npcName: string; offer: string; asking: string;
    taskTarget: string | null; truthIndex: number;
  } | null>(null);
  // Deal reveal cinematic
  const [dealReveal, setDealReveal] = useState<DealFulfilledPayload | null>(null);
  // Soft hint when Gate 1 passed but Gate 2 failed
  const [dealHint, setDealHint] = useState<string | null>(null);
  // Backchannel toast — NPC warned someone after this conversation
  const [backchannelToast, setBackchannelToast] = useState<{ from: string; to: string; message: string } | null>(null);
  // Confrontation cinematic state
  const [confrontation, setConfrontation] = useState<{
    npcName: SuspectName;
    reply: string;
    isCorrect: boolean;
    updatedWorldState: WorldState;
  } | null>(null);

  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [sceneRect, setSceneRect] = useState({ width: SCENE_WIDTH, height: SCENE_HEIGHT });
  const pressedKeys = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/game").then((r) => r.json()).then(data => {
      setWorldState(data);
      setShowIntro(true);
    });
  }, []);

  useEffect(() => {
    if (!showIntro) return;
    const handler = () => setShowIntro(false);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showIntro]);

  useEffect(() => {
    const el = chatLogRef.current;
    if (!el) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [messages, selectedNPC, typingNPC]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      setSceneRect({ width: e.contentRect.width, height: e.contentRect.height });
    });
    ro.observe(sceneRef.current);
    return () => ro.disconnect();
  }, []);

  const scaleX = sceneRect.width / SCENE_WIDTH;
  const scaleY = sceneRect.height / SCENE_HEIGHT;

  const npcList = useMemo(() => {
    if (!worldState) return [] as NPCName[];
    return Object.keys(worldState.npcs) as NPCName[];
  }, [worldState]);

  const nearbyNPC = useMemo(() => {
    if (!worldState) return null;
    let best: NPCName | null = null;
    let bestDist = Infinity;
    for (const npcName of npcList) {
      const d = distance(playerPos, npcPositions[npcName]);
      if (d <= TALK_DISTANCE && d < bestDist) { best = npcName; bestDist = d; }
    }
    return best;
  }, [worldState, npcList, playerPos]);

  const activeNPC = selectedNPC ? worldState?.npcs[selectedNPC] : null;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";
      if (isTyping) { if (e.key === "Escape") setSelectedNPC(null); return; }
      if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","a","A","d","D","w","W","s","S","e","E","n","N","Escape"].includes(e.key)) e.preventDefault();
      if (e.key === "e" || e.key === "E") {
        if (nearbyNPC && !selectedNPC) { setSelectedNPC(nearbyNPC); setTimeout(() => inputRef.current?.focus(), 0); }
        return;
      }
      if (e.key === "n" || e.key === "N") { setNotebookOpen(v => !v); return; }
      if (e.key === "Escape") { setSelectedNPC(null); setNotebookOpen(false); return; }
      pressedKeys.current.add(e.key);
    }
    function handleKeyUp(e: KeyboardEvent) { pressedKeys.current.delete(e.key); }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [nearbyNPC, selectedNPC]);

  useEffect(() => {
    function tick() {
      if (!selectedNPC && !worldState?.gameOver) {
        setPlayerPos((prev) => {
          let nx = prev.x, ny = prev.y;
          if (pressedKeys.current.has("ArrowLeft") || pressedKeys.current.has("a") || pressedKeys.current.has("A")) { nx -= MOVE_SPEED; setFacing("left"); }
          if (pressedKeys.current.has("ArrowRight") || pressedKeys.current.has("d") || pressedKeys.current.has("D")) { nx += MOVE_SPEED; setFacing("right"); }
          if (pressedKeys.current.has("ArrowUp") || pressedKeys.current.has("w") || pressedKeys.current.has("W")) ny -= MOVE_SPEED;
          if (pressedKeys.current.has("ArrowDown") || pressedKeys.current.has("s") || pressedKeys.current.has("S")) ny += MOVE_SPEED;
          return { x: clamp(nx, WALK_MIN_X, WALK_MAX_X), y: clamp(ny, WALK_MIN_Y, WALK_MAX_Y) };
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [selectedNPC, worldState?.gameOver]);

  async function typeNPCMessage(npcName: NPCName, fullText: string) {
    setTypingNPC(npcName);
    setMessages(prev => ({ ...prev, [npcName]: [...prev[npcName], { speaker: "npc", text: "" }] }));
    const words = fullText.split(" ");
    let current = "";
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? "" : " ") + words[i];
      setMessages(prev => {
        const arr = [...prev[npcName]];
        arr[arr.length - 1] = { speaker: "npc", text: current };
        return { ...prev, [npcName]: arr };
      });
      await new Promise(r => setTimeout(r, 24));
    }
    setTypingNPC(null);
  }

  async function sendMessage() {
    if (!worldState || !selectedNPC || !input.trim() || loading || worldState.gameOver) return;
    const msg = input.trim(); setInput(""); setLoading(true);
    setMessages(prev => ({ ...prev, [selectedNPC]: [...prev[selectedNPC], { speaker: "user", text: msg }] }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npcName: selectedNPC, playerMessage: msg, worldState }),
    });
    const data = await res.json();
    setWorldState(data.updatedWorldState);

    if (data.elicitationFeedback) {
      setElicitationToast(data.elicitationFeedback);
      setTimeout(() => setElicitationToast(null), 5000);
    }
    if (data.barterOffer) {
      setBarterOffer(data.barterOffer);
    }

    // ── Loading clears here — movement resumes immediately ───────────────────
    setLoading(false);

    // Type the NPC reply — does not block movement
    await typeNPCMessage(selectedNPC, data.reply);

    // Deal reveal cinematic fires after NPC speaks
    if (data.dealFulfilled) {
      setTimeout(() => setDealReveal(data.dealFulfilled), 400);
    }

    // Soft hint — Gate 1 passed but Gate 2 failed
    if (data.dealHint) {
      setDealHint(data.dealHint);
      setTimeout(() => setDealHint(null), 6000);
    }

    // Backchannel toast
    if (data.backchannelDetected && data.updatedWorldState) {
      const match = data.backchannelDetected.match(/^(.+?) contacted (.+?) after/);
      if (match) {
        const bcFrom = match[1].trim();
        const bcTo = match[2].trim();
        const targetNPC = data.updatedWorldState.npcs[bcTo];
        const recentRumor = targetNPC?.rumorsHeard?.slice(-1)[0] ?? null;
        const bcMessage = recentRumor?.includes("told me:")
          ? recentRumor.split('"')[1] ?? "something about your questions"
          : "something about your questions";
        setTimeout(() => {
          setBackchannelToast({ from: bcFrom, to: bcTo, message: bcMessage });
          setTimeout(() => setBackchannelToast(null), 6000);
        }, 1200);
      }
    }

    // ── Ruby interjection — fully non-blocking, fires after loading clears ────
    // Player can move and act immediately. Ruby appears if she has something.
    const npcForRuby = selectedNPC;
    if (npcForRuby !== "Ruby" && data.updatedWorldState) {
      fetch("/api/ruby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npcName: npcForRuby,
          playerMessage: msg,
          npcReply: data.reply,
          worldState: data.updatedWorldState,
        }),
      })
        .then(r => r.json())
        .then(rubyData => {
          if (rubyData?.interject && rubyData.message) {
            setMessages(prev => ({
              ...prev,
              [npcForRuby]: [
                ...prev[npcForRuby],
                { speaker: "ruby", text: rubyData.message },
              ],
            }));
            if (rubyData.flaggedFact) {
              setWorldState(prev => prev ? {
                ...prev,
                rubyFlagged: [...(prev.rubyFlagged ?? []), rubyData.flaggedFact],
              } : prev);
            }
          }
        })
        .catch(() => {});
    }
  }

  async function askRubyForHelp() {
    if (!worldState || loading || worldState.gameOver) return;
    setLoading(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npcName: "Ruby", playerMessage: "Help me summarize the case.", rubyHelp: true, worldState }),
    });
    const data = await res.json();
    await typeNPCMessage("Ruby", data.reply);
    setLoading(false);
  }

  async function killNPC(npcName: SuspectName) {
    if (!worldState || loading || worldState.gameOver) return;
    setLoading(true);
    setSelectedNPC(null);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ npcName, kill: npcName, playerMessage: "", worldState }),
    });
    const data = await res.json();
    setLoading(false);
    // Trigger confrontation cinematic — world state update happens after it resolves
    if (data.confrontationReply) {
      setConfrontation({
        npcName,
        reply: data.confrontationReply,
        isCorrect: data.isCorrect,
        updatedWorldState: data.updatedWorldState,
      });
    } else if (data.updatedWorldState) {
      setWorldState(data.updatedWorldState);
    }
  }

  // ── Derived deal state ─────────────────────────────────────────────────────
  const pendingDeals = (worldState?.activeDeals ?? []).filter(d => d.status === "pending");
  const completedDeals = (worldState?.activeDeals ?? []).filter(d => d.status === "fulfilled");
  const confirmedTruths: ConfirmedTruth[] = worldState?.confirmedTruths ?? [];

  // Has the selected NPC given a pending deal that needs the player to visit a target first?
  const activeDealForCurrentNPC = selectedNPC
    ? pendingDeals.find(d => d.npcName === selectedNPC)
    : null;

  // ── Intro screens ──────────────────────────────────────────────────────────
  if (showIntro && worldState) return (
    <main style={{
      width:"100vw", height:"100vh", background:"#100818",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column", overflow:"hidden",
      fontFamily:"'Press Start 2P', monospace",
      cursor:"pointer",
    }} onClick={() => setShowIntro(false)}>
      <style jsx global>{`
        @keyframes fadeInUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes pulse-glow{0%,100%{text-shadow:0 0 20px #f472b6aa}50%{text-shadow:0 0 40px #f472b6,0 0 80px #f472b644}}
      `}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(to bottom,transparent 0,transparent 3px,rgba(0,0,0,0.15) 3px,rgba(0,0,0,0.15) 4px)",zIndex:5}} />
      <div style={{position:"fixed",inset:0,pointerEvents:"none",background:"radial-gradient(ellipse at center,transparent 40%,rgba(8,2,16,0.88) 100%)",zIndex:6}} />
      <div style={{ position:"relative", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", gap:"40px", padding:"40px", maxWidth:"680px", textAlign:"center" }}>
        <div style={{ fontSize:"36px", color:"#f472b6", animation:"pulse-glow 2s ease-in-out infinite", animationDelay:"0.5s", opacity:0, animationFillMode:"forwards" }}>★</div>
        <div style={{display:"flex",flexDirection:"column",gap:"20px",width:"100%"}}>
          {[
            { text:"AI HOSHINO HAS BEEN FOUND DEAD", delay:"0.3s", color:"#f0e8ff", size:"10px" },
            { text:"AT THE FRONT OF THE HOUSE.", delay:"1s", color:"#f0e8ff", size:"10px" },
            { text:"ON THE DAY SHE WOULD PERFORM AT TOKYO DOME.", delay:"1.8s", color:"#c084fc", size:"9px" },
          ].map((l, i) => (
            <div key={i} style={{ fontSize:l.size, color:l.color, letterSpacing:"0.15em", lineHeight:"2", animation:"fadeInUp 0.8s ease forwards", animationDelay:l.delay, opacity:0 }}>{l.text}</div>
          ))}
          <div style={{ width:"60px", height:"1px", background:"#f472b644", margin:"4px auto", animation:"fadeInUp 0.8s ease forwards", animationDelay:"2.4s", opacity:0 }} />
          <div style={{ fontSize:"9px", color:"#e879f9", letterSpacing:"0.14em", lineHeight:"2", animation:"fadeInUp 0.8s ease forwards", animationDelay:"2.8s", opacity:0 }}>YOU ARE AI'S SON — AQUA HOSHINO.</div>
          <div style={{ fontSize:"11px", color:"#f472b6", letterSpacing:"0.2em", animation:"fadeInUp 0.8s ease forwards, pulse-glow 2s ease-in-out infinite", animationDelay:"3.4s", opacity:0, textShadow:"0 0 20px #f472b6aa" }}>FIND OUT WHO DID IT.</div>
        </div>
        <div style={{ fontSize:"6px", color:"#3a1050", letterSpacing:"0.14em", animation:"blink 1.2s step-end infinite, fadeInUp 0.8s ease forwards", animationDelay:"4s", opacity:0 }}>CLICK ANYWHERE TO BEGIN</div>
      </div>
    </main>
  );

  if (!worldState) return (
    <main style={{ width:"100vw", height:"100vh", background:"#100818", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:"32px", overflow:"hidden", fontFamily:"'Press Start 2P', monospace" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#100818;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      `}</style>
      <div style={{ fontSize:"52px", color:"#f472b6", animation:"spin 3s linear infinite", textShadow:"0 0 30px #f472b6, 0 0 60px #f472b644", zIndex:20 }}>★</div>
      <div style={{ zIndex:20, textAlign:"center" }}>
        <div style={{ fontSize:"13px", color:"#f472b6", letterSpacing:"0.3em" }}>✦ OSHI NO KO ✦</div>
        <div style={{ fontSize:"8px", color:"#e879f9", letterSpacing:"0.2em", marginTop:"8px" }}>INVESTIGATION</div>
      </div>
    </main>
  );

  return (
    <main className="shell">
      <div className="scanlines" aria-hidden />
      <div className="vignette" aria-hidden />

      {/* ── Confrontation Cinematic ── */}
      {confrontation && (
        <ConfrontationCinematic
          npcName={confrontation.npcName}
          reply={confrontation.reply}
          isCorrect={confrontation.isCorrect}
          onComplete={() => {
            setWorldState(confrontation.updatedWorldState);
            setConfrontation(null);
          }}
        />
      )}

      {/* ── Deal Reveal Cinematic ── */}
      {dealReveal && (
        <DealRevealCinematic
          payload={dealReveal}
          onClose={() => setDealReveal(null)}
        />
      )}

      {/* ── HUD ── */}
      <header className="hud">
        <div className="hud-left">
          <div className="hud-logo">✦ OSH<span>I</span></div>
          <div className="hud-sep" />
          <span className="chip"><span className="chip-icon">♡</span>AQUA</span>
          <span className="chip dim">MAIN STAGE</span>
          <span className="chip">TRN <em>{worldState.turn}</em></span>
          <span className={`chip ${worldState.tension >= 7 ? "hot" : ""}`}>TNS <em>{worldState.tension}</em></span>
          {pendingDeals.length > 0 && (
            <span className="chip deal-chip">❖ {pendingDeals.length} DEAL{pendingDeals.length > 1 ? "S" : ""}</span>
          )}
          {worldState.gameOver && (
            <span className={`chip ${worldState.winner ? "win" : "lose"}`}>
              {worldState.winner ? "★ SOLVED" : "✕ FAILED"}
            </span>
          )}
        </div>
        <div className="hud-right">
          <div className="key-hint"><kbd>WASD</kbd><span>move</span></div>
          <div className="key-hint"><kbd>E</kbd><span>talk</span></div>
          <div className="key-hint"><kbd>N</kbd><span>notes</span></div>
          <div className="key-hint"><kbd>ESC</kbd><span>back</span></div>
        </div>
      </header>

      {/* ── Scene ── */}
      <div className="scene-wrap">
        <div className="scene" ref={sceneRef}>
          <img src="/background/stage-bg.jpg" alt="" className="stage-bg" draggable={false} />
          <div className="star-overlay" aria-hidden>
            {(["★","✦","✧","★","✦"] as const).map((s, i) => (
              <span key={i} className={`sp sp${i}`}>{s}</span>
            ))}
          </div>

          {npcList.map((npcName) => {
            const pos = npcPositions[npcName];
            const isNearby = nearbyNPC === npcName;
            const isLarge = npcName === "Director" || npcName === "Manager" || npcName === "Executive";
            const hasPendingDeal = pendingDeals.some(d => d.npcName === npcName);
            return (
              <button
                key={npcName}
                className={`npc ${isNearby ? "nearby" : ""}`}
                style={{ left: pos.x * scaleX, top: pos.y * scaleY, zIndex: Math.floor(pos.y) }}
                onClick={() => { if (distance(playerPos, pos) <= TALK_DISTANCE) setSelectedNPC(npcName); }}
              >
                <img src={npcSpriteMap[npcName]} alt={npcName} className={`sprite ${isLarge ? "lg" : ""}`} draggable={false} />
                {isNearby && <div className="name-tag">▲ {npcName}{hasPendingDeal ? " ❖" : ""}</div>}
                {hasPendingDeal && !isNearby && (
                  <div className="deal-indicator">❖</div>
                )}
              </button>
            );
          })}

          <div
            className={`player ${facing}`}
            style={{ left: playerPos.x * scaleX, top: playerPos.y * scaleY, zIndex: Math.floor(playerPos.y) }}
          >
            <img src={facing === "left" ? aquaSprites.left : aquaSprites.right} alt="Aqua" className="sprite" draggable={false} />
          </div>
        </div>
      </div>

      {/* ── Talk prompt ── */}
      {nearbyNPC && !selectedNPC && !worldState.gameOver && (
        <div className="talk-prompt">
          <kbd>E</kbd>
          <span>TALK TO <strong>{nearbyNPC.toUpperCase()}</strong></span>
          {pendingDeals.some(d => d.npcName === nearbyNPC) && <span className="deal-badge">❖ DEAL PENDING</span>}
          <span className="blink-star">★</span>
        </div>
      )}

      {/* ── Notebook ── */}
      {notebookOpen && (
        <aside className="notebook" onClick={e => e.stopPropagation()}>
          <div className="nb-head">
            <span>✦ NOTEBOOK</span>
            <button className="icon-btn" onClick={() => setNotebookOpen(false)}>✕</button>
          </div>
          <div className="nb-body">

            {/* ── Scene Clues — always visible, drawn from scenario.globalClues ── */}
            <div className="nb-section">
              <h4>▸ KNOWN FROM THE SCENE</h4>
              {(worldState.globalClues ?? []).slice(0, 3).map((clue, i) => (
                <div key={i} className="nb-scene-clue">
                  <span className="nb-scene-bullet">◆</span>
                  <span className="nb-scene-text">{clue}</span>
                </div>
              ))}
              <div className="nb-scene-clue" style={{ marginTop: "8px" }}>
                <span className="nb-scene-bullet" style={{ color: "#ff4a6a" }}>◆</span>
                <span className="nb-scene-text" style={{ color: "#ff8a6a" }}>{worldState.methodClue}</span>
              </div>
            </div>

            <div className="nb-hr" />

            {/* ── Active Deals ── */}
            <div className="nb-section">
              <h4>▸ ACTIVE DEALS</h4>
              {pendingDeals.length === 0 ? (
                <p className="nb-empty">— no active deals —</p>
              ) : pendingDeals.map((deal, i) => (
                <div key={i} className="nb-deal nb-deal-active">
                  <div className="nb-deal-source">❖ {deal.npcName.toUpperCase()}</div>
                  <div className="nb-deal-task">{deal.task}</div>
                  {deal.taskTarget && (
                    <div className="nb-deal-target">
                      ↳ GO SPEAK TO <span className="nb-deal-target-name">{deal.taskTarget.toUpperCase()}</span>
                    </div>
                  )}
                  <div className="nb-deal-reward">
                    <span className="nb-deal-reward-label">THEY WILL REVEAL</span>
                    <span className="nb-deal-reward-text">"{deal.reward}"</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="nb-hr" />

            {/* ── Confirmed Truths ── */}
            <div className="nb-section">
              <h4>▸ CONFIRMED TRUTHS</h4>
              {confirmedTruths.length === 0 ? (
                <p className="nb-empty">— complete a deal to confirm a truth —</p>
              ) : confirmedTruths.map((ct, i) => (
                <div key={i} className="nb-truth">
                  <div className="nb-truth-source">★ {ct.source.toUpperCase()} — TRN {ct.turn}</div>
                  <div className="nb-truth-text">"{ct.truth}"</div>
                </div>
              ))}
            </div>

            <div className="nb-hr" />

            {/* ── Completed Deals ── */}
            {completedDeals.length > 0 && (
              <>
                <div className="nb-section">
                  <h4>▸ COMPLETED DEALS</h4>
                  {completedDeals.map((deal, i) => (
                    <div key={i} className="nb-deal nb-deal-done">
                      <div className="nb-deal-source">✓ {deal.npcName.toUpperCase()}</div>
                      {deal.revealedTruth && (
                        <div className="nb-deal-task" style={{ color: "#c084fc" }}>{deal.revealedTruth}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="nb-hr" />
              </>
            )}

            {/* ── Relationship Map — power dynamics between suspects ── */}
            <div className="nb-section">
              <h4>▸ POWER MAP</h4>
              <RelationshipMap dynamics={worldState.powerDynamics ?? []} />
            </div>

          </div>
        </aside>
      )}

      {/* ── Dialog box ── */}
      {selectedNPC && activeNPC && (
        <div className="dlg-wrap">
          <div className="dlg-bar">
            <div className="dlg-portrait">
              <img src={npcSpriteMap[selectedNPC]} alt={selectedNPC} className="portrait-img" draggable={false} />
            </div>
            <div className="dlg-meta">
              <span className="dlg-name">{selectedNPC.toUpperCase()}</span>
              <span className="dlg-sub">{activeNPC.role} · {activeNPC.mood.toUpperCase()}</span>
            </div>
            <div className="dlg-bars">
              <div className="bar-row"><span>TRUST</span><div className="bar-track"><div className="bar-fill trust" style={{ width: `${activeNPC.trustPlayer * 100}%` }} /></div><span className="bar-val">{(activeNPC.trustPlayer * 100).toFixed(0)}</span></div>
              <div className="bar-row"><span>SUSP</span><div className="bar-track"><div className="bar-fill susp" style={{ width: `${activeNPC.suspicionPlayer * 100}%` }} /></div><span className="bar-val">{(activeNPC.suspicionPlayer * 100).toFixed(0)}</span></div>
            </div>
            <div className="dlg-bar-right">
              <button className="icon-btn" onClick={() => setSelectedNPC(null)}>✕</button>
            </div>
          </div>

          {/* ── Active deal reminder inside dialog ── */}
          {activeDealForCurrentNPC && (
            <div className="dlg-deal-reminder">
              <div className="dlg-deal-reminder-label">❖ ACTIVE DEAL</div>
              <div className="dlg-deal-reminder-task">{activeDealForCurrentNPC.task}</div>
              {activeDealForCurrentNPC.taskTarget && (
                <div className="dlg-deal-reminder-target">
                  ↳ Visit <strong>{activeDealForCurrentNPC.taskTarget}</strong> first, then return here and report back
                </div>
              )}
              {!activeDealForCurrentNPC.taskTarget && (
                <div className="dlg-deal-reminder-target">
                  ↳ Share what you've found — tell them directly in conversation
                </div>
              )}
            </div>
          )}

          <div className="dlg-messages" ref={chatLogRef}>
            {messages[selectedNPC].length === 0 && (
              <p className="dlg-empty">
                {selectedNPC === "Ruby"
                  ? "✦ Ruby can summarize clues and suggest next steps."
                  : `✦ Ask ${selectedNPC} about their alibi, motive, or relationships.`}
              </p>
            )}
            {messages[selectedNPC].map((m, i) => {
              // ── Ruby interjection ──────────────────────────────────────────
              if (m.speaker === "ruby") {
                return (
                  <div key={i} style={{
                    display: "flex", width: "100%",
                    justifyContent: "flex-start",
                    flexShrink: 0,
                    gap: "6px",
                    alignItems: "flex-start",
                    marginTop: "4px",
                  }}>
                    {/* Ruby portrait */}
                    <div style={{
                      width: "22px", height: "22px", flexShrink: 0,
                      border: "1px solid #4ade8044", background: "#0a1a0a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", imageRendering: "pixelated", marginTop: "14px",
                    }}>
                      <img src="/sprites/ruby.png" alt="Ruby"
                        style={{ width: "20px", height: "20px", objectFit: "contain", imageRendering: "pixelated" }}
                      />
                    </div>
                    <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", gap: "2px" }}>
                      <div style={{
                        fontFamily: "'Press Start 2P', monospace", fontSize: "6px",
                        letterSpacing: ".04em", padding: "0 2px", color: "#4ade80aa",
                      }}>
                        RUBY
                      </div>
                      <div style={{
                        fontFamily: "'VT323', monospace", fontSize: "17px", lineHeight: "1.4",
                        padding: "5px 10px", wordBreak: "break-word", overflowWrap: "anywhere",
                        background: "#031a08",
                        border: "1px solid #4ade8033",
                        color: "#86efac",
                        borderRadius: "0 6px 6px 6px",
                      }}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                );
              }

              // ── Normal user / npc message ──────────────────────────────────
              return (
                <div key={i} style={{
                  display: "flex", width: "100%",
                  justifyContent: m.speaker === "user" ? "flex-end" : "flex-start",
                  flexShrink: 0,
                }}>
                  <div style={{ maxWidth: "62%", display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{
                      fontFamily: "'Press Start 2P', monospace", fontSize: "6px", letterSpacing: ".04em",
                      padding: "0 2px", color: m.speaker === "user" ? "#4338ca" : "#6b21a8",
                      textAlign: m.speaker === "user" ? "right" : "left",
                    }}>
                      {m.speaker === "user" ? "YOU" : selectedNPC.toUpperCase()}
                    </div>
                    <div style={{
                      fontFamily: "'VT323', monospace", fontSize: "19px", lineHeight: "1.4",
                      padding: "6px 10px", wordBreak: "break-word", overflowWrap: "anywhere",
                      whiteSpace: "pre-wrap",
                      background: m.speaker === "user" ? "#0c0a30" : "#1c0535",
                      border: m.speaker === "user" ? "1px solid #312e81" : "1px solid #4a1060",
                      color: m.speaker === "user" ? "#c7d2fe" : "#f0e8ff",
                      borderRadius: m.speaker === "user" ? "6px 0 6px 6px" : "0 6px 6px 6px",
                      textAlign: m.speaker === "user" ? "right" : "left",
                    }}>
                      {m.text}
                      {typingNPC === selectedNPC && i === messages[selectedNPC].length - 1 && m.speaker === "npc" && <span className="cursor">▌</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dlg-input-row">
            <input
              ref={inputRef}
              className="dlg-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={
                activeDealForCurrentNPC
                  ? activeDealForCurrentNPC.taskTarget
                    ? `Report back what ${activeDealForCurrentNPC.taskTarget} said...`
                    : "Share what you've found..."
                  : selectedNPC === "Ruby" ? "Ask Ruby for insight..." : "Ask a question..."
              }
              disabled={loading || worldState.gameOver || typingNPC === selectedNPC}
            />
            <button className="btn primary" onClick={sendMessage} disabled={loading || worldState.gameOver || typingNPC === selectedNPC}>
              {loading || typingNPC === selectedNPC ? "···" : "SEND ▶"}
            </button>
            {selectedNPC === "Ruby" && (
              <button className="btn" onClick={askRubyForHelp} disabled={loading || worldState.gameOver || typingNPC === "Ruby"}>
                SUMM.
              </button>
            )}
            {activeNPC.isKillerCandidate && worldState.accusationUnlocked && !worldState.gameOver && (
              <button className="btn kill" onClick={() => killNPC(selectedNPC as SuspectName)} disabled={loading || typingNPC === selectedNPC}>
                ✦ KILL
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Deal Offer Popup ── */}
      {barterOffer && selectedNPC === barterOffer.npcName && (
        <div style={{
          position: "fixed", bottom: "320px", left: "50%", transform: "translateX(-50%)",
          zIndex: 300, background: "#0e0418", border: "2px solid #f472b6",
          padding: "20px 24px", maxWidth: "560px", width: "90%",
          fontFamily: "'VT323', monospace",
          boxShadow: "0 0 60px #f472b622",
        }}>
          <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#f472b6", marginBottom: "14px", letterSpacing: "0.1em" }}>
            ❖ {barterOffer.npcName.toUpperCase()} PROPOSES A DEAL
          </div>

          {/* What they'll tell you */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: "6px", color: "#6b3080", marginBottom: "5px", letterSpacing: "0.06em" }}>IF YOU DO THIS — THEY WILL TELL YOU</div>
            <div style={{ fontSize: "19px", color: "#f0e8ff", lineHeight: "1.4", paddingLeft: "8px", borderLeft: "2px solid #f472b633" }}>"{barterOffer.offer}"</div>
          </div>

          <div style={{ height: "1px", background: "#3a1050", margin: "12px 0" }} />

          {/* The task */}
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: "6px", color: "#6b3080", marginBottom: "5px", letterSpacing: "0.06em" }}>YOUR TASK</div>
            <div style={{ fontSize: "18px", color: "#c084fc", lineHeight: "1.5" }}>{barterOffer.asking}</div>
          </div>

          {/* Target NPC indicator */}
          {barterOffer.taskTarget && (
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 10px", background: "#110322", border: "1px solid #3a1050",
              marginBottom: "14px",
            }}>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: "6px", color: "#f472b6" }}>↳ VISIT</div>
              <div style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#e879f9",
                padding: "2px 8px", border: "1px solid #f472b644", background: "#1c0535",
              }}>
                {barterOffer.taskTarget.toUpperCase()}
              </div>
              <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: "6px", color: "#6b3080" }}>THEN RETURN HERE</div>
            </div>
          )}
          {!barterOffer.taskTarget && (
            <div style={{
              padding: "8px 10px", background: "#110322", border: "1px solid #3a1050",
              marginBottom: "14px",
              fontFamily: "'Press Start 2P',monospace", fontSize: "6px", color: "#6b3080",
            }}>
              ↳ TELL THEM WHAT YOU'VE FOUND — IN THIS CONVERSATION
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setBarterOffer(null)}
              style={{ fontFamily: "'Press Start 2P',monospace", fontSize: "7px", padding: "8px 14px", background: "#1a0535", border: "1px solid #f472b6", color: "#f472b6", cursor: "pointer" }}>
              ACCEPT DEAL
            </button>
            <button
              onClick={() => setBarterOffer(null)}
              style={{ fontFamily: "'Press Start 2P',monospace", fontSize: "7px", padding: "8px 14px", background: "#1a0535", border: "1px solid #3a1050", color: "#6b3080", cursor: "pointer" }}>
              DECLINE
            </button>
          </div>
        </div>
      )}

      {/* ── Elicitation toast ── */}
      {elicitationToast && (
        <div style={{
          position: "fixed", top: "52px", left: "50%", transform: "translateX(-50%)",
          zIndex: 300, background: "#1a0535", border: "1px solid #f472b6",
          padding: "8px 16px", maxWidth: "500px",
          fontFamily: "'Press Start 2P', monospace", fontSize: "7px",
          color: "#f472b6", letterSpacing: "0.06em", lineHeight: "1.8",
          boxShadow: "0 0 20px #f472b633",
        }}>
          ✦ TECHNIQUE WORKED: {elicitationToast}
        </div>
      )}

      {/* ── Deal hint toast — Gate 1 passed, Gate 2 failed ── */}
      {dealHint && (
        <div style={{
          position: "fixed", top: "52px", left: "50%", transform: "translateX(-50%)",
          zIndex: 301, background: "#0e0220", border: "1px solid #7c3aed",
          padding: "8px 16px", maxWidth: "520px",
          fontFamily: "'Press Start 2P', monospace", fontSize: "7px",
          color: "#a78bfa", letterSpacing: "0.06em", lineHeight: "1.8",
          boxShadow: "0 0 20px #7c3aed33",
        }}>
          ❖ NOT QUITE — {dealHint}
        </div>
      )}

      {/* ── Backchannel toast — NPC warned someone after this conversation ── */}
      {backchannelToast && (
        <div style={{
          position: "fixed", top: "52px", right: "16px",
          zIndex: 302,
          background: "#0a0e1a",
          border: "1px solid #0ea5e944",
          padding: "10px 14px",
          maxWidth: "300px",
          fontFamily: "'Press Start 2P', monospace",
          boxShadow: "0 0 20px #0ea5e922",
          animation: "bc-slide-in 0.3s ease forwards",
        }}>
          {/* Header */}
          <div style={{
            fontSize: "6px", color: "#0ea5e9", letterSpacing: "0.12em",
            marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px",
          }}>
            <span style={{ animation: "blink 1s step-end infinite" }}>◉</span>
            INTERCEPTED
          </div>
          {/* From → To */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            marginBottom: "7px",
          }}>
            <span style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: "6px",
              color: "#f472b6", padding: "2px 6px",
              border: "1px solid #f472b633", background: "#1c0535",
            }}>
              {backchannelToast.from.toUpperCase()}
            </span>
            <span style={{ fontSize: "10px", color: "#0ea5e9" }}>→</span>
            <span style={{
              fontFamily: "'Press Start 2P', monospace", fontSize: "6px",
              color: "#f472b6", padding: "2px 6px",
              border: "1px solid #f472b633", background: "#1c0535",
            }}>
              {backchannelToast.to.toUpperCase()}
            </span>
          </div>
          {/* Message */}
          <div style={{
            fontFamily: "'VT323', monospace", fontSize: "15px",
            color: "#94a3b8", lineHeight: "1.4",
            borderLeft: "2px solid #0ea5e944", paddingLeft: "8px",
          }}>
            "{backchannelToast.message}"
          </div>
        </div>
      )}

      {/* ── Ending ── */}
      {worldState.gameOver && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          background: "rgba(5,0,12,0.92)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column",
          fontFamily: "'Press Start 2P', monospace",
        }}>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "repeating-linear-gradient(to bottom,transparent 0,transparent 3px,rgba(0,0,0,0.15) 3px,rgba(0,0,0,0.15) 4px)" }} />
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at center,transparent 40%,rgba(8,2,16,0.85) 100%)" }} />
          <div style={{
            position: "relative", zIndex: 10,
            display: "flex", flexDirection: "column", alignItems: "center", gap: "28px",
            padding: "40px 48px",
            border: worldState.winner ? "2px solid #f472b666" : "2px solid #ff4a6a66",
            background: worldState.winner ? "rgba(20,5,35,0.98)" : "rgba(20,5,10,0.98)",
            boxShadow: worldState.winner ? "0 0 60px #f472b622" : "0 0 60px #ff4a6a22",
            maxWidth: "600px", width: "90%",
          }}>
            <div style={{
              fontSize: "56px",
              animation: "spin 4s linear infinite",
              color: worldState.winner ? "#f472b6" : "#ff4a6a",
              textShadow: worldState.winner ? "0 0 30px #f472b6" : "0 0 30px #ff4a6a",
            }}>
              {worldState.winner ? "★" : "✕"}
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: worldState.winner ? "#f472b6" : "#ff4a6a", letterSpacing: "0.2em" }}>
                {worldState.winner ? "MURDERER KILLED" : "MURDERER STILL ALIVE"}
              </div>
              <div style={{ fontSize: "7px", color: worldState.winner ? "#c084fc" : "#ff8a6a", letterSpacing: "0.12em", marginTop: "6px" }}>
                {worldState.winner ? "THE TRUTH HAS BEEN AVENGED" : "YOU KILLED THE WRONG PERSON"}
              </div>
            </div>
            <div style={{ width: "100%", height: "1px", background: worldState.winner ? "#f472b622" : "#ff4a6a22" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
              {[
                { label: "KILLER", value: worldState.killer.toUpperCase(), color: "#f0e8ff" },
                { label: "MOTIVE", value: worldState.motive, color: "#c084fc" },
                { label: "METHOD", value: worldState.method, color: "#c084fc" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "7px", color: "#6b3080", minWidth: "80px", letterSpacing: "0.1em" }}>{row.label}</span>
                  <span style={{ fontSize: "14px", fontFamily: "'VT323',monospace", color: row.color, lineHeight: "1.4" }}>{row.value}</span>
                </div>
              ))}
            </div>
            {confirmedTruths.length > 0 && (
              <>
                <div style={{ width: "100%", height: "1px", background: worldState.winner ? "#f472b622" : "#ff4a6a22" }} />
                <div style={{ width: "100%" }}>
                  <div style={{ fontFamily: "'Press Start 2P',monospace", fontSize: "7px", color: "#6b3080", marginBottom: "8px" }}>TRUTHS CONFIRMED</div>
                  {confirmedTruths.map((ct, i) => (
                    <div key={i} style={{ fontFamily: "'VT323',monospace", fontSize: "14px", color: "#f472b6", lineHeight: "1.4", marginBottom: "4px" }}>
                      ★ {ct.source}: {ct.truth}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{ width: "100%", height: "1px", background: worldState.winner ? "#f472b622" : "#ff4a6a22" }} />
            <button
              onClick={async () => {
                const newGame = await (await fetch("/api/game")).json();
                setWorldState(newGame);
                setSelectedNPC(null);
                setInput("");
                setMessages(initialMessages);
                setPlayerPos({ x: 530, y: 470 });
                setFacing("right");
              }}
              style={{
                fontFamily: "'Press Start 2P',monospace", fontSize: "8px",
                padding: "12px 24px", background: "transparent",
                border: worldState.winner ? "1px solid #f472b6" : "1px solid #ff4a6a",
                color: worldState.winner ? "#f472b6" : "#ff4a6a",
                cursor: "pointer", letterSpacing: "0.1em",
              }}
            >
              ▶ INVESTIGATE AGAIN
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #100818; }
      `}</style>

      <style jsx>{`
        .shell { width:100vw; height:100vh; display:flex; flex-direction:column; background:#100818; color:#fce7f3; font-family:'VT323',monospace; font-size:17px; overflow:hidden; position:relative; }
        .scanlines { position:fixed; inset:0; z-index:900; pointer-events:none; background:repeating-linear-gradient(to bottom,transparent 0,transparent 3px,rgba(0,0,0,0.13) 3px,rgba(0,0,0,0.13) 4px); }
        .vignette { position:fixed; inset:0; z-index:901; pointer-events:none; background:radial-gradient(ellipse at center,transparent 50%,rgba(8,2,16,0.72) 100%); }

        /* HUD */
        .hud { flex:0 0 38px; height:38px; display:flex; justify-content:space-between; align-items:center; padding:0 14px; background:#0d0514; border-bottom:2px solid #4a1060; gap:10px; overflow:hidden; z-index:10; }
        .hud-left,.hud-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .hud-logo { font-family:'Press Start 2P',monospace; font-size:9px; color:#f472b6; letter-spacing:0.2em; text-shadow:0 0 3px #f472b677; }
        .hud-logo span { color:#e879f9; }
        .hud-sep { width:1px; height:18px; background:#3a1050; }
        .chip { font-family:'Press Start 2P',monospace; font-size:7px; padding:3px 7px; border:1px solid #3a1050; background:#180a22; color:#c084fc; letter-spacing:0.05em; white-space:nowrap; }
        .chip em { color:#f472b6; font-style:normal; margin-left:3px; }
        .chip-icon { margin-right:3px; }
        .chip.dim { color:#6b3080; border-color:#250838; }
        .chip.hot { color:#ff4a6a; border-color:#ff4a6a33; }
        .chip.win { color:#4ade80; border-color:#4ade8033; }
        .chip.lose { color:#f87171; border-color:#f8717133; }
        .chip.deal-chip { color:#f472b6; border-color:#f472b644; background:#1c0535; animation:pulse-deal 2s ease-in-out infinite; }
        @keyframes pulse-deal { 0%,100%{border-color:#f472b644}50%{border-color:#f472b6aa} }
        .key-hint { display:flex; align-items:center; gap:4px; }
       .hud-right span {
  font-size: 13px;
  color: #f472b6;      /* brighter color */
  opacity: 1;          /* remove any fade */
  text-shadow: none;   /* remove glow blur */
}
        kbd { font-family:'Press Start 2P',monospace; font-size:6px; padding:2px 5px; border:1px solid #3a1050; background:#180a22; color:#e879f9; }

        /* Scene */
        .scene-wrap { flex:1 1 0; min-height:0; overflow:hidden; display:flex; position:relative; z-index:1; }
        .scene { position:relative; width:100%; height:100%; overflow:hidden; image-rendering:pixelated; background:#0d0514; }
        .stage-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:fill; image-rendering:pixelated; pointer-events:none; }
        .star-overlay { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
        .sp { position:absolute; color:#f472b6; opacity:0.14; font-size:11px; animation:float-star 8s ease-in-out infinite; }
        .sp0{left:8%;top:15%;} .sp1{left:88%;top:22%;animation-delay:1.5s;font-size:8px;color:#e879f9;} .sp2{left:18%;top:62%;animation-delay:3s;font-size:10px;} .sp3{left:76%;top:58%;animation-delay:4.5s;color:#c084fc;} .sp4{left:50%;top:8%;animation-delay:2s;font-size:9px;color:#e879f9;}
        @keyframes float-star{0%,100%{transform:translateY(0) rotate(0deg);opacity:.14}50%{transform:translateY(-14px) rotate(22deg);opacity:.32}}

        /* Sprites */
        .player,.npc { position:absolute; width:${PLAYER_SIZE}px; height:${PLAYER_SIZE + 48}px; transform:translate(-50%,-100%); background:transparent; border:none; padding:0; }
        .npc { cursor:pointer; }
        .sprite { position:absolute; left:50%; bottom:0; transform:translateX(-50%); width:96px; height:96px; object-fit:contain; image-rendering:pixelated; pointer-events:none; }
        .sprite.lg { width:106px; height:140px; }
        .npc.nearby .sprite { filter:drop-shadow(0 0 8px #f472b6bb) drop-shadow(0 0 3px #ffffff66); }
        .name-tag { position:absolute; bottom:calc(100% + 2px); left:50%; transform:translateX(-50%); font-family:'Press Start 2P',monospace; font-size:6px; color:#f472b6; background:rgba(16,8,24,0.93); padding:3px 7px; border:1px solid #f472b633; white-space:nowrap; pointer-events:none; }
        .deal-indicator { position:absolute; top:-8px; right:-4px; font-size:10px; color:#f472b6; animation:pulse-deal-indicator 1.5s ease-in-out infinite; pointer-events:none; }
        @keyframes pulse-deal-indicator{0%,100%{opacity:0.6;transform:scale(1)}50%{opacity:1;transform:scale(1.2)}}

        /* Talk prompt */
        .talk-prompt { position:fixed; bottom:12px; left:50%; transform:translateX(-50%); display:flex; align-items:center; gap:8px; font-family:'Press Start 2P',monospace; font-size:8px; color:#f472b6; background:rgba(14,4,24,0.96); border:1px solid #f472b633; padding:7px 14px; z-index:50; letter-spacing:0.1em; box-shadow:0 0 18px #f472b611; }
        .deal-badge { color:#f472b6; border:1px solid #f472b644; padding:2px 6px; font-size:6px; background:#1c0535; animation:blink .9s step-end infinite; }
        .blink-star { animation:blink .9s step-end infinite; }
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        /* Notebook */
        .notebook { position:fixed; top:38px; right:0; bottom:0; width:300px; background:rgba(18,6,32,0.99); border-left:2px solid #7c3aed; z-index:60; display:flex; flex-direction:column; overflow:hidden; }
        .nb-head { display:flex; justify-content:space-between; align-items:center; padding:7px 12px; border-bottom:1px solid #4a1060; font-family:'Press Start 2P',monospace; font-size:8px; color:#f472b6; background:#1e0838; flex-shrink:0; }
        .icon-btn { background:none; border:none; cursor:pointer; font-family:'VT323',monospace; font-size:18px; color:#a855f7; padding:0 4px; transition:color .1s; }
        .icon-btn:hover { color:#f472b6; }
        .nb-body { overflow-y:auto; flex:1; padding:12px 14px; scrollbar-width:thin; scrollbar-color:#2a0a38 #0d0514; }
        .nb-section { margin-bottom:12px; }
        .nb-section h4 { font-family:'Press Start 2P',monospace; font-size:7px; color:#e879f9; letter-spacing:.1em; margin-bottom:8px; text-shadow:0 0 8px #e879f944; }
        .nb-hr { height:1px; background:#3a1060; margin:10px 0; }
        .nb-empty { font-size:14px; color:#4a1870; font-style:italic; }

        /* Deal entries in notebook */
        .nb-deal { margin-bottom:10px; padding:8px 10px; border:1px solid; }
        .nb-deal-active { border-color:#f472b644; background:#0e0420; }
        .nb-deal-done { border-color:#2a0a38; background:#0a010e; }
        .nb-deal-source { font-family:'Press Start 2P',monospace; font-size:6px; letter-spacing:0.08em; margin-bottom:5px; }
        .nb-deal-active .nb-deal-source { color:#f472b6; }
        .nb-deal-done .nb-deal-source { color:#3a1050; }
        .nb-deal-task { font-family:'VT323',monospace; font-size:15px; color:#c084fc; line-height:1.4; margin-bottom:5px; }
        .nb-deal-target { font-family:'Press Start 2P',monospace; font-size:6px; color:#6b3080; letter-spacing:0.04em; margin-bottom:6px; }
        .nb-deal-target-name { color:#e879f9; }
        .nb-deal-reward { display:flex; flex-direction:column; gap:2px; padding-top:5px; border-top:1px solid #2a0a38; }
        .nb-deal-reward-label { font-family:'Press Start 2P',monospace; font-size:5px; color:#4a1060; letter-spacing:0.06em; }
        .nb-deal-reward-text { font-family:'VT323',monospace; font-size:14px; color:#7c3aed; line-height:1.3; font-style:italic; }

        /* Confirmed truths */
        .nb-truth { margin-bottom:10px; padding:8px 10px; border:1px solid #f472b633; background:#0e0420; }
        .nb-truth-source { font-family:'Press Start 2P',monospace; font-size:6px; color:#f472b6; margin-bottom:4px; letter-spacing:0.06em; }
        .nb-truth-text { font-family:'VT323',monospace; font-size:16px; color:#f0e8ff; line-height:1.4; }

        /* Scene clues — permanent, drawn from scenario.globalClues */
        .nb-scene-clue { display:flex; gap:6px; align-items:flex-start; margin-bottom:7px; }
        .nb-scene-bullet { color:#f0c070; flex-shrink:0; font-size:14px; line-height:1.4; }
        .nb-scene-text { font-family:'VT323',monospace; font-size:15px; color:#f0c070; line-height:1.4; }

        /* Dialog */
        .dlg-wrap { position:fixed; bottom:0; left:0; right:0; z-index:200; display:flex; flex-direction:column; background:#0e0418; border-top:2px solid #7c3aed; box-shadow:0 -4px 32px rgba(124,58,237,0.2); }

        /* Active deal reminder inside dialog */
        .dlg-deal-reminder { padding:7px 14px; background:#0d0220; border-bottom:1px solid #3a1060; display:flex; flex-direction:column; gap:3px; flex-shrink:0; }
        .dlg-deal-reminder-label { font-family:'Press Start 2P',monospace; font-size:6px; color:#f472b6; letter-spacing:0.1em; }
        .dlg-deal-reminder-task { font-family:'VT323',monospace; font-size:15px; color:#c084fc; line-height:1.3; }
        .dlg-deal-reminder-target { font-family:'Press Start 2P',monospace; font-size:6px; color:#6b3080; letter-spacing:0.04em; }
        .dlg-deal-reminder-target strong { color:#e879f9; }

        .dlg-bar { height:58px; min-height:58px; max-height:58px; display:flex; align-items:center; gap:10px; padding:0 14px; background:#110322; border-bottom:1px solid #2a0a3a; flex-shrink:0; }
        .dlg-portrait { width:38px; height:38px; flex-shrink:0; border:1px solid #6b21a8; background:#0a0116; display:flex; align-items:center; justify-content:center; overflow:hidden; image-rendering:pixelated; }
        .portrait-img { width:34px; height:34px; object-fit:contain; image-rendering:pixelated; }
        .dlg-meta { display:flex; flex-direction:column; gap:1px; min-width:0; }
        .dlg-name { font-family:'Press Start 2P',monospace; font-size:8px; color:#f472b6; letter-spacing:.08em; white-space:nowrap; }
        .dlg-sub { font-size:13px; color:#7c3aed; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .dlg-bars { display:flex; gap:10px; align-items:center; margin-left:8px; }
        .bar-row { display:flex; align-items:center; gap:4px; font-family:'Press Start 2P',monospace; font-size:6px; color:#6b3080; }
        .bar-track { width:64px; height:4px; background:#1a0828; border:1px solid #2a0a3a; }
        .bar-fill { height:100%; transition:width .4s; }
        .bar-fill.trust { background:#f472b6; }
        .bar-fill.susp { background:#fb923c; }
        .bar-val { color:#f0e6ff; font-size:7px; min-width:18px; }
        .dlg-bar-right { margin-left:auto; flex-shrink:0; }

        .dlg-messages { flex:1; min-height:0; overflow-y:auto; overflow-x:hidden; padding:10px 16px; display:flex; flex-direction:column; gap:8px; background:#07010f; scrollbar-width:thin; scrollbar-color:#3a1060 #07010f; }
        .dlg-empty { font-size:15px; color:#3a1060; font-style:italic; }

        .dlg-input-row { height:44px; min-height:44px; max-height:44px; display:flex; align-items:center; gap:8px; padding:0 12px; border-top:1px solid #2a0a3a; background:#0e0418; flex-shrink:0; }
        .dlg-input { flex:1; min-width:0; background:#0a0116; border:1px solid #2a0a3a; color:#f5f0ff; font-family:'VT323',monospace; font-size:20px; padding:4px 10px; outline:none; height:32px; }
        .dlg-input:focus { border-color:#7c3aed; }
        .dlg-input::placeholder { color:#2d0a55; }
        .dlg-input:disabled { opacity:.4; }

        .btn { font-family:'Press Start 2P',monospace; font-size:7px; padding:0 11px; height:32px; background:#110322; border:1px solid #3a1060; color:#a78bfa; cursor:pointer; white-space:nowrap; letter-spacing:.04em; transition:background .1s,color .1s,border-color .1s; }
        .btn:hover:not(:disabled) { background:#1c0935; color:#f472b6; border-color:#7c3aed; }
        .btn:disabled { opacity:.35; cursor:default; }
        .btn.primary { color:#f0abfc; border-color:#7c3aed; }
        .btn.kill { color:#ff4a6a; border-color:#ff4a6a44; }
        .btn.kill:hover:not(:disabled) { background:#1e0810; border-color:#ff4a6a88; }

        .cursor { animation:blink .55s step-end infinite; color:#f472b6; }

        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bc-slide-in{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}

        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#0d0514;}
        ::-webkit-scrollbar-thumb{background:#2a0a38;}
      `}</style>
    </main>
  );
}
