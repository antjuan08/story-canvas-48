
ALTER TABLE public.reimagined_stories
  ADD COLUMN IF NOT EXISTS ref_image_url text,
  ADD COLUMN IF NOT EXISTS ref_video_url text,
  ADD COLUMN IF NOT EXISTS ref_audio_url text,
  ADD COLUMN IF NOT EXISTS use_image_as_first_frame boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS use_uploaded_audio boolean NOT NULL DEFAULT false;
