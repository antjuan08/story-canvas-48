## Goal
Rebuild `/landing` to mirror reMarkable.com's structure, pacing, and feel — adapted to Storyou's brand (cream bone bg, ink anchor text, brass accent, Fraunces serif + Inter). Replace the current `src/pages/Landing.tsx` entirely. All imagery uses tasteful placeholder blocks with subtle scroll fade-ins.

## Scope
- Rewrite: `src/pages/Landing.tsx`
- Add: `src/assets/storyou-wordmark.svg` (from uploaded `Storyou_black_logo_large.png`) and `src/assets/storyou-mark.svg` (from `Storyou_black_icon_small.png`) as Lovable assets
- Small helper: `src/hooks/use-in-view.ts` for fade-in on scroll (IntersectionObserver, no new deps)
- No changes to `/`, auth, payments, or other routes

## Page structure (mirrors remarkable.com sectioning)

1. **Sticky top nav** — Storyou wordmark left; center nav links (Product ▾, Explore ▾, For teams, Support ↗) as visual-only dropdown affordances; right: account icon + pill "Get started" → `/`
2. **Hero** — full-bleed pastel placeholder (soft brass/bone gradient block) with:
   - Eyebrow chip: "Storyou Voice · NEW"
   - Huge Fraunces headline: "Made for storytelling" (two-line, tight leading)
   - Sub: "Move your voice easily from a spoken moment to keynote, podcast, book, and film — with an AI speaking coach built in."
   - Two buttons: primary "Learn more" + secondary "Get started →"
3. **Value strip** — 3 inline items with tiny icons: "Speak once, keep forever · Try free for 14 days · Cancel anytime"
4. **Product trio** ("Compare our story tools") — three tall cards side-by-side (Keynote / Podcast / Book), each with a colored placeholder panel (blue-tint, bone, warm-tint), Fraunces title with italic accent word ("Storyou *Keynote*"), one-line desc, "Learn more" ghost button. Stacks on mobile.
5. **"What is Storyou?" editorial band** — two large serif statements alternating left/right with hand-drawn-style SVG squiggle placeholders between them (mirrors the reMarkable "digital notebook…" section).
6. **"What is it made for?" feature grid** — 4 large alternating rows (image left/right zig-zag): Record · Refine · Publish · Reimagine. Each row: placeholder block + eyebrow + serif headline + short body. Fade-in on scroll.
7. **Reimagined showcase** — full-width dark (anchor) band with a wide 16:9 placeholder "video" tile, play-button overlay, caption "See a whisper become a short film."
8. **"Join 1M+ storytellers"** — split section: left copy block ("Connect to your favorite tools") with two buttons ("Learn about Storyou" / "Pricing and plans"), right decorative floating placeholder tiles (stacked cards) suggesting integrations.
9. **Testimonials** — reuse existing Supabase `testimonials` query; render as 3-col serif quote cards with star rating. Graceful hide if empty.
10. **Final CTA band** — inverted anchor bg, bone text, italic-accented headline, "Get started" pill.
11. **Footer** — reuse `<SiteFooter />`.

## Design tokens (locked)
- Bg: `brand-bone`; text: `brand-anchor`; accent: `brand-brass`
- Headlines: Fraunces, light weight (300), tight tracking, occasional italic accent word in brass
- Body: Inter, `text-anchor/60` for secondary
- Cards: `rounded-3xl`, `border-anchor/10`, generous padding, no shadows
- Placeholder blocks: soft tinted panels (`bg-anchor/[0.04]`, `bg-brass/10`, `bg-anchor/[0.06]`) with centered muted label like "Image placeholder" in tiny uppercase tracking, plus subtle inline SVG doodle for character
- Buttons: pill `rounded-full`, primary = anchor bg / bone text, secondary = bone bg / anchor border

## Motion
- Custom `useInView` hook adds `opacity-0 translate-y-4` → `opacity-100 translate-y-0` with `transition-all duration-700 ease-out` when section enters viewport (once). Applied to each major block and each feature row. No external motion lib.

## Responsiveness
- Mobile-first: single column, hero headline scales `text-5xl` → `sm:text-7xl` → `lg:text-8xl`
- Product trio stacks; zig-zag rows collapse to stacked image-then-text; nav collapses to wordmark + "Get started" only (hide center links under `lg`)
- Max container `max-w-7xl` with `px-6`

## Logo usage (from brand guide judgment)
- Nav + footer: wordmark SVG (small)
- Hero eyebrow / favicon-adjacent spots: cloud mark SVG
- Do not embed the raw PNG uploads in code; register via `lovable-assets` from `/mnt/user-uploads/`

## Out of scope
- No changes to `/`, `AppLayout`, auth, Supabase schemas, payments
- No new dependencies
- No real photography — all imagery is styled placeholder panels the user can swap later

## Technical notes
- Keep existing `SEO`, `SiteFooter`, `supabase` testimonials query, and `Button` component
- `useInView` returns `{ ref, inView }`; sections wrap children with a `<div ref={ref} className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>`
- All colors via semantic tokens (`brand-bone`, `brand-anchor`, `brand-brass`) — no hardcoded hex
