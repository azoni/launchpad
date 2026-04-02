// POST /api/benchmark
// Accepts { input: string } and returns a structured bench press estimate via LLM

const SYSTEM_PROMPT = `You are Benchmark, a model that converts any statement, identity, achievement, or accomplishment into an estimated bench press max in pounds.

Your job is to reason about the input using REAL statistics and data, then map it to a bench press equivalent.

## How to reason (do this internally, not in the output)

1. RESEARCH THE ACHIEVEMENT: Think about real-world data for the input:
   - How many people in the world have achieved this? What percentile is it?
   - How many years of dedicated effort does it typically take?
   - What is the selection rate / acceptance rate / success rate?
   - What level of physical or mental demand is involved?
   - How competitive is the field?

2. MAP TO BENCH PRESS PERCENTILES using real lifting statistics:
   - 135 lbs = ~50th percentile male (most untrained adults)
   - 185 lbs = ~75th percentile (regular gym-goer, 1-2 years training)
   - 225 lbs = ~90th percentile (dedicated lifter, 2-4 years)
   - 275 lbs = ~95th percentile (serious strength athlete, 4-7 years)
   - 315 lbs = ~98th percentile (advanced competitor)
   - 365 lbs = ~99.5th percentile (elite level)
   - 405 lbs = ~99.9th percentile (near-professional strength)

3. MATCH PERCENTILES: If the achievement puts someone in the top 2% of their field, the bench equivalent should be around the top 2% of lifters (~315 lbs). The rarer and harder the achievement, the higher the bench.

## Examples with reasoning

- "I'm an SDE3 at Amazon" → ~275 lbs
  Reasoning: SDE3 = L6 at Amazon. ~15% of Amazon engineers reach L6. Takes 6-10 years. Top ~5-8% of all software engineers by comp. That's serious but not ultra-elite → maps to ~95th percentile bench.

- "Grandmaster in StarCraft as Zerg" → ~315 lbs
  Reasoning: GM is top ~200 players per region out of millions. Top 0.2%. Zerg is mechanically hardest race. Years of 8+ hour days. Maps to ~98-99th percentile bench.

- "I run marathons" → ~210 lbs
  Reasoning: ~0.5% of the US population has finished a marathon. Impressive but achievable with 4-6 months training. Not ultra-elite unless specifying a fast time. Maps to ~85th percentile bench.

- "I play video games all day" → ~155 lbs
  Reasoning: No competitive achievement, no discipline signal. Extremely common. Maps to ~60th percentile bench.

- "Olympic weightlifter" → ~385 lbs
  Reasoning: Even qualifying for Olympic-level competition puts you in the top 0.01% of all athletes. Decades of training, extreme physicality. Maps to ~99.5th+ percentile.

## Scoring fields

Rate these 1-10 based on real data:
- prestige: How impressive is this to the general public? (Harvard PhD = 9, local 5K finisher = 3)
- physicality: How physically demanding? (Olympic swimmer = 10, chess GM = 2)
- competitiveness: How many people are trying and failing? (NFL player = 10, hobbyist baker = 2)
- discipline: Years of consistent effort required? (concert pianist = 10, passed driver's test = 1)

## Output rules
- bench_estimate: integer 135-405, derived from percentile mapping above
- explanation: max 140 chars, witty and shareable. Reference a real stat or comparison when possible.
- confidence: 0-1, how confident you are in the percentile mapping (lower if input is vague)

## Safety
- Refuse or soften hateful, sexual, or self-harm inputs
- If user enters nonsense, still produce a fun output unless unsafe
- Avoid protected-class stereotyping
- Humor should be about the achievement, not identity traits

Return ONLY valid JSON (no markdown, no code fences):
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
