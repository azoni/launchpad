import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correct = process.env.HANDBOOK_PASSWORD;

    if (!correct) {
      return NextResponse.json(
        { valid: false, error: "Handbook not configured" },
        { status: 500 },
      );
    }

    if (password === correct) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, error: "Incorrect password" });
  } catch {
    return NextResponse.json(
      { valid: false, error: "Invalid request" },
      { status: 400 },
    );
  }
}
