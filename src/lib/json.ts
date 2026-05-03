/** Parse model output that may be wrapped in ```json fences or prose. */
export function parseModelJson<T = unknown>(raw: string): T {
  const trimmed = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
  const body = fence ? fence[1].trim() : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  const slice =
    start >= 0 && end > start ? body.slice(start, end + 1) : body;
  return JSON.parse(slice) as T;
}
