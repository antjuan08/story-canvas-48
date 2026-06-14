import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

// Asks Lovable AI to pick the user's most impactful stories for a given creative purpose.
// Body: { purpose: "keynote" | "podcast" | "book", context: string, max?: number }
// Returns: { suggestions: [{ story_id, title, reason }] }
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("Missing LOVABLE_API_KEY");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { purpose = "keynote", context = "", max = 5 } = await req.json();
    const cap = Math.max(1, Math.min(10, Number(max) || 5));

    const { data: stories, error: storiesError } = await supabase
      .from("stories")
      .select("id, title, body, category, tags")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(60);
    if (storiesError) throw storiesError;
    if (!stories || stories.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const list = stories.map((s, i) =>
      `[${i + 1}] id=${s.id} | ${s.title}${s.category ? ` (${s.category})` : ""}\n${(s.body ?? "").slice(0, 350)}`,
    ).join("\n\n");

    const prompt = `You are a creative editor helping pick which of an author's personal stories best fit a new ${purpose}.

PROJECT BRIEF:
${context || "(no brief provided — pick the most universally resonant)"}

AVAILABLE STORIES (${stories.length}):
${list}

Pick up to ${cap} stories that would have the most emotional and thematic impact for this ${purpose}. Return ONLY valid JSON in this exact shape:
{"suggestions":[{"story_id":"<uuid>","reason":"<one short sentence>"}]}
Use story_id values exactly as shown above.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a precise editor. Output only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      const text = await aiResp.text();
      return new Response(JSON.stringify({ error: `AI error ${status}: ${text}` }), {
        status: status === 429 || status === 402 ? status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const validIds = new Set(stories.map((s) => s.id));
    const titleById = new Map(stories.map((s) => [s.id, s.title]));
    const suggestions = (Array.isArray(parsed.suggestions) ? parsed.suggestions : [])
      .filter((x: any) => x && typeof x.story_id === "string" && validIds.has(x.story_id))
      .slice(0, cap)
      .map((x: any) => ({
        story_id: x.story_id,
        title: titleById.get(x.story_id) ?? "",
        reason: typeof x.reason === "string" ? x.reason : "",
      }));

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
