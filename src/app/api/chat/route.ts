import { NextRequest, NextResponse } from "next/server";
import {
  buildExtractionPrompt,
  buildNPCPrompt,
  buildRubyHelperPrompt,
  buildDealRevealPrompt,
  buildDealCompletionCheckPrompt,
  buildRubyInterjectionPrompt,
  buildConfrontationPrompt,
} from "@/lib/prompts";
import { applyExtractionToWorld } from "@/lib/gameEngine";
import { ChatRequestBody, ExtractionResult, ActiveDeal, NPCName } from "@/lib/types";

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
  } catch (e) {
    console.log("[callGroqJson parse error]", text.slice(0, 200), e);
    return fallback;
  }
}

// ── Deal definitions ───────────────────────────────────────────────────────────
const dealDefinitions: Record<string, {
  task: string;
  taskTarget: NPCName | null;
  offer: string;
  minTrust: number;
  taskContext: string;
}> = {
  Manager: {
    task: "Talk to the Executive and find out if he's planning to sell the agency. Come back and tell me what he says.",
    taskTarget: "Executive",
    offer: "There's something about that night I haven't told anyone. I could tell you.",
    minTrust: 0.5,
    taskContext: "Manager wants to know if the Executive is planning to sell the agency. The player should report back what the Executive said about this — something specific about the sale, the deal, or the agency's future.",
  },
  CoIdol: {
    task: "Ask the Manager why he didn't submit my name for the last casting. Come back with exactly what he says.",
    taskTarget: "Manager",
    offer: "I know who I saw near the house that night. I haven't told anyone.",
    minTrust: 0.45,
    taskContext: "CoIdol wants to know why the Manager didn't submit her name for a casting. The player should report back what the Manager said about this — a reason, an excuse, or a deflection.",
  },
  Director: {
    // taskTarget: null — Gate 1 uses world-state: cluesDiscovered >= 2
    task: "Tell me honestly what you've already found out. All of it. Then I'll tell you something.",
    taskTarget: null,
    offer: "I'll tell you about an arrangement I have with the Executive that changes how you should read this.",
    minTrust: 0.55,
    taskContext: "Director wants Aqua to genuinely share what they've discovered in the investigation so far — real clues, specific things learned from other people. The message must contain actual investigative findings, not vague reassurances or one-word answers.",
  },
  Fan: {
    task: "Ask Ruby if she thinks I did this. Come back and tell me honestly what she said.",
    taskTarget: "Ruby",
    offer: "I have information from inside the fan network — things that happened near the house that night.",
    minTrust: 0.4,
    taskContext: "Fan wants to know if Ruby believes he could have killed Ai. The player should relay what Ruby actually said about the Fan — whether she thinks he's innocent, guilty, or suspicious.",
  },
  Executive: {
    // taskTarget: null — Gate 1 uses world-state: Manager has been questioned
    task: "Tell me what the Manager has already told you about our financial arrangement. Exactly.",
    taskTarget: null,
    offer: "I'll tell you what the agency knew about Ai in the weeks before she died.",
    minTrust: 0.5,
    taskContext: "Executive wants to know what the Manager has already told Aqua about the financial arrangement between them. The player should relay specific things the Manager said — about money, payments, or their business relationship.",
  },
};

// ── Gate 1: State flag / world-state check ────────────────────────────────────
// For deals WITH a taskTarget: target NPC must have completedTaskFor flag set
// For deals WITHOUT a taskTarget (Director, Executive): world-state conditions
function gate1StateCheck(deal: ActiveDeal, worldState: any): boolean {
  const def = dealDefinitions[deal.npcName];
  if (!def) return false;

  if (deal.taskTarget) {
    // The target NPC must have been visited productively and flagged
    const targetNPC = worldState.npcs[deal.taskTarget];
    if (!targetNPC) return false;
    return (targetNPC.completedTaskFor ?? []).includes(deal.npcName);
  }

  // Null-target deals use world-state gates
  if (deal.npcName === "Director") {
    // Must have real findings to share
    return (worldState.cluesDiscovered ?? []).length >= 2;
  }

  if (deal.npcName === "Executive") {
    // Manager must have been questioned at least once
    return (worldState.questionedOrder ?? []).includes("Manager");
  }

  return false;
}

