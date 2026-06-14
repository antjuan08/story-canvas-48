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

    const { show_name, topic, format, length, story_ids = [] } = await req.json();

    let storiesContext = "";
    if (Array.isArray(story_ids) && story_ids.length) {
      const { data: stories } = await supabase
        .from("stories").select("id, title, body").in("id", story_ids).eq("user_id", user.id).limit(10);
      storiesContext = (stories ?? [])
        .map((s, i) => `Story ${i + 1} (id:${s.id}): ${s.title}\n${(s.body ?? "").slice(0, 800)}`)
        .join("\n\n");
    }

    const prompt = `You are a podcast producer. Build an episode outline.
Show: ${show_name || "Untitled show"}
Topic: ${topic || "(none)"}
Format: ${format || "solo narrative"}
Target length: ${length || "20 minutes"}

${storiesContext ? `Pull moments from these personal stories where they fit:\n\n${storiesContext}` : ""}

Return ONLY valid JSON:
{
  "episode_title": string,
  "logline": string (1-sentence summary),
  "intro_script": string (60-90 words spoken intro),
  "segments": [ { "name": string, "minutes": number, "talking_points": string[], "story_ref": string|null } ],  (3-5 segments)
  "outro_script": string (40-60 words),
  "show_notes": string[] (3-5 bullets)
}`;

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
    const payload = JSON.parse(aiJson.choices?.[0]?.message?.content ?? "{}");

    const { data: row, error } = await supabase.from("podcasts").insert({
      user_id: user.id,
      show_name: show_name || "Untitled show",
      episode_title: payload.episode_title ?? "Untitled episode",
      topic, format, length, story_ids, payload,
    }).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ podcast: row }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
