import type { ExactSongRequest } from "../domain/exactSong";

// Browser-only: keep one request alive when React switches between lesson views.
const pending = new Map<string, Promise<string>>();
export function pendingExactSong(input: ExactSongRequest): Promise<string> | undefined {
  return pending.get(JSON.stringify(input));
}
export function requestExactSong(input: ExactSongRequest): Promise<string> {
  const key = JSON.stringify(input);
  const existing = pending.get(key);
  if (existing) return existing;
  const result = (async () => {
    const response = await fetch("/api/exact-song", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: key,
    });
    const body = await response.json() as { audioUrl?: string; error?: string };
    if (!response.ok || !body.audioUrl) throw new Error(body.error ?? "The recording could not be made. Please try again.");
    return body.audioUrl;
  })().finally(() => pending.delete(key));
  pending.set(key, result);
  return result;
}
