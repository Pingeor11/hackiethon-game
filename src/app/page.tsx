"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NPCName, SuspectName, WorldState } from "@/lib/types";

interface LocalMessage {
  speaker: "user" | "npc";
  text: string;
}

type Pos = { x: number; y: number };

const TILE = 72;
const MAP_W = 10;
const MAP_H = 7;

const initialMessages: Record<NPCName, LocalMessage[]> = {
  Manager: [],
  CoIdol: [],
  Director: [],
  Fan: [],
  Executive: [],
  Ruby: [],
};

const npcPositions: Record<NPCName, Pos> = {
  Manager: { x: 2, y: 1 },
  CoIdol: { x: 7, y: 1 },
  Director: { x: 2, y: 5 },
  Fan: { x: 7, y: 5 },
  Executive: { x: 5, y: 2 },
  Ruby: { x: 5, y: 5 },
};

const roomLabels = [
  { label: "Studio", x: 0, y: 0, w: 4, h: 2 },
  { label: "Hall", x: 4, y: 0, w: 2, h: 2 },
  { label: "Office", x: 6, y: 0, w: 4, h: 2 },
  { label: "Stage", x: 0, y: 2, w: 10, h: 3 },
  { label: "Backstage", x: 0, y: 5, w: 5, h: 2 },
  { label: "Dressing", x: 5, y: 5, w: 5, h: 2 },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function distance(a: Pos, b: Pos) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export default function HomePage() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [messages, setMessages] = useState<Record<NPCName, LocalMessage[]>>(initialMessages);
  const [loading, setLoading] = useState(false);

  const [playerPos, setPlayerPos] = useState<Pos>({ x: 5, y: 3 });
  const [facing, setFacing] = useState<"up" | "down" | "left" | "right">("down");

  const [activeNPC, setActiveNPC] = useState<NPCName | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/game")
      .then((r) => r.json())
      .then((data) => setWorldState(data));
  }, []);

  const npcList = useMemo(() => {
    if (!worldState) return [] as NPCName[];
    return Object.keys(worldState.npcs) as NPCName[];
  }, [worldState]);

  const nearbyNPC = useMemo(() => {
    if (!worldState) return null;

    for (const npcName of npcList) {
      const d = distance(playerPos, npcPositions[npcName]);
      if (d <= 1) return npcName;
    }
    return null;
  }, [worldState, npcList, playerPos]);

  const activeNPCData = activeNPC ? worldState?.npcs[activeNPC] : null;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const typingInField = tag === "INPUT" || tag === "TEXTAREA";

      if (typingInField) {
        if (e.key === "Escape") {
          setActiveNPC(null);
        }
        return;
      }

      if (!worldState || worldState.gameOver) return;

      if (e.key === "e" || e.key === "E") {
        if (nearbyNPC) {
          setActiveNPC(nearbyNPC);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }

      if (e.key === "Escape") {
        setActiveNPC(null);
        return;
      }

      if (activeNPC) return;

      if (e.key === "ArrowUp" || e.key.toLowerCase() === "w") {
        setFacing("up");
        setPlayerPos((p) => ({ x: p.x, y: clamp(p.y - 1, 0, MAP_H - 1) }));
      } else if (e.key === "ArrowDown" || e.key.toLowerCase() === "s") {
        setFacing("down");
        setPlayerPos((p) => ({ x: p.x, y: clamp(p.y + 1, 0, MAP_H - 1) }));
      } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        setFacing("left");
        setPlayerPos((p) => ({ x: clamp(p.x - 1, 0, MAP_W - 1), y: p.y }));
      } else if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        setFacing("right");
        setPlayerPos((p) => ({ x: clamp(p.x + 1, 0, MAP_W - 1), y: p.y }));
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [worldState, nearbyNPC, activeNPC]);

  async function typeNPCMessage(npcName: NPCName, fullText: string) {
    setIsTyping(true);

    setMessages((prev) => ({
      ...prev,
      [npcName]: [...prev[npcName], { speaker: "npc", text: "" }],
    }));

    const chunks = fullText.split(" ");
    let current = "";

    for (let i = 0; i < chunks.length; i++) {
      current += (i === 0 ? "" : " ") + chunks[i];

      setMessages((prev) => {
        const arr = [...prev[npcName]];
        arr[arr.length - 1] = { speaker: "npc", text: current };
        return { ...prev, [npcName]: arr };
      });

      await new Promise((r) => setTimeout(r, 28));
    }

    setIsTyping(false);
  }

  async function sendMessage() {
    if (!worldState || !activeNPC || !input.trim() || loading || worldState.gameOver) return;

    const playerMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => ({
      ...prev,
      [activeNPC]: [...prev[activeNPC], { speaker: "user", text: playerMessage }],
    }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npcName: activeNPC,
        playerMessage,
        worldState,
      }),
    });

    const data = await res.json();

    setWorldState(data.updatedWorldState);
    await typeNPCMessage(activeNPC, data.reply);

    setLoading(false);
  }

  async function askRubyForHelp() {
    if (!worldState || loading || worldState.gameOver) return;

    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npcName: "Ruby",
        playerMessage: "Help me summarize the case.",
        rubyHelp: true,
        worldState,
      }),
    });

    const data = await res.json();
    await typeNPCMessage("Ruby", data.reply);

    setLoading(false);
  }

  async function accuse(npcName: SuspectName) {
    if (!worldState || loading || worldState.gameOver || !worldState.accusationUnlocked) return;

    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npcName,
        accuse: npcName,
        playerMessage: "",
        worldState,
      }),
    });

    const data = await res.json();
    setWorldState(data.updatedWorldState);
    setLoading(false);
    setActiveNPC(null);
  }

  if (!worldState) {
    return <main style={{ padding: 24, color: "white" }}>Loading investigation...</main>;
  }

  return (
    <main style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topLeft}>
          <span style={styles.badge}>You are {worldState.playableCharacter}</span>
          <span style={styles.badge}>Turn {worldState.turn}</span>
          <span style={styles.badge}>Tension {worldState.tension}</span>
          {worldState.gameOver && (
            <span style={styles.badge}>{worldState.winner ? "Solved" : "Failed"}</span>
          )}
        </div>
        <div style={styles.topRight}>
          <span style={styles.hint}>Move: WASD / Arrows</span>
          <span style={styles.hint}>Talk: E</span>
          <span style={styles.hint}>Close: Esc</span>
        </div>
      </div>

      <div style={styles.gameLayout}>
        <section style={styles.mapPanel}>
          <div
            style={{
              ...styles.map,
              width: MAP_W * TILE,
              height: MAP_H * TILE,
            }}
          >
            {roomLabels.map((room) => (
              <div
                key={room.label}
                style={{
                  ...styles.roomBox,
                  left: room.x * TILE,
                  top: room.y * TILE,
                  width: room.w * TILE,
                  height: room.h * TILE,
                }}
              >
                <span style={styles.roomLabel}>{room.label}</span>
              </div>
            ))}

            {npcList.map((npcName) => {
              const npc = worldState.npcs[npcName];
              const pos = npcPositions[npcName];
              const canAccuse =
                npc.isKillerCandidate && worldState.accusationUnlocked && !worldState.gameOver;
              const isNearby = nearbyNPC === npcName;

              return (
                <div
                  key={npcName}
                  style={{
                    ...styles.actor,
                    left: pos.x * TILE + 10,
                    top: pos.y * TILE + 8,
                    border: activeNPC === npcName ? "3px solid #fde68a" : "2px solid #ffffff22",
                    boxShadow: isNearby ? "0 0 0 4px rgba(253,230,138,0.18)" : "none",
                  }}
                  onClick={() => {
                    if (distance(playerPos, pos) <= 1) setActiveNPC(npcName);
                  }}
                >
                  <div style={styles.npcSprite}>{npcName === "Ruby" ? "💎" : "🧍"}</div>
                  <div style={styles.actorLabel}>{npcName}</div>
                  <div style={styles.actorSub}>{npc.role}</div>
                  {canAccuse && <div style={styles.accuseMarker}>!</div>}
                </div>
              );
            })}

            <div
              style={{
                ...styles.actor,
                left: playerPos.x * TILE + 10,
                top: playerPos.y * TILE + 8,
                border: "3px solid #7dd3fc",
                boxShadow: "0 0 0 4px rgba(125,211,252,0.18)",
              }}
            >
              <div style={styles.playerSprite}>
                {facing === "up" ? "🔷" : facing === "down" ? "🔹" : facing === "left" ? "◀" : "▶"}
              </div>
              <div style={styles.actorLabel}>Aqua</div>
              <div style={styles.actorSub}>Detective</div>
            </div>

            {nearbyNPC && !activeNPC && !worldState.gameOver && (
              <div
                style={{
                  ...styles.promptBubble,
                  left: npcPositions[nearbyNPC].x * TILE - 10,
                  top: npcPositions[nearbyNPC].y * TILE - 28,
                }}
              >
                Press E to talk to {nearbyNPC}
              </div>
            )}
          </div>

          <div style={styles.mapLegend}>
            <div>Walk up to a character, then press <strong>E</strong>.</div>
            <div>Click a nearby character to open dialogue too.</div>
          </div>
        </section>

        <aside style={styles.rightPanel}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Notebook</h3>

            <div style={styles.section}>
              <strong>Discovered clues</strong>
              {worldState.cluesDiscovered.length === 0 ? (
                <p style={styles.muted}>No confirmed clues yet.</p>
              ) : (
                <ul style={styles.list}>
                  {worldState.cluesDiscovered.map((clue, i) => (
                    <li key={i}>{clue}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.section}>
              <strong>Contradictions</strong>
              {worldState.contradictionsFound.length === 0 ? (
                <p style={styles.muted}>No contradictions recorded yet.</p>
              ) : (
                <ul style={styles.list}>
                  {worldState.contradictionsFound.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={styles.section}>
              <strong>Recent log</strong>
              <ul style={styles.list}>
                {worldState.investigationLog.slice(-8).map((entry, i) => (
                  <li key={i}>{entry}</li>
                ))}
              </ul>
            </div>

            {worldState.gameOver && (
              <div style={styles.section}>
                <strong>Ending</strong>
                <p style={styles.muted}>
                  {worldState.winner
                    ? `Aqua solved Ai's murder. ${worldState.killer} was responsible.`
                    : `The accusation failed. The real killer was ${worldState.killer}.`}
                </p>
                <p style={styles.muted}>Motive: {worldState.motive}</p>
                <p style={styles.muted}>Method: {worldState.method}</p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {activeNPC && activeNPCData && (
        <div style={styles.dialogueOverlay}>
          <div style={styles.dialogueBox}>
            <div style={styles.dialogueHeader}>
              <div>
                <div style={styles.dialogueName}>{activeNPC}</div>
                <div style={styles.muted}>
                  {activeNPCData.role} · Mood: {activeNPCData.mood}
                </div>
                <div style={styles.muted}>
                  Trust {activeNPCData.trustPlayer.toFixed(2)} · Suspicion{" "}
                  {activeNPCData.suspicionPlayer.toFixed(2)}
                </div>
              </div>

              <button style={styles.closeBtn} onClick={() => setActiveNPC(null)}>
                Close
              </button>
            </div>

            <div style={styles.publicFace}>{activeNPCData.publicFace}</div>

            <div style={styles.chatLog}>
              {messages[activeNPC].length === 0 && (
                <div style={styles.muted}>
                  {activeNPC === "Ruby"
                    ? "Ruby helps summarize evidence, contradictions, and next steps."
                    : "Ask about timeline, motive, relationships, or inconsistencies."}
                </div>
              )}

              {messages[activeNPC].map((m, i) => (
                <div
                  key={i}
                  style={{
                    ...styles.msg,
                    alignSelf: m.speaker === "user" ? "flex-end" : "flex-start",
                    background: m.speaker === "user" ? "#1d4ed8" : "#1f2937",
                  }}
                >
                  {m.text}
                </div>
              ))}
            </div>

            {activeNPCData.rumorsHeard.length > 0 && (
              <div style={styles.rumorStrip}>
                <strong>Rumors:</strong> {activeNPCData.rumorsHeard.slice(-3).join(" • ")}
              </div>
            )}

            <div style={styles.inputRow}>
              <input
                ref={inputRef}
                style={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={
                  activeNPC === "Ruby"
                    ? "Ask Ruby to help organize the case..."
                    : "Where were you last night? Who argued with Ai? Your timeline doesn't make sense."
                }
                disabled={loading || worldState.gameOver || isTyping}
              />

              <button
                style={styles.button}
                onClick={sendMessage}
                disabled={loading || worldState.gameOver || isTyping}
              >
                {loading || isTyping ? "..." : "Send"}
              </button>

              {activeNPC === "Ruby" && (
                <button
                  style={styles.button}
                  onClick={askRubyForHelp}
                  disabled={loading || worldState.gameOver || isTyping}
                >
                  Summarize
                </button>
              )}

              {activeNPCData.isKillerCandidate &&
                worldState.accusationUnlocked &&
                !worldState.gameOver && (
                  <button
                    style={{ ...styles.button, background: "#7f1d1d" }}
                    onClick={() => accuse(activeNPC as SuspectName)}
                    disabled={loading || isTyping}
                  >
                    Accuse
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #1f2a44 0%, #0f172a 45%, #020617 100%)",
    color: "white",
    padding: 20,
    fontFamily: "Arial, sans-serif",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  topLeft: { display: "flex", gap: 8, flexWrap: "wrap" },
  topRight: { display: "flex", gap: 12, flexWrap: "wrap", opacity: 0.85 },
  badge: {
    background: "#172554",
    border: "1px solid #60a5fa33",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 14,
  },
  hint: { fontSize: 14 },
  gameLayout: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: 16,
    alignItems: "start",
  },
  mapPanel: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
    overflow: "auto",
  },
  map: {
    position: "relative",
    margin: "0 auto",
    background:
      "linear-gradient(180deg, rgba(51,65,85,0.95), rgba(30,41,59,0.98))",
    borderRadius: 20,
    border: "2px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  roomBox: {
    position: "absolute",
    border: "1px solid rgba(255,255,255,0.06)",
    boxSizing: "border-box",
  },
  roomLabel: {
    position: "absolute",
    top: 8,
    left: 10,
    fontSize: 12,
    color: "#cbd5e1",
    letterSpacing: 0.5,
  },
  actor: {
    position: "absolute",
    width: 52,
    minHeight: 52,
    borderRadius: 16,
    background: "rgba(15,23,42,0.9)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    textAlign: "center",
    boxSizing: "border-box",
  },
  npcSprite: { fontSize: 22, marginBottom: 2 },
  playerSprite: { fontSize: 20, marginBottom: 2 },
  actorLabel: { fontWeight: 700, fontSize: 11, lineHeight: 1.1 },
  actorSub: { fontSize: 9, opacity: 0.7, lineHeight: 1.1 },
  accuseMarker: {
    position: "absolute",
    top: -8,
    right: -6,
    background: "#dc2626",
    color: "white",
    width: 20,
    height: 20,
    borderRadius: 999,
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },
  promptBubble: {
    position: "absolute",
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "white",
    padding: "8px 10px",
    borderRadius: 10,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  mapLegend: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    color: "#cbd5e1",
    fontSize: 13,
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: { margin: "0 0 12px 0" },
  section: { marginBottom: 16 },
  muted: { color: "#cbd5e1", fontSize: 14 },
  list: {
    margin: "8px 0 0 18px",
    padding: 0,
    color: "#e2e8f0",
    fontSize: 14,
  },
  dialogueOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.55)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    padding: 16,
  },
  dialogueBox: {
    width: "min(1100px, 100%)",
    background: "rgba(15,23,42,0.96)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
  },
  dialogueHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 10,
  },
  dialogueName: {
    fontSize: 24,
    fontWeight: 800,
  },
  closeBtn: {
    background: "#1f2937",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    cursor: "pointer",
  },
  publicFace: {
    color: "#dbeafe",
    marginBottom: 12,
    fontSize: 14,
  },
  chatLog: {
    minHeight: 220,
    maxHeight: 320,
    overflowY: "auto",
    background: "rgba(2,6,23,0.45)",
    borderRadius: 16,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 12,
  },
  msg: {
    maxWidth: "72%",
    padding: "10px 12px",
    borderRadius: 14,
    lineHeight: 1.45,
    fontSize: 14,
  },
  rumorStrip: {
    marginBottom: 12,
    fontSize: 13,
    color: "#fde68a",
  },
  inputRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: 260,
    background: "#0f172a",
    color: "white",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "12px 14px",
    outline: "none",
  },
  button: {
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "12px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
};