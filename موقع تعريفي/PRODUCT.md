# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: plain static HTML, CSS and JS with no build step (changed from the earlier Astro plan on 2026-10-23). The owner asked for "whatever runs efficiently and looks best." The home page is one canvas scene (`js/scene.js`) with real HTML controls laid over it, and the language switches in place. A framework would add nothing here, and this way the site opens straight from disk like the owner's other site. All editable content lives in `js/content.js`. Fonts are self-hosted in `fonts/`: Noto Kufi Arabic 800 (Arabic) and Silkscreen (Latin), both SIL OFL 1.1, free for personal and commercial use. The owner asked for open-source fonts only. `js/pixtext.js` rasterises them to hard pixels at a small native size (Kufi 12px, Silkscreen 8px) and scales by whole device pixels, both in the canvases and in the HTML windows.

## Users

The general public: anyone who lands on the owner's link, usually from one of their social profiles, and wants to know who this person is and where else to find them. No conversion goal; success is that the visitor understands who the owner is and reaches the account they want.

## Product Purpose

A personal introduction site for the owner: a short bio plus links to all their accounts in one place. It grows over time into a small personal space with gentle extra sections rather than staying a bare link list.

## Positioning

The owner's own corner of the web, not a generic link-in-bio service: a bilingual personal site in a pixel-art world, with room for personal touches (an adhkar section, a custom pixel character) that a hosted link page could not carry.

## Operating Context

- Visitors arrive mostly on phones, from social apps (YouTube, TikTok, Instagram, Telegram, Discord, GitHub).
- The site is bilingual: Arabic (RTL) and English (LTR), with a language switch. Both directions must be first-class, not one mirrored as an afterthought.
- The owner will maintain content themselves, so names, bio text, and links should live in one easy-to-edit place.

## Capabilities and Constraints

- **Home:** bio + account links. This is the primary surface.
- **Accounts to show:** YouTube, Telegram, TikTok, Instagram, Discord, GitHub. Actual URLs/handles not yet provided.
- **Planned later (not in first build):**
  - An adhkar (أذكار) section, described by the owner as gentle/light ("لطيفة").
  - A custom pixel-art character the owner will design themselves.
  Future structure should leave room for both without forcing them into the first release.
- **Open decisions:** display name (Arabic and English), what the owner does or is interested in, bio text, account URLs, deploy host. All deferred by the owner; use clearly marked placeholders, never invented details.

## Brand Commitments

- **Full pixel art** is a binding requirement from the owner ("ثيم بكسل آرت"; confirmed 2026-10-23 as full pixel art, not a hybrid).
- **Black theme, style from the owner's reference shorts** (six videos, frames and links in `مراجع/`): a dark night ground, navy and purple, fuchsia neon as the hero accent, plus crimson and gold. Dialog windows follow an old-OS look, and rain is part of the scene. Take the style only. Never reuse that channel's character «رائد» or «مكتبة رائد».
- **World: a quiet café on a rainy night** (the owner's own steer, 2026-10-23), seen from the wet street. The direction contract is in `.impeccable/surfaces/`.
- The pixel character, when it arrives, is the owner's own design and becomes a core identity asset.

## Evidence on Hand

None yet: no name, bio, photo, avatar, links, or artwork exist in the project. Do not fabricate a name, profession, follower counts, achievements, or handles. Placeholders must read as placeholders.

## Product Principles

1. **Reach the account fast.** The links are the job; the bio frames them, and nothing should stand between a visitor and the account they came for.
2. **Personal over generic.** Every addition should feel like the owner's space, not a template.
3. **Both languages equal.** Arabic and English get the same care, content parity, and correct direction.
4. **Grow without rebuilding.** The adhkar corner and pixel character slot in later as additions, not redesigns.
5. **Respectful tone for devotional content.** The adhkar section stays calm and gentle; playfulness elsewhere never trivializes it.

## Accessibility & Inclusion

- Correct `lang` and `dir` per language; RTL layout must be correct, not just mirrored text.
- Arabic text needs a legible Arabic typeface; pixel-style display treatment must not hurt reading of Arabic body text or adhkar.
- Link targets large enough for thumbs on phones; each account link labeled by name, not icon alone.
