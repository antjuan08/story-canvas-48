// Edge function: transcribe audio + rewrite transcript as a story.
// Uses Lovable AI Gateway (OpenAI-compatible).
import { requireUser } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: unknown) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    const err: any = new Error(`AI gateway ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, audioBase64, mimeType, transcript } = await req.json();

    if (action === "transcribe") {
      if (!audioBase64) throw new Error("audioBase64 is required");
      const dataUrl = `data:${mimeType || "audio/webm"};base64,${audioBase64}`;
      const data = await callAI({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a precise speech-to-text transcriber. Return only the verbatim transcript of the provided audio, with natural punctuation. No commentary.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio." },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      });
      const text = data?.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ transcript: text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "rewrite") {
      if (!transcript) throw new Error("transcript is required");
      const data = await callAI({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a master storyteller. Rewrite the user's transcript as a vivid, immersive short story in storytelling mode. Keep the core meaning, add sensory detail, scene-setting, and emotional arc. Output in Markdown with a short evocative title as an H1, then the narrative. Do not include meta commentary.",
          },
          { role: "user", content: transcript },
        ],
      });
      const story = data?.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ story }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const status = e?.status === 429 || e?.status === 402 ? e.status : 500;
    const message =
      status === 429
        ? "Rate limit hit. Please wait a moment and try again."
        : status === 402
        ? "AI credits exhausted. Add credits in Settings → Workspace → Usage."
        : e?.message || "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
