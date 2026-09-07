function parseRange(value: string, size: number): { offset: number; length: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match) return null;
  if (!match[1] && !match[2]) return null;
  if (!match[1]) {
    const suffix = Math.min(Number(match[2]), size);
    return { offset: size - suffix, length: suffix };
  }
  const offset = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isInteger(offset) || !Number.isInteger(end) || offset < 0 || offset > end || offset >= size) return null;
  return { offset, length: end - offset + 1 };
}

export const onRequestGet: PagesFunction<Env, "key"> = async ({ request, env, params }) => {
  const key = String(params.key ?? "");
  if (!/^[a-f0-9]{64}$/.test(key)) return new Response("Not found", { status: 404 });
  const version = new URL(request.url).searchParams.get("rev") === "3" ? "v3" : "v2";
  const objectKey = `${version}/${key}.mp3`;
  const head = await env.SONGS.head(objectKey);
  if (!head) return new Response("Not found", { status: 404 });

  const rangeHeader = request.headers.get("Range");
  const range = rangeHeader ? parseRange(rangeHeader, head.size) : null;
  if (rangeHeader && !range) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${head.size}` } });
  }
  const object = await env.SONGS.get(objectKey, range ? { range } : undefined);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", "audio/mpeg");
  headers.set("Accept-Ranges", "bytes");
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  if (range) {
    const end = range.offset + range.length - 1;
    headers.set("Content-Range", `bytes ${range.offset}-${end}/${head.size}`);
    headers.set("Content-Length", String(range.length));
  } else {
    headers.set("Content-Length", String(head.size));
  }
  return new Response(object.body, { status: range ? 206 : 200, headers });
};
