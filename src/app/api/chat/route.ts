import { NextRequest, NextResponse } from "next/server";
import {
  buildExtractionPrompt,
  buildNPCPrompt,
  buildRubyHelperPrompt,
} from "@/lib/prompts";
import { applyExtractionToWorld } from "@/lib/gameEngine";
import { ChatRequestBody, ExtractionResult } from "@/lib/types";

async function callGroqText(prompt: string) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return "No Groq API key found.";
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody & {
      kill?: string;
    };

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

      return NextResponse.json({
        reply: `${target} was not the murderer. You lose.`,
        updatedWorldState: null,
        resetGame: true,
      });
    }

    if (body.rubyHelp) {
      const reply = await callGroqText(
        buildRubyHelperPrompt(body.worldState),
      );

      return NextResponse.json({
        reply,
        updatedWorldState: body.worldState,
      });
    }

    const npc = body.worldState.npcs[body.npcName];

    const reply = await callGroqText(
      buildNPCPrompt(npc, body.worldState, body.playerMessage),
    );

    const fallbackExtraction: ExtractionResult = {
      trustDelta: 0,
      suspicionDelta: 0.05,
      discoveredClue: null,
      contradiction: null,
      rumor: `Aqua questioned ${body.npcName}.`,
      memorySummary: `Aqua spoke with ${body.npcName} about the case.`,
    };

    const extraction = await callGroqJson<ExtractionResult>(
      buildExtractionPrompt(npc, body.playerMessage, reply, body.worldState),
      fallbackExtraction,
    );

    const updatedWorldState = applyExtractionToWorld(
      body.worldState,
      body.npcName,
      body.playerMessage,
      extraction,
    );

    return NextResponse.json({
      reply,
      updatedWorldState,
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