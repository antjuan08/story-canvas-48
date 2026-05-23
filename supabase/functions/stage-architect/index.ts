// Edge function: given a creative brief + user's stories, produce a presentation outline
// using Lovable AI Gateway with tool-calling for structured output.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const brief = await req.json();
    const {
      title, template_type, topic, audience, outcome,
      dynamics = [], pain_points, solution, length_minutes,
    } = brief || {};

    if (!title || !template_type) {
      return new Response(JSON.stringify({ error: "title and template_type are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load the user's stories (RLS-scoped via authed client)
    const { data: stories, error: storiesErr } = await supabase
      .from("stories")
      .select("id, title, body, tags, category")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (storiesErr) throw storiesErr;

    const compactStories = (stories ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      summary: (s.body ?? "").slice(0, 400),
      tags: s.tags ?? [],
      category: s.category ?? null,
    }));

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a master ${template_type} architect. Build a compelling outline that weaves the speaker's own stories into a clear arc. Use only the provided story IDs when referencing stories. Aim for a tight narrative with a hook, body, and call-to-action appropriate to the format.`;

    const userPrompt = `BRIEF
Title: ${title}
Format: ${template_type}
Topic: ${topic ?? ""}
Audience: ${audience ?? ""}
Desired outcome: ${outcome ?? ""}
Tone/dynamics: ${(dynamics as string[]).join(", ")}
Pain points: ${pain_points ?? ""}
Big idea / solution: ${solution ?? ""}
Target length (minutes / chapters): ${length_minutes ?? "flexible"}

AVAILABLE STORIES (use ids verbatim; pick the most relevant — leave story_ids empty for sections where none fit):
${JSON.stringify(compactStories, null, 2)}

Return an outline with 4-8 sections.`;

    const tool = {
      type: "function",
      function: {
        name: "build_presentation",
        description: "Return a structured outline for the presentation.",
        parameters: {
          type: "object",
          properties: {
            summary: { type: "string", description: "1-2 sentence through-line." },
            suggested_tags: { type: "array", items: { type: "string" } },
            outline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  section_title: { type: "string" },
                  beat: { type: "string", description: "Purpose of this section (hook, tension, turn, resolution, CTA, etc.)" },
                  notes: { type: "string", description: "Speaker notes / what to convey." },
                  story_ids: { type: "array", items: { type: "string" } },
                },
                required: ["section_title", "beat", "notes", "story_ids"],
                additionalProperties: false,
              },
            },
          },
          required: ["summary", "suggested_tags", "outline"],
          additionalProperties: false,
        },
      },
    };

    const aiRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "build_presentation" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit hit. Please wait a moment and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) throw new Error("AI did not return a structured outline");

    const plan = JSON.parse(argsStr);
    // Filter story_ids to only those the user actually owns
    const validIds = new Set(compactStories.map((s) => s.id));
    plan.outline = (plan.outline ?? []).map((s: any) => ({
      ...s,
      story_ids: (s.story_ids ?? []).filter((id: string) => validIds.has(id)),
    }));

    return new Response(JSON.stringify({ plan, story_count: compactStories.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("stage-architect error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
