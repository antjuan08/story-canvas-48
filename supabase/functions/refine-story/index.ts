import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod";
import { requireUser } from "../_shared/auth.ts";

const BodySchema = z.object({
  text: z.string().min(1).max(20000),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);

    const system = `You are a gentle memoir editor. Polish the story for clarity, flow, and emotional resonance while preserving the author's voice, facts, and meaning. Do not invent details. Return ONLY JSON: {"title": "short evocative title (<=80 chars)", "refined": "the refined story"}.`;
    const user = parsed.data.text.slice(0, 16000);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": key,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "edge-fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return json({ error: `AI ${res.status}: ${t}` }, res.status);
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let out: { title?: string; refined?: string } = {};
    try { out = JSON.parse(content); } catch { /* ignore */ }

    return json({
      title: (out.title ?? "").toString().slice(0, 80) || "Untitled",
      refined: (out.refined ?? "").toString() || user,
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
