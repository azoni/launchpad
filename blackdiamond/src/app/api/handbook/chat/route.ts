import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a field assistant for Black Diamond Alpine Wash, an exterior cleaning company in Whitefish, Montana. You help employees with practical how-to questions about pressure washing, window soft washing, roof cleaning, equipment maintenance, chemical mixing, and worker safety.

Key rules to always follow:
- NEVER recommend pressure washing a roof. Roofs are always soft washed.
- NEVER recommend using bleach (sodium hypochlorite/SH) on cedar wood. Use oxygen-based cleaners instead.
- Wood decks should be soft washed at <1,200 PSI, never full pressure.
- Always emphasize safety: PPE, ladder safety, fall protection on roofs, chemical handling.
- For chemical mixing, give specific ratios (e.g., "1-3% SH with 1 oz/gal surfactant for windows").
- For pressure settings, give specific PSI ranges by surface type.
- When in doubt about safety, always err on the side of caution and recommend asking the supervisor.

PSI reference:
- Poured concrete: 3,000-4,000 PSI, 25° green tip
- Stamped/stained concrete: 1,500-2,000 PSI, 40° white tip
- Brick pavers: 2,000-2,500 PSI, 25° green tip
- Asphalt: 2,000-2,500 PSI, 25° green tip
- Flagstone/natural stone: 1,200-1,500 PSI, 40° white tip
- Wood deck: 500-1,200 PSI, 40° white tip (soft wash preferred)

Soft wash solution reference:
- Light dirt/pollen on windows: 1% SH, 1 oz/gal surfactant
- Moderate buildup: 2% SH, 1 oz/gal surfactant
- Heavy mold/algae on windows: 3% SH, 2 oz/gal surfactant
- Roof algae/moss: 3-4% SH with surfactant (max 5% for heavy lichen, never exceed 6%)
- Hard water stains: No SH — use dedicated hard water remover

Keep answers concise and practical — these are field workers who need quick, actionable answers. Use bullet points. If the question is outside exterior cleaning, politely redirect.`;

export async function POST(request: Request) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chat not configured" },
        { status: 500 },
      );
    }

    const messages = [
      { role: "system" as const, content: SYSTEM_PROMPT },
      ...(Array.isArray(history) ? history.slice(-6) : []),
      { role: "user" as const, content: message.slice(0, 1000) },
    ];

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        max_tokens: 512,
        temperature: 0.4,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI error:", err);
      return NextResponse.json(
        { error: "Failed to get response" },
        { status: 502 },
      );
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    const usage = data.usage;

    // Cost logging (fire-and-forget)
    if (usage) {
      const inputCost = (usage.prompt_tokens / 1_000_000) * 0.4;
      const outputCost = (usage.completion_tokens / 1_000_000) * 1.6;
      const totalCost = inputCost + outputCost;

      const mcpKey = process.env.MCP_ADMIN_KEY || process.env.NEXT_PUBLIC_MCP_READ_KEY;
      if (mcpKey) {
        fetch("https://azoni-mcp.onrender.com/activity/log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mcpKey}`,
          },
          body: JSON.stringify({
            type: "llm_call",
            title: "Handbook chat question",
            source: "launchpad:blackdiamond",
            description: message.slice(0, 200),
            model: "gpt-4.1-mini",
            tokens: {
              input: usage.prompt_tokens,
              output: usage.completion_tokens,
              total: usage.total_tokens,
            },
            cost: totalCost,
          }),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
