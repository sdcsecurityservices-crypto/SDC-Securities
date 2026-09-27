// Request bodies are read with a hard byte cap so an oversized or endless
// (chunked) upload cannot exhaust server memory. Content-Length is checked
// first but not trusted; the stream itself is counted.
async function readCapped(req: Request, max: number): Promise<Uint8Array | null> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > max) return null;
  if (!req.body) return new Uint8Array();
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

/** Body as text, or null when it exceeds `max` bytes. */
export async function cappedText(req: Request, max: number) {
  const bytes = await readCapped(req, max);
  return bytes === null ? null : new TextDecoder().decode(bytes);
}

/** Parsed JSON body, or null when it exceeds `max` bytes. Invalid JSON throws. */
export async function cappedJson<T = unknown>(req: Request, max: number): Promise<T | null> {
  const text = await cappedText(req, max);
  return text === null ? null : (JSON.parse(text) as T);
}

/** Multipart/form body, or null when it exceeds `max` bytes. */
export async function cappedForm(req: Request, max: number) {
  const bytes = await readCapped(req, max);
  if (bytes === null) return null;
  // readCapped always returns a Uint8Array that owns its whole buffer.
  return new Response(bytes.buffer as ArrayBuffer, {
    headers: { "content-type": req.headers.get("content-type") || "" },
  }).formData();
}

export const TOO_LARGE = { error: "Request is too large." } as const;
