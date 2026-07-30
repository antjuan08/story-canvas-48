# Podcast Pro — Product & Design Spec

> Distilled from the founders' voice-memo transcript (2026-07-30). This is the
> canonical spec for the Podcast Pro app being built in Lovable. Continue the
> build by referencing this doc — every feature below traces back to the
> transcript.

## 1. One-liner

Podcast Pro is an all-in-one operating system for podcasters, podcast
agencies, and studios: book shows and guests, plan content, run production
from idea to distribution, review edits with timecode notes, take payments,
and let AI (powered by StoryU + MCP connections to Claude/ChatGPT) do most of
the manual work.

## 2. Who it's for (account types / pricing tiers)

| Tier | Who | Notes |
|------|-----|-------|
| Individual Creator | Solo podcaster | Monthly fee |
| Team / Agency | Podcast agencies, creative teams | Seats + roles/permissions |
| Studio | Physical studios with members | Members page, studio booking, gear list, payments |
| Admin tier | Backend operators | Granular permissions on team/studio backends |

Add-on marketplace: consultants, creators, and human managers (bookkeeper-style
access) who run your production process for you — alongside the built-in AI
manager.

## 3. Core domains

### 3.1 Shows & Brands
- Multiple **brands** per account (personality-driven, e.g. "Dave Ramsey"-style),
  each brand hosting one or more **shows**.
- Every show gets its own: content calendar, guest list, keywords/tags, ads
  slots, pipeline, and analytics.
- **Podcast Network** tab: cross-pollinate guests between shows in the network.

### 3.2 Booking
- Inbound & outbound podcast bookings (you book guests; others book you).
- Shareable calendar link for being booked as a guest on other shows; the
  email link ingests into the calendar and integrates with **Zoom, Ecamm Live,
  Riverside**.
- **Studio booking**: members book studio time; studios manage their member
  pages, availability, and take payments.

### 3.3 Guests & CRM
- Built-in CRM for the guest list: contact info, history, which shows they've
  appeared on, cross-show suggestions.
- **Guest invites** sent from the app, including the **run of show**.

### 3.4 Content planning & AI development (StoryU)
- Content calendar per show.
- Develop your entire show + episode outlines with AI, **powered by StoryU**
  (StoryU holds your stories; an MCP connection sends stories into Podcast Pro
  for development).
- AI generation: episode **titles** (from keywords or the edited episode),
  descriptions, tags/keywords, and social captions.
- Podcast startup **checklist** for new shows.
- Email lists & leads: send announcements to followers from the app.

### 3.5 Production pipeline (per episode)
Stages: **Idea → Pending → Booked → Recording → Editing → Review/Approval →
Delivery → Distribution**, visible as a timeline/kanban per show.

Editing/delivery checklist (add items from a reusable **process list**):
- Multicam editing, color grading, audio mixing, thumbnails,
  WAV/MP3 export, and any custom steps — each individually checkable.
- **Alerts & notifications** when a stage completes; **approval process**
  before delivery.

### 3.6 Review & Timecode Notes
- Frame.io-style review: upload an HD file or connect **Dropbox / Google
  Drive / Frame.io (via MCP)**; view in-app; leave **timecoded comments** and
  assign changes.
- **Timecode Notes** (live capture): during a recording, tap/photo the
  timecode to log a note ("good clip here") so editors can jump straight to it
  and cut clips for social.

### 3.7 Team & permissions
- Invite your creative team; assign roles (outreach, outline, booking, editor).
- Admin tier with granular backend permissions per team/studio.
- No built-in chat — team chat runs through **Slack or Discord** integrations.
- Project management syncs with **Trello / Notion**.

### 3.8 Payments
- Stripe: studio bookings, paid guest slots ("book to be on your podcast"),
  and outbound **pay links**.
- Revenue analytics per podcast.

### 3.9 Ads
- Ads tab per show: which ads run on which episodes; brand/sponsor management;
  promo assets per audience.

### 3.10 Gear & Studio
- Gear list per studio/show: what everything was shot on, formats, photos of
  the studio and equipment. Gear **requests** for sessions.

### 3.11 Analytics
- Revenue per podcast; views pulled from **YouTube** (needs YouTube
  connection); per-show dashboards.

### 3.12 Distribution
- Future: push to Spotify, YouTube, and other distribution targets from the
  app.

### 3.13 AI assistant & MCP
- App-wide AI assistant: talk to it to assign tasks, book, plan — "very few
  things are manual."
- **MCP server** so Claude/ChatGPT can book and content-plan from outside the
  app, with changes appearing in-app for the whole team.
- Agents/bots that curate and post content on a recurring schedule based on
  your brand and topics.

## 4. Integrations summary

Gmail, Notion, Claude, ChatGPT, Zoom, Ecamm Live, Riverside, Slack, Discord,
Trello, Dropbox, Google Drive, Frame.io, YouTube, Spotify (distribution),
Stripe (payments), StoryU (stories → show development, via MCP).

## 5. Information architecture (v1 navigation)

- **Dashboard** — today's recordings, pipeline snapshot, alerts, revenue
- **Shows** (Brands) — show cards → show detail: calendar, episodes, guests,
  ads, keywords, gear
- **Pipeline** — kanban/timeline across episodes with stage checklists
- **Bookings** — inbound/outbound, studio calendar, share-my-link
- **Guests** — CRM + network cross-pollination
- **Review** — media review queue with timecode comments
- **Team** — members, roles, invites, permissions
- **Analytics** — revenue + YouTube views
- **Integrations** — connection hub
- **AI Assistant** — persistent panel/command bar

## 6. Design direction ("designed with Fable")

A dark, broadcast-studio aesthetic with a tech feel — the app should feel like
a control room, not a spreadsheet.

- **Palette**: near-black charcoal base (`#0E0F12`), elevated panels
  (`#16181D`), soft off-white text (`#F2F0EA`); signature **"ON AIR" red**
  accent (`#E5484D`) for live/recording states and primary actions; warm amber
  (`#F5A623`) for pending, green (`#30A46C`) for delivered/approved.
- **Type**: a confident grotesk display for headings (e.g. Space Grotesk),
  clean humanist sans for body (e.g. Inter), tabular mono for timecodes and
  metrics (e.g. JetBrains Mono).
- **Signature elements**: VU-meter-style progress bars for pipeline stages, an
  "ON AIR" pill for recording status, timecode chips (`00:42:17`) rendered in
  mono everywhere, waveform motifs as section dividers.
- **Layout**: left rail navigation, dense-but-breathing cards, command-bar
  (⌘K) for the AI assistant.

## 7. Build phasing

- **Phase 1 (Lovable scaffold — in progress)**: design system, auth
  (Supabase), Dashboard, Shows, Pipeline board with stage checklists, Guests
  CRM, Bookings calendar, Team & roles, stub pages for Analytics /
  Integrations / Review, AI assistant command bar (UI).
- **Phase 2**: Stripe payments, real Google/YouTube/Slack/Notion OAuth
  integrations, review player with timecode comments, notifications.
- **Phase 3**: MCP server, StoryU connection, agents/bots, distribution,
  consultant/manager marketplace.
