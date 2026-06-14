import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

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
    const storyId: string = body.story_id;
    const duration: number = Number(body.duration_seconds) || 30;
    if (!storyId) return json({ error: 'story_id required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: story, error: sErr } = await admin
      .from('stories').select('id,title,body,user_id').eq('id', storyId).single();
    if (sErr || !story || story.user_id !== user.id) return json({ error: 'Story not found' }, 404);

    // 1) Film treatment
    const treatmentRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You turn personal stories into short-film treatments. Return strict JSON only.' },
          { role: 'user', content: `Story title: ${story.title}\n\nStory body:\n${story.body}\n\nDuration: ${duration} seconds.\n\nReturn JSON with keys: title, logline, video_prompt (vivid 2-3 sentence text-to-video prompt), cover_prompt (cinematic poster image prompt, painterly), mood.` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!treatmentRes.ok) {
      const t = await treatmentRes.text();
      if (treatmentRes.status === 429) return json({ error: 'Rate limit. Try again shortly.' }, 429);
      if (treatmentRes.status === 402) return json({ error: 'AI credits exhausted. Add credits in workspace billing.' }, 402);
      return json({ error: `Treatment failed: ${t}` }, 500);
    }
    const tj = await treatmentRes.json();
    let treatment: any = {};
    try { treatment = JSON.parse(tj.choices?.[0]?.message?.content ?? '{}'); } catch { treatment = {}; }

    // 2) Cover image (Nano Banana)
    let coverUrl: string | null = null;
    try {
      const imgRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOVABLE_API_KEY}` },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image',
          messages: [{ role: 'user', content: treatment.cover_prompt ?? `Cinematic film poster: ${treatment.logline ?? story.title}` }],
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

    // 3) Save
    const { data: saved, error: insErr } = await admin
      .from('reimagined_stories')
      .insert({
        user_id: user.id,
        source_story_id: story.id,
        title: treatment.title ?? story.title,
        angle: treatment.mood ?? null,
        payload: treatment,
        cover_url: coverUrl,
        status: 'cover_ready',
        duration_seconds: duration,
        video_prompt: treatment.video_prompt ?? null,
      })
      .select()
      .single();
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ reimagined: saved });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}
