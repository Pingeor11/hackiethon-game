"use client";

import { useEffect, useMemo, useState } from "react";
import { NPCName, SuspectName, WorldState } from "@/lib/types";

interface LocalMessage {
  speaker: "user" | "npc";
  text: string;
}

const initialMessages: Record<NPCName, LocalMessage[]> = {
  Manager: [],
  CoIdol: [],
  Director: [],
  Fan: [],
  Executive: [],
  Ruby: [],
};
function TypewriterText({
  text,
  speed = 12,
}: {
  text: string;
  speed?: number;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let index = 0;

    const interval = setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));

      if (index >= text.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <>{displayed}</>;
}

export default function HomePage() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<NPCName>("Manager");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Record<NPCName, LocalMessage[]>>(initialMessages);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/game")
      .then((r) => r.json())
      .then((data) => setWorldState(data));
  }, []);

  const npcList = useMemo(() => {
    if (!worldState) return [] as NPCName[];
    return Object.keys(worldState.npcs) as NPCName[];
  }, [worldState]);

  async function sendMessage() {
    if (!worldState || !input.trim() || loading || worldState.gameOver) return;

    const playerMessage = input.trim();
    setInput("");
    setLoading(true);

    setMessages((prev) => ({
      ...prev,
      [selectedNPC]: [...prev[selectedNPC], { speaker: "user", text: playerMessage }],
    }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        npcName: selectedNPC,
        playerMessage,
        worldState,
      }),
    });

    const data = await res.json();

    setWorldState(data.updatedWorldState);
    setMessages((prev) => ({
      ...prev,
      [selectedNPC]: [...prev[selectedNPC], { speaker: "npc", text: data.reply }],
    }));

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

    setMessages((prev) => ({
      ...prev,
      Ruby: [...prev.Ruby, { speaker: "npc", text: data.reply }],
    }));

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
  }

  if (!worldState) {
    return <main style={{ padding: 24 }}>Loading investigation...</main>;
  }

  const activeNPC = worldState.npcs[selectedNPC];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <h2>Characters</h2>
        <p className="small">
          You play as {worldState.playableCharacter}. Ai is dead. Someone is lying.
        </p>

        {npcList.map((npcName) => {
          const npc = worldState.npcs[npcName];
          const canAccuse = npc.isKillerCandidate && worldState.accusationUnlocked && !worldState.gameOver;

          return (
            <div key={npcName}>
              <button
                className={`npc-button ${selectedNPC === npcName ? "active" : ""}`}
                onClick={() => setSelectedNPC(npcName)}
              >
                <div><strong>{npcName}</strong></div>
                <div className="small">{npc.role}</div>
                <div className="small">Mood: {npc.mood}</div>
                <div className="small">
                  Trust: {npc.trustPlayer.toFixed(2)} | Suspicion: {npc.suspicionPlayer.toFixed(2)}
                </div>
              </button>

              {canAccuse && (
                <button
                  className="action-button"
                  style={{ width: "100%", marginBottom: 12 }}
                  onClick={() => accuse(npcName as SuspectName)}
                >
                  Accuse {npcName}
                </button>
              )}
            </div>
          );
        })}
      </aside>

      <section className="main">
        <div className="panel">
          <span className="badge">Turn {worldState.turn}</span>
          <span className="badge">Tension {worldState.tension}</span>
          <span className="badge">Talking to {selectedNPC}</span>
          {worldState.gameOver && (
            <span className="badge">{worldState.winner ? "Solved" : "Failed"}</span>
          )}
        </div>

        <div className="panel">
          <h2>{selectedNPC}</h2>
          <p className="small">{activeNPC.publicFace}</p>

          <div className="chat-log">
            {messages[selectedNPC].length === 0 && (
              <div className="small">
                {selectedNPC === "Ruby"
                  ? "Ruby does not know the killer. She helps summarize evidence, contradictions, and next steps."
                  : "Start the interrogation. Ask about timelines, motives, relationships, or contradictions."}
              </div>
            )}

            {messages[selectedNPC].map((m, i) => (
              <div
                key={i}
                className={`msg ${m.speaker === "user" ? "user" : "npc"}`}
              >
                {m.speaker === "npc" ? (
                  <TypewriterText text={m.text} speed={20} />
                ) : (
                  m.text
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="panel controls">
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={
              selectedNPC === "Ruby"
                ? "Ask Ruby to help organize the case..."
                : "Type anything: 'Where were you last night?' 'Who argued with Ai?' 'Your timeline doesn't make sense.'"
            }
            disabled={loading || worldState.gameOver}
          />

          <button
            className="action-button"
            onClick={sendMessage}
            disabled={loading || worldState.gameOver}
          >
            {loading ? "..." : "Send"}
          </button>

          {selectedNPC === "Ruby" && (
            <button
              className="action-button"
              onClick={askRubyForHelp}
              disabled={loading || worldState.gameOver}
            >
              Summarize Case
            </button>
          )}
        </div>
      </section>

      <aside className="notebook">
        <h2>Notebook</h2>
        <p className="small">Track clues, contradictions, and investigation progress.</p>

        <div className="panel">
          <h3>Discovered clues</h3>
          {worldState.cluesDiscovered.length === 0 ? (
            <p className="small">No confirmed clues yet.</p>
          ) : (
            <ul>
              {worldState.cluesDiscovered.map((clue, i) => (
                <li key={i}>{clue}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Contradictions</h3>
          {worldState.contradictionsFound.length === 0 ? (
            <p className="small">No contradictions recorded yet.</p>
          ) : (
            <ul>
              {worldState.contradictionsFound.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel">
          <h3>Recent investigation log</h3>
          <ul>
            {worldState.investigationLog.slice(-8).map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h3>Rumors around {selectedNPC}</h3>
          {activeNPC.rumorsHeard.length === 0 ? (
            <p className="small">No rumors heard yet.</p>
          ) : (
            <ul>
              {activeNPC.rumorsHeard.slice(-5).map((rumor, i) => (
                <li key={i}>{rumor}</li>
              ))}
            </ul>
          )}
        </div>

        {worldState.gameOver && (
          <div className="panel">
            <h3>Ending</h3>
            <p>
              {worldState.winner
                ? `Aqua solved Ai's murder. ${worldState.killer} was responsible.`
                : `The accusation failed. The real killer was ${worldState.killer}.`}
            </p>
            <p className="small">Motive: {worldState.motive}</p>
            <p className="small">Method: {worldState.method}</p>
          </div>
        )}
      </aside>
    </main>
  );
}