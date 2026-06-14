## Goal
Turn StoryU into a subscription product with a 7-day free trial, three tiers, in-app paywall, a profile/billing/community hub, sermons as a first-class template, brand voice, and PDF export.

---

## 1. Pricing & Tiers

All tiers: **7-day free trial**, auto-started on signup at Tier 1 (Storyteller). Community read + post on every tier. Card required to start trial.

| | Storyteller — $5/mo · $50/yr | Storyteller Pro — $10/mo · $100/yr | Creator — $20/mo · $200/yr |
|---|---|---|---|
| Stories | Unlimited | Unlimited | Unlimited |
| Keynotes & Talks (incl. Sermons) | 3 / month | 10 / month | Unlimited |
| Podcasts | 3 / month | Unlimited | Unlimited |
| Books | 1 / month | Unlimited | Unlimited |
| Community (read + post) | ✓ | ✓ | ✓ |
| Brand voice + uploads (image/video/audio) | ✓ | ✓ | ✓ |
| PDF export | ✓ | ✓ | ✓ |
| Reimagined (Veo/Nano Banana) | — | — | ✓ (pay-per-render credits) |

Reimagined uses **purchasable credit packs** on top of the Creator subscription (e.g. 20 / 50 / 200 renders). Each render decrements `reimagine_credits`; UI shows balance and a "Top up" CTA when low.

---

## 2. Trial & paywall flow

1. New signup → `handle_new_user` trigger seeds `profiles.subscription_tier = 'trial'`, `trial_ends_at = now() + 7 days`, `trial_tier = 'storyteller'`.
2. After first login → redirect to **`/welcome`** paywall (homepage-style hero, pill nav, cream/Fraunces aesthetic) showing the three tier cards + monthly/yearly toggle. Primary CTA = "Start 7-day free trial". Users can also "Continue trial" to skip into the app.
3. A small **trial countdown banner** sits in the TopBar ("4 days left · Choose plan").
4. Limit enforcement (`useTierLimits` hook) checks monthly counts before create actions in Keynote/Podcast/Book wizards. When hit → modal: "You've used your 3 keynotes this month — upgrade to keep going." with upgrade CTA.
5. On trial expiry without an active subscription → all create actions blocked, user is redirected to `/welcome` on next route change. Read access to existing content is preserved.

---

## 3. Profile hub (`/profile`)

A new page reachable from the sidebar/topbar avatar with tabs:

- **Profile** — avatar upload, full name, bio (textarea), title, location, website, social links (X, Instagram, YouTube, TikTok, LinkedIn, Facebook).
- **Brand voice** — short text box ("Who you are, how you sound") + uploads (image/video/audio for brand assets). Stored on `profiles.brand_voice` and `profile_assets` table. Used as system-prompt context by all AI builders (story refine, keynote, podcast, book, sermon).
- **Billing** — current plan, renewal date, trial countdown, "Manage subscription" → Stripe customer portal, Reimagined credit balance + "Buy credits".
- **Community** — shortcut to the user's posts + drafts (lives here as requested, in addition to the footer link).
- **Account** — email, password reset, sign out, delete account.

---

## 4. Community

- New footer link **Community** + sidebar entry + profile-hub tab.
- Existing `community_posts` table already supports sharing — surface it as `/community` feed with post composer (re-uses `SharePostDialog`). All paid + trialing users can read and post.

---

## 5. Sermons template

Add `sermon` as a first-class template alongside Keynote/Podcast:
- Sermon wizard prompts: scripture reference, congregation context, sermon arc (hook → text → exposition → application → call), length.
- Reuses `keynote-builder` edge function with a `template: 'sermon'` switch and a sermon-tuned system prompt.
- Appears in Keynote tab and Podcast tab template pickers (pastors/teachers can build either format from a sermon outline).
- Counts toward the Keynote monthly limit.

---

## 6. PDF export

- "Export PDF" action on every story, keynote, podcast script, book chapter, and sermon outline.
- Client-side render via `@react-pdf/renderer` (no server cost). Branded with the user's name/avatar from their profile.

---

## Technical section

### New routes
- `/welcome` — paywall (post-signup; also reachable from "Upgrade" CTAs).
- `/profile` — tabbed profile hub.
- `/community` — feed.
- `/billing/success` and `/billing/cancel` — Stripe return URLs.

### Database migration (single migration, with GRANTs + RLS)
```text
profiles  ADD COLUMN bio text, title text, location text, website text,
                     socials jsonb DEFAULT '{}'::jsonb,
                     brand_voice text,
                     subscription_tier text DEFAULT 'trial',
                     subscription_status text DEFAULT 'trialing',
                     subscription_interval text,
                     trial_ends_at timestamptz,
                     current_period_end timestamptz,
                     stripe_customer_id text,
                     stripe_subscription_id text,
                     reimagine_credits integer DEFAULT 0

subscription_events (id, user_id, event_type, payload jsonb, created_at)
usage_counters     (user_id, period_start, keynotes_count, podcasts_count, books_count, reimagines_count, PK(user_id, period_start))
profile_assets     (id, user_id, kind enum['image','video','audio'], url, label, created_at)
credit_purchases   (id, user_id, pack text, credits int, amount_cents int, stripe_session_id, created_at)
```
- All public-schema tables get `GRANT SELECT/INSERT/UPDATE/DELETE TO authenticated`, `GRANT ALL TO service_role`, RLS enabled, owner-scoped policies, plus admin/support read via `has_role()` (already in place).
- `handle_new_user` trigger updated to seed trial fields.
- DB function `public.check_tier_limit(_kind text)` returns boolean; called from wizard `onSubmit`.

### Stripe (Lovable seamless payments)
- Enable via `payments--enable_stripe_payments`.
- Six prices via `batch_create_product`: storyteller_monthly/yearly, pro_monthly/yearly, creator_monthly/yearly, all with 7-day trial. Three one-off Reimagined credit packs.
- Edge functions: `create-checkout-session`, `create-portal-session`, `create-credits-checkout`, `stripe-webhook` (updates `profiles` subscription fields, increments `reimagine_credits` on credit-pack purchase). Webhook is `verify_jwt = false`; others validate JWT in code.
- Default tax handling: `managed_payments` (full compliance) for digital subscriptions in supported seller countries; fallback to `automatic_tax` otherwise — confirmed at enable time.

### Frontend
- `useSubscription()` hook → reads `profiles` fields + `usage_counters`. Exposes `tier`, `isTrialing`, `daysLeft`, `canCreate(kind)`, `consume(kind)`.
- `<TierGate kind="keynote">` wrapper component renders upgrade modal when blocked.
- `<TrialBanner />` in `TopBar`.
- `PaywallPage` reuses Home's pill nav, Fraunces headings, cream surface, cloud illustrations.
- `ProfileHub` uses existing tabs primitive; brand voice/assets injected into all AI edge functions via a new `getUserContext(user_id)` helper.
- Sermon wizard added under `src/components/builders/SermonWizard.tsx`, registered in Keynote and Podcast tab template pickers.
- PDF export: `src/lib/pdf.tsx` with `@react-pdf/renderer` templates per content type; "Export PDF" button on each detail view.

### Memory updates
- New memory `mem://features/subscriptions` documenting tiers, limits, trial rules.
- New memory `mem://features/brand-voice` documenting how brand voice + assets feed every AI builder.
- Index updated.

---

## Out of scope (flagging now)
- Team/org billing, gift subscriptions, coupon codes, referral program.
- Localized pricing — single USD pricing at launch.
- Mobile app store billing.
