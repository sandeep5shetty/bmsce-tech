import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a form builder for a college platform called BMSCE.tech.
Given a plain English description, return ONLY a valid JSON object with this structure:
{
  "title": "string",
  "description": "string",
  "fields": [
    {
      "id": "field_1",
      "label": "string",
      "type": "text|email|tel|number|date|textarea|select|radio|checkbox|scale",
      "required": true|false,
      "placeholder": "string (only for text-like types)",
      "options": ["A", "B", "C"] (only for select, radio, checkbox),
      "min": 1, "max": 5, "minLabel": "Poor", "maxLabel": "Excellent" (only for scale)
    }
  ]
}
Always begin with a Name field and a USN field for any college-related form.
Return ONLY the raw JSON. No markdown fences, no explanation, nothing else.`;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt } = body as { prompt?: string };
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  let aiResponse: Response;
  try {
    aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach OpenAI" }, { status: 500 });
  }

  if (!aiResponse.ok) {
    const text = await aiResponse.text();
    return NextResponse.json(
      { error: `OpenAI error (${aiResponse.status}): ${text.slice(0, 200)}` },
      { status: 500 },
    );
  }

  const data = (await aiResponse.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "OpenAI returned empty response" }, { status: 500 });
  }

  let schema: unknown;
  try {
    schema = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "OpenAI returned invalid JSON" }, { status: 500 });
  }

  return NextResponse.json({ schema });
}
