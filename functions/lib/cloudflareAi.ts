export interface MusicResponse {
  state: "Completed";
  result: { audio: string };
}

interface MusicModelInput {
  accountId: string;
  apiToken: string;
  prompt: string;
  lyrics: string;
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function isMusicResponse(value: unknown): value is MusicResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { state?: unknown; result?: { audio?: unknown } };
  return candidate.state === "Completed" && typeof candidate.result?.audio === "string";
}

function unwrapMusicResponse(value: unknown): MusicResponse | null {
  if (isMusicResponse(value)) return value;
  if (!value || typeof value !== "object") return null;
  const envelope = value as { success?: unknown; result?: unknown };
  return envelope.success === true && isMusicResponse(envelope.result) ? envelope.result : null;
}

export async function runMusicModel(input: MusicModelInput, fetcher: Fetcher = fetch): Promise<MusicResponse> {
  const response = await fetcher(
    `https://api.cloudflare.com/client/v4/accounts/${input.accountId}/ai/run`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "minimax/music-2.6",
        input: {
          prompt: input.prompt,
          lyrics: input.lyrics,
          lyrics_optimizer: false,
          is_instrumental: false,
          format: "mp3",
        },
      }),
    },
  );

  const body: unknown = await response.json();
  const music = unwrapMusicResponse(body);
  if (!response.ok || !music) {
    throw new Error("Cloudflare AI could not generate the song.");
  }
  return music;
}
