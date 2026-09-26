import { getStore } from "@netlify/blobs";

export default async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") || "";
  const json = (obj, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

  // the sync code is the "key" to your data — keep the rules strict
  if (!/^[A-Za-z0-9_.-]{4,64}$/.test(code)) return json({ error: "Invalid sync code" }, 400);

  const store = getStore({ name: "ironlog", consistencyMode: "strong" });

  if (req.method === "GET") {
    const data = await store.get(code);
    return new Response(data || '{"entries":{},"meta":{},"lastSaved":0}', {
      status: 200, headers: { "Content-Type": "application/json" }
    });
  }

  if (req.method === "POST" || req.method === "PUT") {
    const body = await req.text();
    if (body.length > 500_000) return json({ error: "Payload too large" }, 413);
    try { JSON.parse(body); } catch { return json({ error: "Invalid JSON" }, 400); }
    await store.set(code, body);
    return json({ ok: true });
  }

  return json({ error: "Method not allowed" }, 405);
};