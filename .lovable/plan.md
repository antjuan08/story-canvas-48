## The Stage — Guided Creation Wizard

Replace the current "New presentation" dialog with a Typeform-style multi-step wizard that gathers the brief, then uses Lovable AI to pick matching stories from the user's Vault and assemble the presentation.

### Flow (one question per step, with Back / Next)

1. **Template** — Sermon · Keynote · Podcast · Book (cards, single select)
2. **Title / working name** — short text
3. **Topic** — what is it about? (text)
4. **Audience** — who is it for? (text)
5. **Desired outcome** — what should they think, feel, or do? (text)
6. **Dynamics / tone** — chips (Inspirational, Funny, Reverent, Bold, Tender, Data-driven, Story-driven…) multi-select + free text
7. **Pain points** — what struggle are you addressing? (textarea)
8. **Solution / big idea** — your answer / through-line (textarea)
9. **Length / depth** — slider (5–60 min, or chapter count for Book)
10. **Review & generate** — summary of answers + "Build it"

### AI step (on "Build it")

- New edge function `stage-architect` (Lovable AI Gateway, default `google/gemini-3-flash-preview`, no API key needed).
- Server fetches the user's stories (`stories` rows for `user_id`) with `id, title, body, tags, category, grade`.
- Sends brief + compact story list to the model via **tool calling** (structured output) to return:
  ```
  {
    outline: [{ section_title, beat, story_ids: [], notes }],
    suggested_tags: [],
    summary: ""
  }
  ```
- Saves a new `presentations` row with:
  - `title`, `template_type`, `tags`
  - `content`: `{ brief, outline, summary, generated_at, model }`
- Inserts matching rows into `presentation_stories` (`presentation_id`, `story_id`, `position`) for each AI-picked story.
- Returns the new presentation; UI navigates to edit view (existing `PresentationEditorDialog`) with the outline visible.

### UI pieces

- New `src/components/stage/StageWizardDialog.tsx` — multi-step dialog with progress dots, Back/Next, Enter to advance, Esc to close-with-confirm. Reuses shadcn `Dialog`, `Input`, `Textarea`, `Badge`, `Slider`, `Button`.
- New `src/hooks/use-stage-architect.ts` — wraps `supabase.functions.invoke("stage-architect", { body: brief })`, handles 402/429 toasts.
- Update `src/pages/Stage.tsx`:
  - "New presentation" button and the empty-state "Create your first" button open `StageWizardDialog` instead of `PresentationEditorDialog`.
  - Keep `PresentationEditorDialog` for the **Edit** action on existing cards.
- Generating state: full-screen-ish overlay inside the dialog with a friendly "Curating stories from your vault…" animation.

### Backend

- `supabase/functions/stage-architect/index.ts`
  - Validates JWT, reads brief with zod.
  - Loads user's stories via service-role client (RLS-respecting by filtering on the authed `user_id`).
  - Calls Lovable AI Gateway with a `build_presentation` tool schema (sections + story_ids).
  - Returns JSON; the client does the inserts (so RLS stays user-scoped) OR the function does inserts as the user — recommended: **client-side insert** with the returned plan for simplicity and safety.
- `supabase/config.toml` — add `verify_jwt = true` block for `stage-architect`.

### Behavior details

- If the user has **zero stories**, the wizard still runs but the outline contains placeholder beats with a banner: "Record or write stories in The Vault to let AI weave them in."
- Tags from steps 6/8 are merged into the presentation's `tags`.
- The brief is stored in `content.brief` so the user can re-run / refine later (future: a "Regenerate outline" button).
- All errors surfaced as `sonner` toasts; rate-limit (429) and credits (402) get specific messages.

### Files to add / change

- add `src/components/stage/StageWizardDialog.tsx`
- add `src/hooks/use-stage-architect.ts`
- add `supabase/functions/stage-architect/index.ts`
- edit `supabase/config.toml` (function block)
- edit `src/pages/Stage.tsx` (swap dialog for new flow on create)

No database migrations needed — uses existing `presentations`, `presentation_stories`, `stories` tables.
