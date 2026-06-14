import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { audience, core_message, tone, length, story_ids = [] } = await req.json();

    let storiesContext = "";
    if (Array.isArray(story_ids) && story_ids.length) {
      const { data: stories } = await supabase
        .from("stories").select("title, body").in("id", story_ids).eq("user_id", user.id).limit(8);
      storiesContext = (stories ?? [])
        .map((s, i) => `Story ${i + 1}: ${s.title}\n${(s.body ?? "").slice(0, 800)}`)
        .join("\n\n");
    }

    const prompt = `You are a master keynote speechwriter.
Audience: ${audience || "general"}
Core message: ${core_message || "(none)"}
Tone: ${tone || "warm, confident"}
Length: ${length || "12 minutes"}

${storiesContext ? `Draw from these personal stories where relevant:\n\n${storiesContext}` : ""}

Produce a JSON object with:
- "title": short keynote title
- "opening": a 2-3 sentence hook
- "talking_points": array of 5-8 objects { "headline": string, "detail": string, "story_ref": string|null }
- "closing": a 2-3 sentence closing
- "callouts": 3 short tweet-length lines
Return ONLY valid JSON, no markdown fencing.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI error: ${text}` }), { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    const payload = JSON.parse(content);

    const { data: row, error } = await supabase.from("keynotes").insert({
      user_id: user.id,
      title: payload.title ?? "Untitled keynote",
      audience, core_message, tone, length,
      story_ids,
      payload,
    }).select().single();

    if (error) throw error;
    return new Response(JSON.stringify({ keynote: row }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
