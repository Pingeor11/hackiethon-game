"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NPCName, SuspectName, WorldState } from "@/lib/types";

interface LocalMessage {
  speaker: "user" | "npc";
  text: string;
}

type Facing = "left" | "right";

const SCENE_WIDTH = 1056;
const SCENE_HEIGHT = 584;
const PLAYER_SIZE = 54;
const MOVE_SPEED = 4.5;
const TALK_DISTANCE = 90;

/**
 * Save your uploaded stage image as:
 * public/stage-bg.jpg
 *
 * These bounds define where Aqua can walk on the stage.
 * You can tweak these after testing.
 */
const WALK_MIN_X = 80;
const WALK_MAX_X = 980;
const WALK_MIN_Y = 380;
const WALK_MAX_Y = 505;

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

/**
 * NPC positions on the single stage scene.
 * Adjust after you see them rendered.
 */
const npcPositions: Record<NPCName, { x: number; y: number }> = {
  Director: { x: 250, y: 360 },
  Fan: { x: 800, y: 380 },
  Manager: { x: 165, y: 455 },
  Executive: { x: 900, y: 455 },
  CoIdol: { x: 520, y: 335 },
  Ruby: { x: 635, y: 445 },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function HomePage() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [messages, setMessages] =
    useState<Record<NPCName, LocalMessage[]>>(initialMessages);

  const [playerPos, setPlayerPos] = useState({ x: 530, y: 470 });
  const [facing, setFacing] = useState<Facing>("right");

  const [selectedNPC, setSelectedNPC] = useState<NPCName | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingNPC, setTypingNPC] = useState<NPCName | null>(null);

  const pressedKeys = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
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

    let best: NPCName | null = null;
    let bestDist = Infinity;

    for (const npcName of npcList) {
      const d = distance(playerPos, npcPositions[npcName]);
      if (d <= TALK_DISTANCE && d < bestDist) {
        best = npcName;
        bestDist = d;
      }
    }

    return best;
  }, [worldState, npcList, playerPos]);

  const activeNPC = selectedNPC ? worldState?.npcs[selectedNPC] : null;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typingField =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA";

      if (typingField) {
        if (e.key === "Escape") setSelectedNPC(null);
        return;
      }

      if (
        [
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          "ArrowDown",
          "a",
          "A",
          "d",
          "D",
          "w",
          "W",
          "s",
          "S",
          "e",
          "E",
          "Escape",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }

      if (e.key === "e" || e.key === "E") {
        if (nearbyNPC && !selectedNPC) {
          setSelectedNPC(nearbyNPC);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
        return;
      }

      if (e.key === "Escape") {
        setSelectedNPC(null);
        return;
      }

      pressedKeys.current.add(e.key);
    }

    function handleKeyUp(e: KeyboardEvent) {
      pressedKeys.current.delete(e.key);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [nearbyNPC, selectedNPC]);

  useEffect(() => {
    function tick() {
      if (!selectedNPC && !worldState?.gameOver) {
        setPlayerPos((prev) => {
          let nextX = prev.x;
          let nextY = prev.y;

          if (
            pressedKeys.current.has("ArrowLeft") ||
            pressedKeys.current.has("a") ||
            pressedKeys.current.has("A")
          ) {
            nextX -= MOVE_SPEED;
            setFacing("left");
          }

          if (
            pressedKeys.current.has("ArrowRight") ||
            pressedKeys.current.has("d") ||
            pressedKeys.current.has("D")
          ) {
            nextX += MOVE_SPEED;
            setFacing("right");
          }

          if (
            pressedKeys.current.has("ArrowUp") ||
            pressedKeys.current.has("w") ||
            pressedKeys.current.has("W")
          ) {
            nextY -= MOVE_SPEED;
          }

          if (
            pressedKeys.current.has("ArrowDown") ||
            pressedKeys.current.has("s") ||
            pressedKeys.current.has("S")
          ) {
            nextY += MOVE_SPEED;
          }

          return {
            x: clamp(nextX, WALK_MIN_X, WALK_MAX_X),
            y: clamp(nextY, WALK_MIN_Y, WALK_MAX_Y),
          };
        });
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [selectedNPC, worldState?.gameOver]);

  async function typeNPCMessage(npcName: NPCName, fullText: string) {
    setTypingNPC(npcName);

    setMessages((prev) => ({
      ...prev,
      [npcName]: [...prev[npcName], { speaker: "npc", text: "" }],
    }));

    const words = fullText.split(" ");
    let current = "";

    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? "" : " ") + words[i];

      setMessages((prev) => {
        const arr = [...prev[npcName]];
        arr[arr.length - 1] = { speaker: "npc", text: current };
        return { ...prev, [npcName]: arr };
      });

      await new Promise((r) => setTimeout(r, 24));
    }

    setTypingNPC(null);
  }

  async function sendMessage() {
    if (!worldState || !selectedNPC || !input.trim() || loading || worldState.gameOver) {
      return;
    }

    const playerMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => ({
      ...prev,
      [selectedNPC]: [...prev[selectedNPC], { speaker: "user", text: playerMessage }],
    }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        npcName: selectedNPC,
        playerMessage,
        worldState,
      }),
    });

    const data = await res.json();
    setWorldState(data.updatedWorldState);
    await typeNPCMessage(selectedNPC, data.reply);
    setLoading(false);
  }

  async function askRubyForHelp() {
    if (!worldState || loading || worldState.gameOver) return;

    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

  async function killNPC(npcName: SuspectName) {
  if (!worldState || loading || worldState.gameOver) return;

  setLoading(true);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      npcName,
      kill: npcName,
      playerMessage: "",
      worldState,
    }),
  });

  const data = await res.json();

  if (data.resetGame) {
    const newGameRes = await fetch("/api/game");
    const newGame = await newGameRes.json();

    setWorldState(newGame);
    setSelectedNPC(null);
    setInput("");
    setMessages(initialMessages);
    setPlayerPos({ x: 530, y: 470 });
    setFacing("right");
  } else {
    setWorldState(data.updatedWorldState);
    setSelectedNPC(null);
  }

  setLoading(false);
}

  if (!worldState) {
    return (
      <main style={{ minHeight: "100vh", background: "#08111b", color: "white", padding: 24 }}>
        Loading investigation...
      </main>
    );
  }

  return (
    <main className="game-shell">
      <div className="hud">
        <div className="hud-left">
          <span className="badge">Aqua</span>
          <span className="badge">Main Stage</span>
          <span className="badge">Turn {worldState.turn}</span>
          <span className="badge">Tension {worldState.tension}</span>
          {worldState.gameOver && (
            <span className="badge danger">
              {worldState.winner ? "Solved" : "Failed"}
            </span>
          )}
        </div>

        <div className="hud-right">
          <span>Move: WASD / Arrows</span>
          <span>Talk: E</span>
          <span>Close: Esc</span>
        </div>
      </div>

      <section className="scene">
        <img
          src="/background/stage-bg.jpg"
          alt="Stage background"
          className="stage-image"
          draggable={false}
        />

        {npcList.map((npcName) => {
          const npc = worldState.npcs[npcName];
          const pos = npcPositions[npcName];
          const isNearby = nearbyNPC === npcName;


          return (
            <button
              key={npcName}
              className={`npc-sprite ${isNearby ? "nearby" : ""}`}
              style={{
                left: pos.x,
                top: pos.y,
                zIndex: Math.floor(pos.y),
              }}
              onClick={() => {
                if (distance(playerPos, pos) <= TALK_DISTANCE) {
                  setSelectedNPC(npcName);
                }
              }}
            >
              <img
  src={npcSpriteMap[npcName]}
  alt={npcName}
  className={`character-sprite ${
    npcName === "Director" ||
    npcName === "Manager" ||
    npcName === "Executive"
      ? "big-sprite"
      : ""
  }`}
  draggable={false}
/>


            </button>
          );
        })}

        <div
          className={`player ${facing}`}
          style={{
            left: playerPos.x,
            top: playerPos.y,
            zIndex: Math.floor(playerPos.y),
          }}
        >
          <img
  src={facing === "left" ? aquaSprites.left : aquaSprites.right}
  alt="Aqua"
  className="character-sprite"
  draggable={false}
/>
 
        </div>
      </section>

      <section className="notebook-panel">
        <h3>Notebook</h3>

        <div className="notebook-grid">
          <div>
            <h4>Clues</h4>
            {worldState.cluesDiscovered.length === 0 ? (
              <p className="muted">No confirmed clues yet.</p>
            ) : (
              <ul>
                {worldState.cluesDiscovered.map((clue, i) => (
                  <li key={i}>{clue}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4>Contradictions</h4>
            {worldState.contradictionsFound.length === 0 ? (
              <p className="muted">No contradictions recorded yet.</p>
            ) : (
              <ul>
                {worldState.contradictionsFound.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4>Recent Log</h4>
            <ul>
              {worldState.investigationLog.slice(-6).map((entry, i) => (
                <li key={i}>{entry}</li>
              ))}
            </ul>
          </div>

          {selectedNPC && activeNPC && (
            <div>
              <h4>{selectedNPC}</h4>
              <p className="muted">{activeNPC.role}</p>
              <p className="muted">Mood: {activeNPC.mood}</p>
              <p className="muted">
                Trust {activeNPC.trustPlayer.toFixed(2)} · Suspicion{" "}
                {activeNPC.suspicionPlayer.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </section>

      {nearbyNPC && !selectedNPC && !worldState.gameOver && (
        <div className="talk-prompt">
          Press <strong>E</strong> to talk to {nearbyNPC}
        </div>
      )}

      {selectedNPC && activeNPC && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <div className="dialog-header">
              <div>
                <h2>{selectedNPC}</h2>
                <p className="muted">{activeNPC.role}</p>
                <p className="muted">{activeNPC.publicFace}</p>
              </div>

              <button className="close-btn" onClick={() => setSelectedNPC(null)}>
                Close
              </button>
            </div>

            <div className="chat-log">
              {messages[selectedNPC].length === 0 && (
                <div className="muted">
                  {selectedNPC === "Ruby"
                    ? "Ruby helps summarize clues, contradictions, and next steps."
                    : "Ask about timeline, motive, relationships, or inconsistencies."}
                </div>
              )}

              {messages[selectedNPC].map((m, i) => (
                <div key={i} className={`msg ${m.speaker}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="controls">
              <input
                ref={inputRef}
                className="input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={
                  selectedNPC === "Ruby"
                    ? "Ask Ruby to summarize the case..."
                    : "Ask a sharp question..."
                }
                disabled={loading || worldState.gameOver || typingNPC === selectedNPC}
              />

              <button
                className="action-button"
                onClick={sendMessage}
                disabled={loading || worldState.gameOver || typingNPC === selectedNPC}
              >
                {loading || typingNPC === selectedNPC ? "..." : "Send"}
              </button>

              {selectedNPC === "Ruby" && (
                <button
                  className="action-button"
                  onClick={askRubyForHelp}
                  disabled={loading || worldState.gameOver || typingNPC === "Ruby"}
                >
                  Summarize
                </button>
              )}

              {activeNPC.isKillerCandidate &&
                worldState.accusationUnlocked &&
                !worldState.gameOver && (
<button
  className="action-button kill-button"
  onClick={() => killNPC(selectedNPC as SuspectName)}
  disabled={loading || typingNPC === selectedNPC}
>
  Kill
</button>
                )}
            </div>
          </div>
        </div>
      )}

      {worldState.gameOver && (
        <div className="ending-banner">
          {worldState.winner
            ? `Aqua solved Ai's murder. ${worldState.killer} was responsible.`
            : `The accusation failed. The real killer was ${worldState.killer}.`}{" "}
          Motive: {worldState.motive}. Method: {worldState.method}.
        </div>
      )}

      <style jsx>{`
        .game-shell {
          min-height: 100vh;
          background: #08111b;
          color: #f8fafc;
          font-family: Arial, sans-serif;
          padding-bottom: 18px;
        }

        .hud {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          background: rgba(7, 16, 26, 0.98);
          border-bottom: 2px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .hud-left,
        .hud-right {
          display: flex;
          gap: 8px 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: #132235;
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 13px;
        }

        .badge.danger {
          background: #4b1111;
        }

        .scene {
          position: relative;
          width: min(100%, ${SCENE_WIDTH}px);
          height: auto;
          aspect-ratio: ${SCENE_WIDTH} / ${SCENE_HEIGHT};
          margin: 18px auto 0;
          overflow: hidden;
          border: 3px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          image-rendering: pixelated;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
          background: #111827;
          user-select: none;
        }

        .stage-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          pointer-events: none;
          user-select: none;
        }

        .player,
        .npc-sprite {
          position: absolute;
          width: ${PLAYER_SIZE}px;
          height: ${PLAYER_SIZE + 48}px;
          transform: translate(-50%, -100%);
          background: transparent;
          border: none;
          padding: 0;
        }


        .npc-sprite {
          cursor: pointer;
        }
        .character-sprite {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 72px;
  height: 72px;
  object-fit: contain;
  image-rendering: pixelated;
  pointer-events: none;
  user-select: none;
}
        .big-sprite {
  width: 78px;
  height: 96px;
}




        .npc-sprite.nearby .character-sprite {
  filter: drop-shadow(0 0 8px rgba(253, 230, 138, 0.9));
}

        .danger-mark {
          position: absolute;
          right: -4px;
          top: 8px;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 12px;
        }

        .notebook-panel {
          width: min(100%, ${SCENE_WIDTH}px);
          margin: 18px auto 0;
          background: rgba(10, 18, 30, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          padding: 18px;
        }

        .notebook-panel h3 {
          margin: 0 0 14px;
        }

        .notebook-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .notebook-grid h4 {
          margin: 0 0 8px;
        }

        .notebook-grid ul {
          margin: 0;
          padding-left: 18px;
          color: #e2e8f0;
        }

        .muted {
          color: #cbd5e1;
        }

        .talk-prompt {
          position: fixed;
          left: 50%;
          bottom: 24px;
          transform: translateX(-50%);
          background: rgba(7, 16, 26, 0.96);
          color: white;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          z-index: 30;
        }

        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.58);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 16px;
          z-index: 40;
        }

        .dialog-box {
          width: min(100%, 1100px);
          background: rgba(10, 18, 30, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.45);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .dialog-header h2 {
          margin: 0 0 6px;
        }

        .close-btn {
          background: #1f2937;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
        }

        .chat-log {
          min-height: 220px;
          max-height: 320px;
          overflow-y: auto;
          background: rgba(2, 6, 23, 0.45);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 12px;
        }

        .msg {
          max-width: 72%;
          padding: 10px 12px;
          border-radius: 14px;
          line-height: 1.45;
          font-size: 14px;
        }

        .msg.user {
          align-self: flex-end;
          background: #1d4ed8;
        }

        .msg.npc {
          align-self: flex-start;
          background: #1f2937;
        }

        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .input {
          flex: 1;
          min-width: 260px;
          background: #0f172a;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 12px 14px;
          outline: none;
        }

        .action-button {
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 14px;
          cursor: pointer;
          font-weight: 700;
        }

        .kill-button {
  background: #991b1b;
}

        .ending-banner {
          width: min(100%, ${SCENE_WIDTH}px);
          margin: 18px auto 0;
          padding: 16px 18px;
          background: #3b0f0f;
          color: #fee2e2;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-weight: 700;
        }

        @media (max-width: 900px) {
          .notebook-grid {
            grid-template-columns: 1fr;
          }

          .hud {
            position: static;
          }
        }
      `}</style>
    </main>
  );
}