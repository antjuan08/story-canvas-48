// Edge function: transcribe a speech recording and return AI coaching feedback.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { audioBase64, mimeType, topic } = await req.json();
    if (!audioBase64) throw new Error("audioBase64 is required");

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

    // 2) Score + coach
    const sys = `You are a world-class speech coach. Given a transcript of a spoken keynote/speech, return ONLY JSON of shape:
{"scores":{"pacing":1-10,"clarity":1-10,"filler_words":1-10,"energy":1-10,"structure":1-10},"summary":"2-3 sentence overall take","strengths":["..."],"improvements":["..."],"filler_count":number,"suggested_rewrite":"a polished opening line they could try next time"}`;
    const f = await callAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Topic/context: ${topic || "(none provided)"}\n\nTranscript:\n${transcript}` },
      ],
      response_format: { type: "json_object" },
    });
    let feedback: unknown = {};
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
