import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod";
import { requireUser } from "../_shared/auth.ts";

const CATEGORIES = ["Family", "Friendship", "Business", "Hard Times", "Love", "Travel", "Childhood", "Faith", "Other"] as const;

const BodySchema = z.object({
  title: z.string().min(1).max(500),
  body: z.string().max(20000).optional().default(""),
  existing_tags: z.array(z.string()).optional().default([]),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const { title, body, existing_tags } = parsed.data;

    const system = `Categorize a personal story into ONE category from: ${CATEGORIES.join(", ")}. Also extract 3-6 lowercase keyword tags. Return ONLY JSON: {"category": "...", "tags": ["..."]}`;
    const user = `Title: ${title}\n\nStory:\n${body.slice(0, 4000)}\n\nExisting tags: ${existing_tags.join(", ") || "(none)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": key,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "edge-fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
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
    let parsedOut: { category?: string; tags?: string[] } = {};
    try { parsedOut = JSON.parse(content); } catch { /* ignore */ }

    const category = CATEGORIES.includes(parsedOut.category as any) ? parsedOut.category! : "Other";
    const tags = Array.isArray(parsedOut.tags)
      ? parsedOut.tags.map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6)
      : [];

    return json({ category, tags });
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
