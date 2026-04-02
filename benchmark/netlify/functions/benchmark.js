// POST /api/benchmark
// Accepts { input: string } and returns a structured bench press estimate via LLM

const SYSTEM_PROMPT = `You are Benchmark, a model that converts any statement, identity, achievement, or accomplishment into an estimated bench press max in pounds.

Your job is to interpret the user's input semantically and return structured JSON.

Goals:
- Produce a believable but debatable bench press estimate
- The result should feel intentional, not random
- Use prestige, competitiveness, physicality, discipline, and cultural stereotype energy
- Be funny and concise, but not offensive
- Keep bench_estimate between 135 and 405
- Keep explanation short, witty, and shareable (max 140 characters)

Scoring intuition:
- Elite competitive achievements should score high (295-405)
- Physically demanding achievements should score higher
- Technical/intellectual prestige can still score well through discipline and status (225-295)
- Average respectable achievements land 185-245
- Casual or low-effort inputs should score lower (135-185)
- Similar inputs should produce similar outputs

Reference calibration (aim near these ranges for similar inputs):
- "I'm an SDE3 at Amazon" → ~275 lbs
- "Grandmaster in StarCraft as Zerg" → ~315 lbs
- "Grandmaster in StarCraft as Protoss" → ~295 lbs
- "I run marathons" → ~210 lbs
- "I play video games all day" → ~155 lbs
- "Olympic weightlifter" → ~385 lbs

Safety rules:
- Refuse or soften clearly hateful, sexual, or self-harm related inputs
- If user enters nonsense, still try to produce a fun output unless it is unsafe
- Avoid protected-class stereotyping
- Keep humor generic and based on the achievement, not identity traits

Return ONLY valid JSON matching this exact schema (no markdown, no code fences):
{
  "normalized_input": string,
  "domain": string,
  "prestige": number (1-10),
  "physicality": number (1-10),
  "competitiveness": number (1-10),
  "discipline": number (1-10),
  "bench_estimate": integer (135-405),
  "confidence": number (0-1),
  "explanation": string (max 140 chars, witty)
}`;

/** Validate and clamp the parsed LLM response */
function validateResponse(data) {
  if (!data || typeof data !== 'object') return null;

  const required = [
    'normalized_input', 'domain', 'prestige', 'physicality',
    'competitiveness', 'discipline', 'bench_estimate', 'confidence', 'explanation'
  ];
  for (const key of required) {
    if (!(key in data)) return null;
  }

  // Clamp numeric fields
  data.prestige = clamp(Math.round(data.prestige), 1, 10);
  data.physicality = clamp(Math.round(data.physicality), 1, 10);
  data.competitiveness = clamp(Math.round(data.competitiveness), 1, 10);
  data.discipline = clamp(Math.round(data.discipline), 1, 10);
  data.bench_estimate = clamp(Math.round(data.bench_estimate), 135, 405);
  data.confidence = clamp(data.confidence, 0, 1);

  // Truncate explanation
  if (typeof data.explanation === 'string' && data.explanation.length > 160) {
    data.explanation = data.explanation.slice(0, 140);
  }

  return data;
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

/** Parse JSON from LLM output, handling markdown fences */
function parseJSON(text) {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

/** Call OpenAI API (gpt-4.1-mini) */
async function callLLM(input) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      max_tokens: 512,
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const result = await response.json();
  const text = result.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from OpenAI');

  return parseJSON(text);
}

export default async (req) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers
    });
  }

  try {
    const body = await req.json();
    const input = body?.input?.trim();

    if (!input || input.length === 0) {
      return new Response(JSON.stringify({ error: 'Input is required' }), {
        status: 400, headers
      });
    }

    if (input.length > 500) {
      return new Response(JSON.stringify({ error: 'Input too long (max 500 characters)' }), {
        status: 400, headers
      });
    }

    // Retry up to 2 times on parse failure
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const raw = await callLLM(input);
        const validated = validateResponse(raw);
        if (validated) {
          return new Response(JSON.stringify(validated), { status: 200, headers });
        }
        lastError = new Error('Invalid response structure from LLM');
      } catch (err) {
        lastError = err;
      }
    }

    console.error('All retries failed:', lastError);
    return new Response(JSON.stringify({
      error: 'Failed to generate result. Please try again.'
    }), { status: 502, headers });

  } catch (err) {
    console.error('Handler error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers
    });
  }
};

export const config = {
  path: '/api/benchmark'
};
