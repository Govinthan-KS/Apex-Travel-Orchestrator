/**
 * Stable JSON stringify with sorted keys (recursive).
 * Matches Python's json.dumps(obj, sort_keys=True, separators=(",", ":"))
 */
export function stableStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "number" || typeof obj === "boolean") return JSON.stringify(obj);
  if (typeof obj === "string") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map((item) => stableStringify(item)).join(",") + "]";
  }
  if (typeof obj === "object") {
    const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = sortedKeys.map(
      (key) => JSON.stringify(key) + ":" + stableStringify((obj as Record<string, unknown>)[key])
    );
    return "{" + pairs.join(",") + "}";
  }
  return String(obj);
}