// ── Gate 2: LLM check — did the player actually report meaningfully? ──────────
async function gate2LLMCheck(
  deal: ActiveDeal,
  playerMessage: string,
  worldState: any,
): Promise<{ pass: boolean; reason: string }> {
  const def = dealDefinitions[deal.npcName];
  if (!def) return { pass: false, reason: "No deal definition found." };

  const prompt = buildDealCompletionCheckPrompt(
    deal.npcName,
    def.taskContext,
    playerMessage,
    worldState.cluesDiscovered ?? [],
    worldState.questionedOrder ?? [],
  );

  return callGroqJson<{ pass: boolean; reason: string }>(
    prompt,
    { pass: false, reason: "Could not evaluate." },
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody & { kill?: string };

    // ── KILL — confrontation first, then resolution ───────────────────────────
    if (body.kill) {
      const target = body.kill;
      const isCorrect = target === body.worldState.killer;
      const npcState = body.worldState.npcs[target];

      // Generate the accused NPC's confrontation response
      const confrontationReply = await callGroqText(
        buildConfrontationPrompt(npcState, body.worldState, isCorrect)
      );

      return NextResponse.json({
        confrontationReply,
        confrontationTarget: target,
        isCorrect,
        updatedWorldState: {
          ...body.worldState,
          gameOver: true,
          winner: isCorrect,
          investigationLog: [
            ...body.worldState.investigationLog,
            isCorrect
              ? `Aqua confronted ${target}. ${target} was the murderer.`
              : `Aqua confronted ${target}. ${target} was innocent. The real killer was ${body.worldState.killer}.`,
          ],
        },
        resetGame: false,
      });
    }

    // ── RUBY HELPER ───────────────────────────────────────────────────────────
    if (body.rubyHelp) {
      const reply = await callGroqText(buildRubyHelperPrompt(body.worldState));
      return NextResponse.json({ reply, updatedWorldState: body.worldState });
    }

    // ── HYBRID DEAL COMPLETION — both gates must pass ─────────────────────────
    const pendingDealsForNPC = (body.worldState.activeDeals ?? []).filter(
      (d: ActiveDeal) => d.status === "pending" && d.npcName === body.npcName
    );

    let fulfilledDeal: ActiveDeal | null = null;
    let dealRevealTruth: string | null = null;
    let gate2FailReason: string | null = null;

    for (const deal of pendingDealsForNPC) {
      // Gate 1 — state flag or world-state condition
      if (!gate1StateCheck(deal, body.worldState)) continue;

      // Gate 2 — LLM judges the report
      const g2 = await gate2LLMCheck(deal, body.playerMessage, body.worldState);
      if (!g2.pass) {
        gate2FailReason = g2.reason;
        continue;
      }

      fulfilledDeal = deal;
      gate2FailReason = null;
      break;
    }

    // ── NPC CONVERSATION ──────────────────────────────────────────────────────
    const npc = body.worldState.npcs[body.npcName];

    let replyPrompt: string;
    if (fulfilledDeal) {
      const truthToReveal = (body.worldState.npcs[fulfilledDeal.npcName].truthsKnown ?? [])[fulfilledDeal.truthIndex];
      const isKillerDeal = fulfilledDeal.npcName === body.worldState.killer;

      // dealRevealTruth is set after we have the reply — see below
      dealRevealTruth = truthToReveal ?? null;

      replyPrompt = buildDealRevealPrompt(
        npc,
        body.worldState,
        body.playerMessage,
        truthToReveal ?? "",
        isKillerDeal ? body.worldState.motive : undefined,
      );
    } else {
      replyPrompt = buildNPCPrompt(npc, body.worldState, body.playerMessage);
    }

    const reply = await callGroqText(replyPrompt);

    // For innocent deal reveals — the cinematic shows what the NPC actually said,
    // which is the vague, unnamed observation the LLM generated from the belief context.
    // This keeps the cinematic consistent with the conversation and avoids showing
    // raw belief text that names or points too directly at the killer.
    if (fulfilledDeal && fulfilledDeal.npcName !== body.worldState.killer) {
      dealRevealTruth = reply;
    }

    // ── EXTRACTION + RUBY INTERJECTION — run in parallel ─────────────────────
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

    // Ruby only interjects when talking to non-Ruby NPCs
    const shouldCheckRuby = body.npcName !== "Ruby" && !fulfilledDeal;

    const [extraction, rubyInterjectionResult] = await Promise.all([
      callGroqJson<ExtractionResult>(
        buildExtractionPrompt(npc, body.playerMessage, reply, body.worldState),
        fallbackExtraction,
      ),
      shouldCheckRuby
        ? callGroqJson<{ interject: boolean; message: string | null; flaggedFact: string | null }>(
            buildRubyInterjectionPrompt(body.npcName, body.playerMessage, reply, body.worldState),
            { interject: false, message: null, flaggedFact: null },
          )
        : Promise.resolve({ interject: false, message: null, flaggedFact: null }),
    ]);

    console.log("[Ruby]", JSON.stringify(rubyInterjectionResult));

    if (fulfilledDeal && dealRevealTruth) {
      extraction.discoveredClue = `[DEAL CONFIRMED] ${fulfilledDeal.npcName}: ${dealRevealTruth}`;
    }

    let updatedWorldState = applyExtractionToWorld(
      body.worldState,
      body.npcName,
      body.playerMessage,
      extraction,
    );

    // ── GATE 1 FLAG: mark target NPC as visited for pending deals ─────────────
    // Every turn: if this NPC is a taskTarget for any pending deal AND the
    // exchange was productive, set completedTaskFor flag on this NPC
    const allPendingDeals = (updatedWorldState.activeDeals ?? []).filter(
      (d: ActiveDeal) => d.status === "pending"
    );

    for (const deal of allPendingDeals) {
      if (deal.taskTarget !== body.npcName) continue;
      // Productive = extraction got a clue OR a non-trivial memory summary
      const productive = !!(
        extraction.discoveredClue ||
        (extraction.memorySummary && extraction.memorySummary.length > 20)
      );
      if (!productive) continue;

      const targetNPC = updatedWorldState.npcs[body.npcName];
      if (!targetNPC.completedTaskFor) targetNPC.completedTaskFor = [];
      if (!targetNPC.completedTaskFor.includes(deal.npcName as NPCName)) {
        targetNPC.completedTaskFor.push(deal.npcName as NPCName);
        updatedWorldState.investigationLog.push(
          `[gate1 set] ${body.npcName} visit flagged as complete for ${deal.npcName}'s deal.`
        );
      }
    }

    // ── MARK DEAL FULFILLED ───────────────────────────────────────────────────
    if (fulfilledDeal) {
      const idx = (updatedWorldState.activeDeals ?? []).findIndex(
        (d: ActiveDeal) => d.npcName === fulfilledDeal!.npcName && d.status === "pending"
      );
      if (idx !== -1) {
        updatedWorldState.activeDeals[idx].status = "fulfilled";
        updatedWorldState.activeDeals[idx].revealedTruth = dealRevealTruth ?? undefined;
      }
      if (!updatedWorldState.confirmedTruths) updatedWorldState.confirmedTruths = [];
      updatedWorldState.confirmedTruths.push({
        source: fulfilledDeal.npcName,
        truth: dealRevealTruth ?? "",
        turn: updatedWorldState.turn,
      });
      updatedWorldState.investigationLog.push(
        `[deal fulfilled] ${fulfilledDeal.npcName} revealed: ${dealRevealTruth}`
      );
    }

    // ── SIDE DEAL SURFACE CHECK ───────────────────────────────────────────────
    const surfacedDeal = updatedWorldState.sideDeals?.find(
      (d: { discovered: boolean; exposedDescription: string }) =>
        d.discovered &&
        !body.worldState.sideDeals?.find(
          (old: { exposedDescription: string; discovered: boolean }) =>
            old.exposedDescription === d.exposedDescription && old.discovered
        )
    );

    // ── NEW DEAL OFFER ────────────────────────────────────────────────────────
    const npcAfter = updatedWorldState.npcs[body.npcName];
    const unrevealedTruths = (npcAfter.truthsKnown ?? []).filter(
      (t: string) => !npcAfter.revealedClues.some((c: string) => c.includes(t.slice(0, 20)))
    );

    let barterOffer = null;
    const existingDeal = (updatedWorldState.activeDeals ?? []).find(
      (d: ActiveDeal) => d.npcName === body.npcName && d.status === "pending"
    );

    if (!existingDeal && !fulfilledDeal && unrevealedTruths.length > 0 && Math.random() < 0.35) {
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
      dealFulfilled: fulfilledDeal
        ? {
            npcName: fulfilledDeal.npcName,
            truth: dealRevealTruth,
            reward: dealDefinitions[fulfilledDeal.npcName]?.offer ?? "",
          }
        : null,
      dealHint: !fulfilledDeal && gate2FailReason && pendingDealsForNPC.length > 0
        ? gate2FailReason
        : null,
      rubyInterjection: (rubyInterjectionResult?.interject && rubyInterjectionResult?.message)
        ? rubyInterjectionResult.message
        : null,
      rubyFlaggedFact: (rubyInterjectionResult?.interject && rubyInterjectionResult?.flaggedFact)
        ? rubyInterjectionResult.flaggedFact
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
