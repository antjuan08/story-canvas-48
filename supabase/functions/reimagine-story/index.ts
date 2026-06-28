import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const REPLICATE_KEY = Deno.env.get('LOVABLE_CONNECTOR_REPLICATE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let creditReserved = false;
  let reservedUserId: string | null = null;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    const auth = req.headers.get('Authorization');
    if (!auth) return json({ error: 'Unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData.user;
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const storyId: string | null = body.story_id ?? null;
    const duration: number = Number(body.duration_seconds) || 30;
    const refImageUrl: string | null = body.ref_image_url ?? null;
    const refVideoUrl: string | null = body.ref_video_url ?? null;
    const refAudioUrl: string | null = body.ref_audio_url ?? null;
    const useImageAsFirstFrame: boolean = !!body.use_image_as_first_frame;
    const useUploadedAudio: boolean = !!body.use_uploaded_audio;
    const customPrompt: string = (body.prompt ?? '').toString().trim();

    let storyTitle = customPrompt.slice(0, 80) || 'Reimagined';
    let storyBody = customPrompt;
    if (storyId) {
      const { data: story, error: sErr } = await admin
        .from('stories').select('id,title,body,user_id').eq('id', storyId).single();
      if (sErr || !story || story.user_id !== user.id) return json({ error: 'Story not found' }, 404);
      storyTitle = story.title;
      storyBody = story.body ?? '';
    }
    if (!storyId && !customPrompt && !refImageUrl && !refVideoUrl) {
      return json({ error: 'Provide a story, a prompt, or a reference photo/video.' }, 400);
    }

    // Atomically reserve 1 Reimagined credit BEFORE any AI work.
    const { data: newBalance, error: creditErr } = await admin.rpc(
      'consume_reimagine_credit',
      { _user_id: user.id },
    );
    if (creditErr) return json({ error: creditErr.message }, 500);
    if (newBalance === null || newBalance === undefined) {
      return json(
        { error: "You're out of Reimagined credits. Buy more in Profile → Billing." },
        402,
      );
    }
    creditReserved = true;
    reservedUserId = user.id;


    // 1) Film treatment
    let treatment: any = { title: storyTitle, video_prompt: customPrompt || storyBody, mood: null };
    if (storyBody || customPrompt) {
      const treatmentRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You turn personal stories into short-film treatments. Return strict JSON only.' },
            { role: 'user', content: `Story title: ${storyTitle}\n\nStory body:\n${storyBody}\n\nDuration: ${duration} seconds.\n\nReturn JSON with keys: title, logline, video_prompt (vivid 2-3 sentence text-to-video prompt), cover_prompt (cinematic poster image prompt, painterly), mood.` },
          ],
          response_format: { type: 'json_object' },
        }),
      });
      if (treatmentRes.ok) {
        const tj = await treatmentRes.json();
        try { treatment = { ...treatment, ...JSON.parse(tj.choices?.[0]?.message?.content ?? '{}') }; } catch { /* keep fallback */ }
      } else if (treatmentRes.status === 429) {
        return json({ error: 'Rate limit. Try again shortly.' }, 429);
      } else if (treatmentRes.status === 402) {
        return json({ error: 'AI credits exhausted. Add credits in workspace billing.' }, 402);
      }
    }

    // 2) Cover image (Nano Banana) — skipped if a reference image is supplied
    let coverUrl: string | null = refImageUrl;
    if (!coverUrl) {
      try {
        const imgRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image',
            messages: [{ role: 'user', content: treatment.cover_prompt ?? `Cinematic film poster: ${treatment.logline ?? storyTitle}` }],
            modalities: ['image', 'text'],
          }),
        });
        if (imgRes.ok) {
          const j = await imgRes.json();
          const imgs = j.choices?.[0]?.message?.images;
          let dataUrl: string | undefined =
            (Array.isArray(imgs) && imgs[0]?.image_url?.url) ||
            (typeof j.choices?.[0]?.message?.content === 'string' ? j.choices[0].message.content : undefined);
          if (dataUrl && dataUrl.startsWith('data:')) {
            const base64 = dataUrl.split(',')[1];
            const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            const path = `reimagined/${user.id}/${crypto.randomUUID()}.png`;
            const up = await admin.storage.from('story-media').upload(path, bytes, {
              contentType: 'image/png', upsert: false,
            });
            if (!up.error) {
              const { data: pub } = admin.storage.from('story-media').getPublicUrl(path);
              coverUrl = pub.publicUrl;
            }
          }
        }
      } catch (_) { /* optional */ }
    }

    // 3) Optional image-to-video via Replicate (only if connector is linked AND user opted in)
    let videoUrl: string | null = null;
    let status = 'cover_ready';
    let videoNote: string | null = null;

    if (REPLICATE_KEY && refImageUrl && useImageAsFirstFrame) {
      try {
        const GW = 'https://connector-gateway.lovable.dev/replicate/v1';
        const RAUTH = {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'X-Connection-Api-Key': REPLICATE_KEY,
        };
        const createRes = await fetch(`${GW}/models/wan-video/wan-2.2-i2v-fast/predictions`, {
          method: 'POST',
          headers: { ...RAUTH, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: {
              image: refImageUrl,
              prompt: treatment.video_prompt ?? `Animate this scene cinematically: ${storyTitle}`,
            },
          }),
        });
        if (createRes.ok) {
          const created = await createRes.json();
          const pid = created.id;
          // Poll (max ~3 min — keep edge function within timeout)
          for (let i = 0; i < 30; i++) {
            await new Promise((r) => setTimeout(r, i < 4 ? 3000 : 6000));
            const pollRes = await fetch(`${GW}/predictions/${pid}`, { headers: RAUTH });
            if (!pollRes.ok) break;
            const p = await pollRes.json();
            if (p.status === 'succeeded') {
              const out = Array.isArray(p.output) ? p.output[0] : p.output;
              if (typeof out === 'string') {
                // Persist to our storage (Replicate URLs expire ~1h)
                try {
                  const r = await fetch(out);
                  const buf = new Uint8Array(await r.arrayBuffer());
                  const path = `reimagined/${user.id}/${crypto.randomUUID()}.mp4`;
                  const up = await admin.storage.from('story-media').upload(path, buf, {
                    contentType: 'video/mp4', upsert: false,
                  });
                  if (!up.error) {
                    const { data: pub } = admin.storage.from('story-media').getPublicUrl(path);
                    videoUrl = pub.publicUrl;
                    status = 'video_ready';
                  } else {
                    videoUrl = out; // fall back to ephemeral URL
                    status = 'video_ready';
                  }
                } catch {
                  videoUrl = out;
                  status = 'video_ready';
                }
              }
              break;
            }
            if (p.status === 'failed' || p.status === 'canceled') {
              videoNote = p.error ?? 'Video render failed';
              break;
            }
          }
          if (!videoUrl && !videoNote) videoNote = 'Render still in progress — refresh shortly.';
        } else {
          videoNote = `Replicate ${createRes.status}`;
        }
      } catch (e) {
        videoNote = (e as Error).message;
      }
    }

    // 4) Save
    const { data: saved, error: insErr } = await admin
      .from('reimagined_stories')
      .insert({
        user_id: user.id,
        source_story_id: storyId,
        title: treatment.title ?? storyTitle,
        angle: treatment.mood ?? null,
        payload: { ...treatment, video_note: videoNote },
        cover_url: coverUrl,
        video_url: videoUrl,
        status,
        duration_seconds: duration,
        video_prompt: treatment.video_prompt ?? null,
        ref_image_url: refImageUrl,
        ref_video_url: refVideoUrl,
        ref_audio_url: refAudioUrl,
        use_image_as_first_frame: useImageAsFirstFrame,
        use_uploaded_audio: useUploadedAudio,
      })
      .select()
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    creditReserved = false; // output produced — keep the credit consumed
    return json({ reimagined: saved, note: videoNote });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  } finally {
    // Refund if we reserved a credit but never produced output.
    if (creditReserved && reservedUserId) {
      try {
        await admin.rpc('increment_reimagine_credits', {
          _user_id: reservedUserId,
          _delta: 1,
        });
      } catch { /* best-effort refund */ }
    }
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
