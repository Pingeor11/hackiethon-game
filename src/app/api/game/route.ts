import { NextResponse } from "next/server";
import { createNewGame } from "@/lib/scenario";

export async function GET() {
  return NextResponse.json(createNewGame());
}