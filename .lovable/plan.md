# StoryYou — Master Update Plan

This is a very large scope (auth, 10 DB tables, 7 reworked pages, community feed, licensing, analytics, collaboration). To ship reliably I'll break it into phases and confirm before each. Phase 1 lays the foundation everything else depends on.

---

## Phase 1 — Foundation (this build)

**Auth**
- Enable email/password (auto-confirm ON so no verification step, per your spec).
- Enable Google OAuth via Lovable Cloud managed social login. Apple is supported and can be added in Phase 1b. **Facebook and X (Twitter) are NOT supported by Lovable Cloud's managed auth** — I'll note this and we can revisit via direct Supabase config later.
- `/auth` page with email + Google buttons, session listener, protected routes.

**Database schema (single migration)**
All 10 tables from spec: `profiles`, `stories`, `folders`, `collections`, `collection_stories`, `story_collaborators`, `presentations`, `presentation_stories`, `recordings`, `community_posts`, `license_requests`.
- `handle_new_user` trigger with EXCEPTION block → auto-insert profile row.
- `update_updated_at_column` trigger on stories/profiles/presentations.
- RLS on every table per Section 12.
- Storage buckets: `profile-avatars` (public), `story-media` (public), `recordings` (public).

**Sidebar rename + reorder**
Dashboard → The Vault → The Stage → Recordings → Storytellers → Analytics → Settings. Routes: `/dashboard`, `/vault`, `/stage`, `/recordings`, `/storytellers`, `/analytics`, `/settings`. Old `/library`, `/keynotes`, `/record` redirect to new paths.

**Layout/framing fix carry-over**
Keep the existing centered max-w-[1600px] container; verify nothing leaks off-screen at 1010px.

## Phase 2 — The Vault (next build)
Stories CRUD, image/audio/video upload to `story-media`, tags, folders, collections, search, sections, ellipsis menu actions, simple heuristic grading (A–D).

## Phase 3 — Dashboard + The Stage
Rotating story carousel from user's stories, 3 analytics count cards, grading panel. Stage template selector (Sermon/Keynote/Podcast/Book), folder/collection/tag.

## Phase 4 — Recordings page rebuild
Move existing recording UI to `/recordings`, add playlists/folders, link to stories/presentations, scaffold "AI Analysis Coming Soon" card.

## Phase 5 — Storytellers + Licensing
Community feed, public/private toggle on stories, license request flow, cross-post share-link export.

## Phase 6 — Analytics + Settings + Collaboration + Responsive polish
Recharts (growth, variety, impact). Full settings sections. Story collaborators with perspectives + merge. Mobile bottom nav, sheet modals, 44px tap targets.

---

## Technical notes
- Profiles trigger uses `SECURITY DEFINER` + `EXCEPTION WHEN unique_violation THEN RETURN NEW;`
- Roles aren't part of spec yet — skipping the `user_roles` table until needed.
- Avatar/media uploads use signed paths `{user_id}/{filename}` so RLS works.
- Existing local `mediaStore`/`recordingsStore` (zustand) stay for now; Phase 2 migrates Vault to Supabase, Phase 4 migrates Recordings.
- Charts library: Recharts (already in shadcn).
- Facebook/X social login: out of scope until we connect external Supabase or use a third-party OAuth broker.

## What I'd like to confirm before starting Phase 1
1. **Auto-confirm email signup**: you said disable verification → I'll set `auto_confirm_email: true`. ✅ assumed yes.
2. **Facebook/X auth**: OK to ship Google (+ Apple optional) now and defer FB/X? 
3. **Phase 1 only this turn**, then I pause for your go-ahead on Phase 2? Or do you want me to chain through all phases without stopping?

Reply "go" (or with answers) and I'll execute Phase 1.
