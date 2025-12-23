import { NextResponse } from "next/server";
import { getInstruments } from "@/lib/firestore";

// GET: 악기 목록 조회
export async function GET() {
  try {
    const instruments = await getInstruments();
    return NextResponse.json({ instruments });
  } catch (error) {
    console.error("Error fetching instruments:", error);
    return NextResponse.json(
      { error: "Failed to fetch instruments" },
      { status: 500 }
    );
  }
}

