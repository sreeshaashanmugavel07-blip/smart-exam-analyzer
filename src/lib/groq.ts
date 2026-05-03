import Groq from "groq-sdk";
import { parseModelJson } from "@/lib/json";

export const GROQ_MODEL = "llama3-70b-8192";

const JSON_ONLY_SYSTEM =
  "You return only valid minified JSON. No markdown, no code fences, no explanation.";

function getClient() {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey });
}

export async function groqJson<T = unknown>(
  userPrompt: string,
  systemExtra = ""
): Promise<T> {
  const groq = getClient();
  const system = [JSON_ONLY_SYSTEM, systemExtra].filter(Boolean).join("\n");
  const base = {
    model: GROQ_MODEL,
    temperature: 0.2,
    max_tokens: 8192,
    messages: [
      { role: "system" as const, content: system },
      { role: "user" as const, content: userPrompt },
    ],
  };

  let content: string | null = null;
  try {
    const completion = await groq.chat.completions.create({
      ...base,
      response_format: { type: "json_object" },
    });
    content = completion.choices[0]?.message?.content ?? null;
  } catch {
    const completion = await groq.chat.completions.create({ ...base });
    content = completion.choices[0]?.message?.content ?? null;
  }

  if (!content) throw new Error("Empty Groq response");
  return parseModelJson<T>(content);
}

export function clipExamText(text: string, maxChars = 14000): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n[...truncated for model context...]`;
}
