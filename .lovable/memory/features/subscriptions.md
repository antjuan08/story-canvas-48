---
name: Subscriptions & paywall
description: Tier pricing, 7-day trial flow, paywall page, profile/billing hub, Stripe integration
type: feature
---
**Provider:** Stripe via Lovable seamless payments. Price IDs (sandbox + live): `storyteller_monthly/yearly` ($5/$50), `pro_monthly/yearly` ($10/$100), `creator_monthly/yearly` ($20/$200). Credit packs: `credits_20` ($10), `credits_50` ($20), `credits_200` ($60).

**Trial:** Auto-started on signup at `storyteller` tier (handle_new_user trigger sets trial_ends_at = now() + 7 days). Card required at checkout to convert. Trial banner in TopBar links to `/welcome`.

**Tiers (src/lib/tiers.ts TIER_LIMITS):**
- storyteller: unlimited stories, 3 keynotes/mo, 3 podcasts/mo, 1 book/mo
- pro: unlimited stories, 10 keynotes/mo, unlimited podcasts + books
- creator: unlimited everything + Reimagined (pay-per-render credits)
All tiers: community read+post, brand voice, PDF export.

**Enforcement:** `useSubscription()` hook exposes `canCreate(kind)`. DB function `public.check_tier_limit(text)` mirrors the same caps server-side. `public.increment_usage(text)` bumps monthly counters.

**Webhook:** `supabase/functions/payments-webhook` updates both `subscriptions` (raw) and `profiles.subscription_*` (derived: tier, status, interval, period_end, trial_ends_at, customer_id). Credit-pack `checkout.session.completed` increments `profiles.reimagine_credits` and inserts into `credit_purchases`.

**Routes:** `/welcome` (paywall), `/profile` (tabbed: Profile / Brand voice / Billing / Community / Account), `/community` (feed), `/billing/return` (Stripe return).

**Customer portal:** `create-portal-session` edge function returns URL; opens in new tab from Profile → Billing tab.
