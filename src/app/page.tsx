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
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export default function HomePage() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [messages, setMessages] = useState<Record<NPCName, LocalMessage[]>>(initialMessages);
  const [playerPos, setPlayerPos] = useState({ x: 530, y: 470 });
  const [facing, setFacing] = useState<Facing>("right");
  const [selectedNPC, setSelectedNPC] = useState<NPCName | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingNPC, setTypingNPC] = useState<NPCName | null>(null);
  const [notebookOpen, setNotebookOpen] = useState(false);

  const sceneRef = useRef<HTMLDivElement | null>(null);
  const [sceneRect, setSceneRect] = useState({ width: SCENE_WIDTH, height: SCENE_HEIGHT });
  const pressedKeys = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch("/api/game").then((r) => r.json()).then(setWorldState);
  }, []);

  // auto-scroll chat to bottom whenever messages change
  useEffect(() => {
    const el = chatLogRef.current;
    if (!el) return;
    // requestAnimationFrame ensures DOM has painted before we scroll
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
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
      if (e.key === "e" || e.key === "E") { if (nearbyNPC && !selectedNPC) { setSelectedNPC(nearbyNPC); setTimeout(() => inputRef.current?.focus(), 0); } return; }
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
      setMessages(prev => { const arr = [...prev[npcName]]; arr[arr.length - 1] = { speaker: "npc", text: current }; return { ...prev, [npcName]: arr }; });
      await new Promise(r => setTimeout(r, 24));
    }
    setTypingNPC(null);
  }

  async function sendMessage() {
    if (!worldState || !selectedNPC || !input.trim() || loading || worldState.gameOver) return;
    const msg = input.trim(); setInput(""); setLoading(true);
    setMessages(prev => ({ ...prev, [selectedNPC]: [...prev[selectedNPC], { speaker: "user", text: msg }] }));
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ npcName: selectedNPC, playerMessage: msg, worldState }) });
    const data = await res.json();
    setWorldState(data.updatedWorldState);
    await typeNPCMessage(selectedNPC, data.reply);
    setLoading(false);
  }

  async function askRubyForHelp() {
    if (!worldState || loading || worldState.gameOver) return;
    setLoading(true);
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ npcName: "Ruby", playerMessage: "Help me summarize the case.", rubyHelp: true, worldState }) });
    const data = await res.json();
    await typeNPCMessage("Ruby", data.reply);
    setLoading(false);
  }

  async function killNPC(npcName: SuspectName) {
    if (!worldState || loading || worldState.gameOver) return;
    setLoading(true);
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ npcName, kill: npcName, playerMessage: "", worldState }) });
    const data = await res.json();
    if (data.resetGame) {
      const newGame = await (await fetch("/api/game")).json();
      setWorldState(newGame); setSelectedNPC(null); setInput(""); setMessages(initialMessages); setPlayerPos({ x: 530, y: 470 }); setFacing("right");
    } else { setWorldState(data.updatedWorldState); setSelectedNPC(null); }
    setLoading(false);
  }

  if (!worldState) return (
    <main className="loading-screen">
      <div className="loading-inner">
        <div className="star-spin">★</div>
        <p>LOADING INVESTIGATION</p>
        <div className="dots"><span>.</span><span>.</span><span>.</span></div>
      </div>
      <style jsx global>{`
        html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#100818;}
      `}</style>
      <style jsx>{`
        .loading-screen{width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;background:#100818;font-family:'Press Start 2P',monospace;}
        .loading-inner{text-align:center;display:flex;flex-direction:column;align-items:center;gap:16px;}
        .star-spin{font-size:40px;color:#f472b6;animation:spin 2s linear infinite;text-shadow:0 0 20px #f472b6aa;}
        p{font-size:10px;letter-spacing:0.14em;color:#e879f9;}
        .dots{display:flex;gap:4px;font-size:20px;color:#f472b6;}
        .dots span{animation:blink 1.2s step-end infinite;}
        .dots span:nth-child(2){animation-delay:.4s;}
        .dots span:nth-child(3){animation-delay:.8s;}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      `}</style>
    </main>
  );

  return (
    <main className="shell">
      <div className="scanlines" aria-hidden />
      <div className="vignette" aria-hidden />

      {/* ── HUD ── */}
      <header className="hud">
        <div className="hud-left">
          <div className="hud-logo">✦ OSH<span>I</span></div>
          <div className="hud-sep" />
          <span className="chip"><span className="chip-icon">♡</span>AQUA</span>
          <span className="chip dim">MAIN STAGE</span>
          <span className="chip">TRN <em>{worldState.turn}</em></span>
          <span className={`chip ${worldState.tension >= 7 ? "hot" : ""}`}>TNS <em>{worldState.tension}</em></span>
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

      {/* ── Scene fills remaining height ── */}
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
            return (
              <button
                key={npcName}
                className={`npc ${isNearby ? "nearby" : ""}`}
                style={{ left: pos.x * scaleX, top: pos.y * scaleY, zIndex: Math.floor(pos.y) }}
                onClick={() => { if (distance(playerPos, pos) <= TALK_DISTANCE) setSelectedNPC(npcName); }}
              >
                <img src={npcSpriteMap[npcName]} alt={npcName} className={`sprite ${isLarge ? "lg" : ""}`} draggable={false} />
                {isNearby && <div className="name-tag">▲ {npcName}</div>}
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
          <span className="blink-star">★</span>
        </div>
      )}

      {/* ── Notebook sidebar ── */}
      {notebookOpen && (
        <aside className="notebook" onClick={e => e.stopPropagation()}>
          <div className="nb-head">
            <span>✦ NOTEBOOK</span>
            <button className="icon-btn" onClick={() => setNotebookOpen(false)}>✕</button>
          </div>
          <div className="nb-body">
            <div className="nb-section">
              <h4>▸ CLUES</h4>
              {worldState.cluesDiscovered.length === 0
                ? <p className="nb-empty">— no clues yet —</p>
                : worldState.cluesDiscovered.map((c, i) => <p key={i} className="nb-entry">◆ {c}</p>)}
            </div>
            <div className="nb-hr" />
            <div className="nb-section">
              <h4>▸ CONTRADICTIONS</h4>
              {worldState.contradictionsFound.length === 0
                ? <p className="nb-empty">— none recorded —</p>
                : worldState.contradictionsFound.map((c, i) => <p key={i} className="nb-entry">◆ {c}</p>)}
            </div>
            <div className="nb-hr" />
            <div className="nb-section">
              <h4>▸ LOG</h4>
              {worldState.investigationLog.slice(-6).map((e, i) => <p key={i} className="nb-entry log">· {e}</p>)}
            </div>
          </div>
        </aside>
      )}

      {/* ── Dialog box ── */}
      {selectedNPC && activeNPC && (
        <div className="dlg-wrap">
          {/* NPC info bar */}
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

          {/* Messages */}
          <div className="dlg-messages" ref={chatLogRef}>
            {messages[selectedNPC].length === 0 && (
              <p className="dlg-empty">
                {selectedNPC === "Ruby"
                  ? "✦ Ruby can summarize clues and suggest next steps."
                  : `✦ Ask ${selectedNPC} about their alibi, motive, or relationships.`}
              </p>
            )}
            {messages[selectedNPC].map((m, i) => (
              <div key={i} style={{
                display: "flex",
                width: "100%",
                justifyContent: m.speaker === "user" ? "flex-end" : "flex-start",
                flexShrink: 0,
              }}>
                <div style={{
                  maxWidth: "62%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}>
                  <div style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "6px",
                    letterSpacing: ".04em",
                    padding: "0 2px",
                    color: m.speaker === "user" ? "#4338ca" : "#6b21a8",
                    textAlign: m.speaker === "user" ? "right" : "left",
                  }}>
                    {m.speaker === "user" ? "YOU" : selectedNPC.toUpperCase()}
                  </div>
                  <div style={{
                    fontFamily: "'VT323', monospace",
                    fontSize: "19px",
                    lineHeight: "1.4",
                    padding: "6px 10px",
                    wordBreak: "break-word",
                    overflowWrap: "anywhere",
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
            ))}
          </div>

          {/* Input */}
          <div className="dlg-input-row">
            <input
              ref={inputRef}
              className="dlg-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={selectedNPC === "Ruby" ? "Ask Ruby for insight..." : "Ask a question..."}
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

      {/* ── Ending ── */}
      {worldState.gameOver && (
        <div className={`ending ${worldState.winner ? "win" : "lose"}`}>
          <div className="ending-star">{worldState.winner ? "★" : "✕"}</div>
          <p className="ending-title">{worldState.winner ? "CASE CLOSED" : "INVESTIGATION FAILED"}</p>
          <p className="ending-body">
            {worldState.winner ? `${worldState.killer} was responsible.` : `The real killer was ${worldState.killer}.`}
          </p>
          <p className="ending-sub">MOTIVE: {worldState.motive.toUpperCase()} · METHOD: {worldState.method.toUpperCase()}</p>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #100818; }
      `}</style>

      <style jsx>{`
        .shell {
          width: 100vw; height: 100vh;
          display: flex; flex-direction: column;
          background: #100818; color: #fce7f3;
          font-family: 'VT323', monospace; font-size: 17px;
          overflow: hidden; position: relative;
        }

        /* CRT */
        .scanlines {
          position: fixed; inset: 0; z-index: 900; pointer-events: none;
          background: repeating-linear-gradient(to bottom, transparent 0, transparent 3px, rgba(0,0,0,0.13) 3px, rgba(0,0,0,0.13) 4px);
        }
        .vignette {
          position: fixed; inset: 0; z-index: 901; pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 50%, rgba(8,2,16,0.72) 100%);
        }

        /* HUD */
        .hud {
          flex: 0 0 38px; height: 38px;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 14px; background: #0d0514;
          border-bottom: 2px solid #4a1060;
          gap: 10px; overflow: hidden; z-index: 10;
        }
        .hud-left, .hud-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .hud-logo {
          font-family: 'Press Start 2P', monospace; font-size: 9px;
          color: #f472b6; letter-spacing: 0.2em;
          text-shadow: 0 0 12px #f472b677; flex-shrink: 0;
        }
        .hud-logo span { color: #e879f9; }
        .hud-sep { width: 1px; height: 18px; background: #3a1050; flex-shrink: 0; }
        .chip {
          font-family: 'Press Start 2P', monospace; font-size: 7px;
          padding: 3px 7px; border: 1px solid #3a1050;
          background: #180a22; color: #c084fc;
          letter-spacing: 0.05em; white-space: nowrap;
        }
        .chip em { color: #f472b6; font-style: normal; margin-left: 3px; }
        .chip-icon { margin-right: 3px; }
        .chip.dim { color: #6b3080; border-color: #250838; }
        .chip.hot { color: #ff4a6a; border-color: #ff4a6a33; }
        .chip.win { color: #4ade80; border-color: #4ade8033; }
        .chip.lose { color: #f87171; border-color: #f8717133; }
        .key-hint { display: flex; align-items: center; gap: 4px; }
        .hud-right span { font-size: 13px; color: #5a2870; }
        kbd {
          font-family: 'Press Start 2P', monospace; font-size: 6px;
          padding: 2px 5px; border: 1px solid #3a1050;
          background: #180a22; color: #e879f9;
        }

        /* SCENE */
        .scene-wrap {
          flex: 1 1 0;
          min-height: 0;
          overflow: hidden;
          display: flex;
          position: relative;
          z-index: 1;
        }
        .scene {
          position: relative;
          width: 100%; height: 100%;
          overflow: hidden;
          image-rendering: pixelated;
          background: #0d0514;
        }
        .stage-bg {
          position: absolute; inset: 0;
          width: 100%; height: 100%;
          object-fit: fill;
          image-rendering: pixelated;
          pointer-events: none;
        }

        /* stars */
        .star-overlay { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .sp { position: absolute; color: #f472b6; opacity: 0.14; font-size: 11px; animation: float-star 8s ease-in-out infinite; }
        .sp0 { left: 8%; top: 15%; }
        .sp1 { left: 88%; top: 22%; animation-delay: 1.5s; font-size: 8px; color: #e879f9; }
        .sp2 { left: 18%; top: 62%; animation-delay: 3s; font-size: 10px; }
        .sp3 { left: 76%; top: 58%; animation-delay: 4.5s; color: #c084fc; }
        .sp4 { left: 50%; top: 8%; animation-delay: 2s; font-size: 9px; color: #e879f9; }
        @keyframes float-star { 0%,100%{transform:translateY(0) rotate(0deg);opacity:.14} 50%{transform:translateY(-14px) rotate(22deg);opacity:.32} }

        /* SPRITES */
        .player, .npc {
          position: absolute;
          width: ${PLAYER_SIZE}px; height: ${PLAYER_SIZE + 48}px;
          transform: translate(-50%, -100%);
          background: transparent; border: none; padding: 0;
        }
        .npc { cursor: pointer; }
        .sprite {
          position: absolute; left: 50%; bottom: 0;
          transform: translateX(-50%);
          width: 64px; height: 64px;
          object-fit: contain; image-rendering: pixelated; pointer-events: none;
        }
        .sprite.lg { width: 74px; height: 90px; }
        .npc.nearby .sprite { filter: drop-shadow(0 0 8px #f472b6bb) drop-shadow(0 0 3px #ffffff66); }
        .name-tag {
          position: absolute; bottom: calc(100% + 2px); left: 50%;
          transform: translateX(-50%);
          font-family: 'Press Start 2P', monospace; font-size: 6px;
          color: #f472b6; background: rgba(16,8,24,0.93);
          padding: 3px 7px; border: 1px solid #f472b633;
          white-space: nowrap; pointer-events: none;

        }


        /* TALK PROMPT */
        .talk-prompt {
          position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 8px;
          font-family: 'Press Start 2P', monospace; font-size: 8px;
          color: #f472b6; background: rgba(14,4,24,0.96);
          border: 1px solid #f472b633; padding: 7px 14px; z-index: 50;
          letter-spacing: 0.1em; box-shadow: 0 0 18px #f472b611;
        }
        .blink-star { animation: blink .9s step-end infinite; }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }

        /* NOTEBOOK */
        .notebook {
          position: fixed; top: 38px; right: 0; bottom: 0;
          width: 290px; background: rgba(12,4,20,0.98);
          border-left: 2px solid #4a1060; z-index: 60;
          display: flex; flex-direction: column; overflow: hidden;
        }
        .nb-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 7px 12px; border-bottom: 1px solid #2a0a38;
          font-family: 'Press Start 2P', monospace; font-size: 8px;
          color: #f472b6; background: #110420; flex-shrink: 0;
        }
        .icon-btn {
          background: none; border: none; cursor: pointer;
          font-family: 'VT323', monospace; font-size: 18px;
          color: #7e4a9a; padding: 0 4px; transition: color .1s;
        }
        .icon-btn:hover { color: #f472b6; }
        .nb-body { overflow-y: auto; flex: 1; padding: 12px 14px; scrollbar-width: thin; scrollbar-color: #2a0a38 #0d0514; }
        .nb-section { margin-bottom: 12px; }
        .nb-section h4 { font-family: 'Press Start 2P', monospace; font-size: 7px; color: #e879f9; letter-spacing: .1em; margin-bottom: 7px; }
        .nb-hr { height: 1px; background: #220838; margin: 10px 0; }
        .nb-empty { font-size: 14px; color: #3a1050; font-style: italic; }
        .nb-entry { font-size: 15px; color: #c084fc; line-height: 1.5; margin-bottom: 3px; }
        .nb-entry.log { color: #7e4a9a; font-size: 14px; }

        /* ── DIALOG ── */
        /* Outer wrapper: fixed to bottom, full width, 300px tall */
        .dlg-wrap {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 300px;
          z-index: 200;
          display: flex;
          flex-direction: column;
          background: #0e0418;
          border-top: 2px solid #7c3aed;
          box-shadow: 0 -4px 32px rgba(124,58,237,0.2);
        }

        /* Info bar — fixed 58px */
        .dlg-bar {
          height: 58px;
          min-height: 58px;
          max-height: 58px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
          background: #110322;
          border-bottom: 1px solid #2a0a3a;
          flex-shrink: 0;
        }
        .dlg-portrait {
          width: 38px; height: 38px; flex-shrink: 0;
          border: 1px solid #6b21a8; background: #0a0116;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden; image-rendering: pixelated;
        }
        .portrait-img { width: 34px; height: 34px; object-fit: contain; image-rendering: pixelated; }
        .dlg-meta { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .dlg-name {
          font-family: 'Press Start 2P', monospace; font-size: 8px;
          color: #f472b6; letter-spacing: .08em; white-space: nowrap;
        }
        .dlg-sub { font-size: 13px; color: #7c3aed; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dlg-bars { display: flex; gap: 10px; align-items: center; margin-left: 8px; }
        .bar-row { display: flex; align-items: center; gap: 4px; font-family: 'Press Start 2P', monospace; font-size: 6px; color: #6b3080; }
        .bar-track { width: 64px; height: 4px; background: #1a0828; border: 1px solid #2a0a3a; }
        .bar-fill { height: 100%; transition: width .4s; }
        .bar-fill.trust { background: #f472b6; }
        .bar-fill.susp { background: #fb923c; }
        .bar-val { color: #f0e6ff; font-size: 7px; min-width: 18px; }
        .dlg-bar-right { margin-left: auto; flex-shrink: 0; }

        /* Messages area — fills all space between bar and input */
        .dlg-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #07010f;
          scrollbar-width: thin;
          scrollbar-color: #3a1060 #07010f;
        }
        .dlg-empty { font-size: 15px; color: #3a1060; font-style: italic; }

        /* Message rows */
        .msg-row {
          display: flex;
          width: 100%;
        }
        .msg-row.npc  { justify-content: flex-start; }
        .msg-row.user { justify-content: flex-end; }

        .msg-box {
          max-width: 62%;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .msg-who {
          font-family: 'Press Start 2P', monospace;
          font-size: 6px; letter-spacing: .04em;
          padding: 0 2px;
        }
        .msg-row.npc  .msg-who { color: #6b21a8; }
        .msg-row.user .msg-who { color: #4338ca; text-align: right; }

        .msg-text {
          font-family: 'VT323', monospace;
          font-size: 19px; line-height: 1.4;
          padding: 6px 10px;
          word-break: break-word;
          overflow-wrap: anywhere;
          white-space: pre-wrap;
        }
        .msg-row.npc  .msg-text {
          background: #1c0535;
          border: 1px solid #4a1060;
          color: #f0e8ff;
          border-radius: 0 6px 6px 6px;
        }
        .msg-row.user .msg-text {
          background: #0c0a30;
          border: 1px solid #312e81;
          color: #c7d2fe;
          text-align: right;
          border-radius: 6px 0 6px 6px;
        }
        .cursor { animation: blink .55s step-end infinite; color: #f472b6; }

        /* Input row — fixed 44px */
        .dlg-input-row {
          height: 44px;
          min-height: 44px;
          max-height: 44px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 12px;
          border-top: 1px solid #2a0a3a;
          background: #0e0418;
          flex-shrink: 0;
        }
        .dlg-input {
          flex: 1; min-width: 0;
          background: #0a0116;
          border: 1px solid #2a0a3a;
          color: #f5f0ff;
          font-family: 'VT323', monospace; font-size: 20px;
          padding: 4px 10px; outline: none; height: 32px;
        }
        .dlg-input:focus { border-color: #7c3aed; }
        .dlg-input::placeholder { color: #2d0a55; }
        .dlg-input:disabled { opacity: .4; }

        .btn {
          font-family: 'Press Start 2P', monospace; font-size: 7px;
          padding: 0 11px; height: 32px;
          background: #110322;
          border: 1px solid #3a1060; color: #a78bfa;
          cursor: pointer; white-space: nowrap; letter-spacing: .04em;
          transition: background .1s, color .1s, border-color .1s;
        }
        .btn:hover:not(:disabled) { background: #1c0935; color: #f472b6; border-color: #7c3aed; }
        .btn:disabled { opacity: .35; cursor: default; }
        .btn.primary { color: #f0abfc; border-color: #7c3aed; }
        .btn.kill { color: #ff4a6a; border-color: #ff4a6a44; }
        .btn.kill:hover:not(:disabled) { background: #1e0810; border-color: #ff4a6a88; }

        /* ENDING */
        .ending {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
          padding: 28px 36px; border: 2px solid;
          font-family: 'Press Start 2P', monospace; text-align: center;
          z-index: 200; max-width: 480px;
          animation: fadeIn .4s ease;
        }
        @keyframes fadeIn { from{opacity:0;transform:translate(-50%,-54%)} to{opacity:1;transform:translate(-50%,-50%)} }
        .ending.win { background: #060f0a; border-color: #4ade8055; color: #4ade80; box-shadow: 0 0 40px #4ade8011; }
        .ending.lose { background: #0f0608; border-color: #f8717155; color: #f87171; box-shadow: 0 0 40px #f8717111; }
        .ending-star { font-size: 32px; animation: spin 3s linear infinite; }
        .ending-title { font-size: 10px; letter-spacing: .12em; }
        .ending-body { font-size: 8px; line-height: 1.8; opacity: .85; }
        .ending-sub { font-size: 7px; opacity: .55; margin-top: 4px; }
        @keyframes spin { to{transform:rotate(360deg)} }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #0d0514; }
        ::-webkit-scrollbar-thumb { background: #2a0a38; }
      `}</style>
    </main>
  );
}
