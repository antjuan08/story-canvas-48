// Edge function: transcribe a speech recording and return AI coaching feedback + extracted stories.
import { requireUser } from "../_shared/auth.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(body: unknown) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`AI ${res.status}: ${t}`);
  }
  return res.json();
}

const PERSONA_PROMPTS: Record<string, string> = {
  ceo: "You coach Fortune-500 CEOs. Judge executive presence, clarity, conviction, brevity, and ability to inspire trust. Be candid like a board-level advisor.",
  public_speaker: "You coach TED-level public speakers. Judge stage presence, pacing, rhetorical devices, audience connection, and memorability.",
  communicator: "You coach corporate communicators. Judge clarity, structure, jargon, accessibility, and inclusivity.",
  storyteller: "You coach master storytellers. Judge narrative arc, sensory detail, emotional beats, character, and the 'so what'.",
  sermon: "You coach preachers. Judge scriptural anchor, illustration, application, cadence, and pastoral warmth.",
  podcast: "You coach podcast hosts. Judge conversational flow, pacing, energy, anecdote use, and listener retention.",
  casual: "You coach everyday conversation. Judge warmth, listening cues implied, story-worthiness, and authenticity.",
};

const CONTEXT_LABEL: Record<string, string> = {
  keynote: "live keynote on stage",
  podcast: "podcast recording",
  sermon: "sermon",
  casual: "casual conversation at a coffee shop",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;

  try {
    const { audioBase64, mimeType, topic, persona, context } = await req.json();
    if (!audioBase64) throw new Error("audioBase64 is required");
    if (typeof audioBase64 !== "string" || audioBase64.length > 30_000_000) {
      throw new Error("audioBase64 too large");
    }

    const dataUrl = `data:${mimeType || "audio/webm"};base64,${audioBase64}`;
    const format = (mimeType || "").includes("mp4") ? "mp4" : "webm";

    // 1) Transcribe
    const t = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a precise speech-to-text transcriber. Return only the verbatim transcript with natural punctuation." },
        { role: "user", content: [
          { type: "input_audio", input_audio: { data: dataUrl, format } },
          { type: "text", text: "Transcribe this speech." },
        ] },
      ],
    });
    const transcript = (t.choices?.[0]?.message?.content ?? "").toString().trim();

    const personaPrompt = PERSONA_PROMPTS[persona] ?? PERSONA_PROMPTS.storyteller;
    const ctxLabel = CONTEXT_LABEL[context] ?? "spoken delivery";

    // 2) Score + coach + extract stories
    const sys = `${personaPrompt}

Given a transcript from a ${ctxLabel}, return ONLY JSON of shape:
{
  "scores": {"pacing":1-10,"clarity":1-10,"filler_words":1-10,"energy":1-10,"structure":1-10},
  "overall_grade": "A"|"B"|"C"|"D"|"F",
  "summary": "2-3 sentence overall take in this coach's voice",
  "strengths": ["..."],
  "improvements": ["..."],
  "filler_count": number,
  "suggested_rewrite": "a polished opening line they could try next time",
  "extracted_stories": [
    {"title":"short title","hook":"one-line hook","body":"3-6 sentence retelling of the story they actually told, cleaned up","theme":"e.g. resilience","tags":["..."]}
  ]
}
Only include stories that are clearly told (with a moment, character, or anecdote). Return an empty array if none.`;

    const f = await callAI({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Topic/context: ${topic || "(none provided)"}\n\nTranscript:\n${transcript}` },
      ],
      response_format: { type: "json_object" },
    });
    let feedback: any = {};
    try { feedback = JSON.parse(f.choices?.[0]?.message?.content ?? "{}"); } catch { /* ignore */ }

    return new Response(JSON.stringify({ transcript, feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
