import type { SungSongRequest } from "../domain/songRequest";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function requestSungSong(input: SungSongRequest, fetcher: Fetcher = fetch): Promise<string> {
  const response = await fetcher("/api/song", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await response.json() as { audioUrl?: string; error?: string };
  if (!response.ok || !body.audioUrl) {
    throw new Error(body.error ?? "The singer could not finish that take. Please try again.");
  }
  return body.audioUrl;
}
