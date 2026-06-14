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

    const { story_id, angle } = await req.json();
    if (!story_id) return new Response(JSON.stringify({ error: "story_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: story } = await supabase.from("stories").select("title, body").eq("id", story_id).eq("user_id", user.id).single();
    if (!story) return new Response(JSON.stringify({ error: "Story not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const prompt = `Reimagine this personal story in 3 distinct alternate framings.
Original title: ${story.title}
Original body: ${(story.body ?? "").slice(0, 2000)}
${angle ? `Special angle to explore: ${angle}` : ""}

Return ONLY valid JSON:
{
  "variations": [
    { "title": string, "lens": string (e.g. "noir detective", "myth", "future POV"), "snippet": string (180-260 words), "mood": string }
  ] (exactly 3 items, each with a wildly different lens)
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

    const { data: row, error } = await supabase.from("reimagined_stories").insert({
      user_id: user.id,
      source_story_id: story_id,
      angle: angle ?? null,
      title: `Reimagined: ${story.title}`,
      payload,
    }).select().single();
    if (error) throw error;

    return new Response(JSON.stringify({ reimagined: row }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
