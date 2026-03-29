import { NextRequest, NextResponse } from "next/server";
import {
  buildExtractionPrompt,
  buildNPCPrompt,
  buildRubyHelperPrompt,
  buildDealRevealPrompt,
} from "@/lib/prompts";
import { applyExtractionToWorld } from "@/lib/gameEngine";
import { ChatRequestBody, ExtractionResult, ActiveDeal } from "@/lib/types";

async function callGroqText(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "No Groq API key found.";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Groq API error:", data);
    return "Something's wrong... I can't get the words out right now.";
  }
  return data?.choices?.[0]?.message?.content ?? "...";
}

async function callGroqJson<T>(prompt: string, fallback: T): Promise<T> {
  const text = await callGroqText(prompt);
  try {
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "");
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

// ── Deal definitions — each NPC has one specific deal they'll offer ────────────
const dealDefinitions: Record<string, {
  task: string;
  taskTarget: string | null;
  offer: string;
  minTrust: number;
  // Keywords player must use when reporting back to prove they did the task
  completionKeywords: string[];
  // What the deal-giver NPC already told us about what they want
  taskContext: string;
}> = {
  Manager: {
    task: "Talk to the Executive and find out if he's planning to sell the agency. Come back and tell me what he says.",
    taskTarget: "Executive",
    offer: "There's something about that night I haven't told anyone. I could tell you.",
    minTrust: 0.5,
    completionKeywords: ["executive", "sell", "agency", "deal", "sale", "said", "told me", "mentioned"],
    taskContext: "Manager wants to know if the Executive is planning to sell the agency behind everyone's backs.",
  },
  CoIdol: {
    task: "Ask the Manager why he didn't submit my name for the last casting. Come back with exactly what he says.",
    taskTarget: "Manager",
    offer: "I know who I saw near the house that night. I haven't told anyone.",
    minTrust: 0.45,
    completionKeywords: ["manager", "casting", "submit", "name", "said", "told me", "because", "reason"],
    taskContext: "CoIdol wants to know why the Manager blocked her casting opportunity.",
  },
  Director: {
    task: "Tell me honestly what you've already found out. All of it. Then I'll tell you something.",
    taskTarget: null,
    offer: "I'll tell you about an arrangement I have with the Executive that changes how you should read this.",
    minTrust: 0.55,
    completionKeywords: ["found", "discovered", "know", "learned", "clue", "evidence", "told me", "saw"],
    taskContext: "Director wants Aqua to share their investigation findings first as a show of trust.",
  },
  Fan: {
    task: "Ask Ruby if she thinks I did this. Come back and tell me honestly what she said.",
    taskTarget: "Ruby",
    offer: "I have information from inside the fan network — things that happened near the house that night.",
    minTrust: 0.4,
    completionKeywords: ["ruby", "said", "thinks", "believe", "told me", "doesn't think", "innocent"],
    taskContext: "Fan wants to know if Ruby — someone close to Ai — believes he could have done it.",
  },
  Executive: {
    task: "Tell me what the Manager has already told you about our financial arrangement. Exactly.",
    taskTarget: null,
    offer: "I'll tell you what the agency knew about Ai in the weeks before she died.",
    minTrust: 0.5,
    completionKeywords: ["manager", "financial", "arrangement", "money", "said", "told me", "payment", "deal"],
    taskContext: "Executive wants to know what the Manager has already revealed about their financial dealings.",
  },
};

// ── Check if a player message meaningfully reports back on a deal task ─────────
function detectDealCompletion(
  deal: ActiveDeal,
  playerMessage: string,
  npcName: string,
  worldState: any,
): boolean {
  // Must be talking to the deal-giver
  if (deal.npcName !== npcName) return false;
  if (deal.status !== "pending") return false;

  const lower = playerMessage.toLowerCase();
  const def = dealDefinitions[deal.npcName];
  if (!def) return false;

  // If deal requires talking to a specific NPC, check they've been visited
  if (deal.taskTarget) {
    const hasVisitedTarget = worldState.questionedOrder?.includes(deal.taskTarget);
    if (!hasVisitedTarget) return false;
  }

  // Check player message contains enough completion keywords
  const matches = def.completionKeywords.filter(kw => lower.includes(kw));
  return matches.length >= 2;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody & { kill?: string };

    // ── KILL ──────────────────────────────────────────────────────────────────
    if (body.kill) {
      const target = body.kill;
      const isCorrect = target === body.worldState.killer;

      if (isCorrect) {
        const updatedWorldState = {
          ...body.worldState,
          gameOver: true,
          winner: true,
          investigationLog: [
            ...body.worldState.investigationLog,
            `Aqua killed ${target}. ${target} was the murderer.`,
          ],
        };
        return NextResponse.json({
          reply: `${target} was the murderer. You win.`,
          updatedWorldState,
          resetGame: false,
        });
      }

      const losingState = {
        ...body.worldState,
        gameOver: true,
        winner: false,
        investigationLog: [
          ...body.worldState.investigationLog,
          `Aqua killed ${target}. ${target} was innocent. The real killer was ${body.worldState.killer}.`,
        ],
      };
      return NextResponse.json({
        reply: `${target} was not the murderer. The real killer was ${body.worldState.killer}.`,
        updatedWorldState: losingState,
        resetGame: false,
      });
    }

    // ── RUBY HELPER ───────────────────────────────────────────────────────────
    if (body.rubyHelp) {
      const reply = await callGroqText(buildRubyHelperPrompt(body.worldState));
      return NextResponse.json({ reply, updatedWorldState: body.worldState });
    }

    // ── CHECK FOR DEAL FULFILLMENT BEFORE NPC RESPONSE ────────────────────────
    const pendingDeals = (body.worldState.activeDeals ?? []).filter(
      (d: ActiveDeal) => d.status === "pending"
    );

    let fulfilledDeal: ActiveDeal | null = null;
    let dealRevealReply: string | null = null;
    let dealRevealTruth: string | null = null;

    for (const deal of pendingDeals) {
      if (detectDealCompletion(deal, body.playerMessage, body.npcName, body.worldState)) {
        fulfilledDeal = deal;
        break;
      }
    }

    // ── NPC CONVERSATION ──────────────────────────────────────────────────────
    const npc = body.worldState.npcs[body.npcName];

    // If a deal is being fulfilled, build a special reveal prompt
    let replyPrompt: string;
    if (fulfilledDeal) {
      const dealNPCState = body.worldState.npcs[fulfilledDeal.npcName];
      const truthToReveal = (dealNPCState.truthsKnown ?? [])[fulfilledDeal.truthIndex];
      dealRevealTruth = truthToReveal ?? null;
      replyPrompt = buildDealRevealPrompt(npc, body.worldState, body.playerMessage, truthToReveal ?? "");
    } else {
      replyPrompt = buildNPCPrompt(npc, body.worldState, body.playerMessage);
    }

    const reply = await callGroqText(replyPrompt);

    // Fallback extraction
    const fallbackExtraction: ExtractionResult = {
      trustDelta: 0,
      suspicionDelta: 0.05,
      discoveredClue: null,
      contradiction: null,
      rumor: `Aqua questioned ${body.npcName}.`,
      memorySummary: `Aqua spoke with ${body.npcName}.`,
      elicitationWorked: false,
      elicitationNote: null,
      aquaTone: "neutral",
      npcBackchannelTarget: null,
      npcBackchannelMessage: null,
      industryGossip: null,
      gossipSource: null,
      gossipRelatedTo: null,
    };

    const extraction = await callGroqJson<ExtractionResult>(
      buildExtractionPrompt(npc, body.playerMessage, reply, body.worldState),
      fallbackExtraction,
    );

    // If deal was fulfilled, inject the truth as a clue into extraction
    if (fulfilledDeal && dealRevealTruth) {
      extraction.discoveredClue = `[DEAL CONFIRMED] ${fulfilledDeal.npcName}: ${dealRevealTruth}`;
    }

    let updatedWorldState = applyExtractionToWorld(
      body.worldState,
      body.npcName,
      body.playerMessage,
      extraction,
    );

    // Mark the deal as fulfilled in world state
    if (fulfilledDeal) {
      const dealIndex = (updatedWorldState.activeDeals ?? []).findIndex(
        (d: ActiveDeal) => d.npcName === fulfilledDeal!.npcName && d.status === "pending"
      );
      if (dealIndex !== -1) {
        updatedWorldState.activeDeals[dealIndex].status = "fulfilled";
        updatedWorldState.activeDeals[dealIndex].revealedTruth = dealRevealTruth ?? undefined;
      }
      updatedWorldState.investigationLog.push(
        `[deal fulfilled] ${fulfilledDeal.npcName} revealed: ${dealRevealTruth}`
      );
      // Also add to confirmed truths
      if (!updatedWorldState.confirmedTruths) updatedWorldState.confirmedTruths = [];
      updatedWorldState.confirmedTruths.push({
        source: fulfilledDeal.npcName,
        truth: dealRevealTruth ?? "",
        turn: updatedWorldState.turn,
      });
    }

    // Check if a side deal was surfaced this turn
    const surfacedDeal = updatedWorldState.sideDeals?.find(
      (d: { discovered: boolean; exposedDescription: string }) =>
        d.discovered &&
        !body.worldState.sideDeals?.find(
          (old: { exposedDescription: string; discovered: boolean }) =>
            old.exposedDescription === d.exposedDescription && old.discovered
        )
    );

    // ── New deal offer logic ──────────────────────────────────────────────────
    const npcAfter = updatedWorldState.npcs[body.npcName];
    const unrevealedTruths = (npcAfter.truthsKnown ?? []).filter(
      (t: string) => !npcAfter.revealedClues.some((c: string) => c.includes(t.slice(0, 20)))
    );

    let barterOffer = null;

    // Don't offer a new deal if one is already pending for this NPC
    const existingDeal = (updatedWorldState.activeDeals ?? []).find(
      (d: ActiveDeal) => d.npcName === body.npcName && d.status === "pending"
    );

    // Don't offer a deal the turn a deal was just fulfilled
    if (
      !existingDeal &&
      !fulfilledDeal &&
      unrevealedTruths.length > 0 &&
      Math.random() < 0.35
    ) {
      const def = dealDefinitions[body.npcName];
      if (def && npcAfter.trustPlayer >= def.minTrust && npcAfter.suspicionPlayer < 0.65) {
        const truthIndex = (npcAfter.truthsKnown ?? []).indexOf(unrevealedTruths[0]);
        if (!updatedWorldState.activeDeals) updatedWorldState.activeDeals = [];
        updatedWorldState.activeDeals.push({
          npcName: body.npcName,
          task: def.task,
          taskTarget: def.taskTarget as any,
          reward: def.offer,
          truthIndex,
          status: "pending",
        });
        barterOffer = {
          npcName: body.npcName,
          offer: def.offer,
          asking: def.task,
          taskTarget: def.taskTarget,
          truthIndex,
        };
      }
    }

    return NextResponse.json({
      reply,
      updatedWorldState,
      elicitationFeedback: extraction.elicitationWorked ? extraction.elicitationNote : null,
      barterOffer,
      sideDealSurfaced: surfacedDeal?.exposedDescription ?? null,
      backchannelDetected: extraction.npcBackchannelTarget
        ? `${body.npcName} contacted ${extraction.npcBackchannelTarget} after this conversation.`
        : null,
      // Deal fulfillment payload — triggers cinematic reveal on frontend
      dealFulfilled: fulfilledDeal
        ? {
            npcName: fulfilledDeal.npcName,
            truth: dealRevealTruth,
            reward: (dealDefinitions[fulfilledDeal.npcName]?.offer) ?? "",
          }
        : null,
    });

  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      {
        reply: "The conversation broke down unexpectedly.",
        updatedWorldState: null,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
