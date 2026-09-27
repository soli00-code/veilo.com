# Veilo — Design Specification

**Product:** Veilo, a blind-dating web app. Two people match on compatibility and talk through text and voice messages — never photos, video, or calls — until they choose to know more about each other outside the app (or don't).

**Audience:** Adults tired of appearance-first swiping who want a conversation-first alternative. Skews 22–35, comfortable with apps, wary of superficiality.

**This document + the prototype folder (`/veilo-prototype`) together are the deliverable.** The HTML/CSS files are the visual source of truth — every color, spacing value, and state is real, working code you can inspect in a browser (view source, or open DevTools). This spec translates that into the tokens, redlines, and flow logic you'd need to rebuild the same system natively in Figma (frames, auto-layout, variables, components).

> **Fastest path into Figma:** open each HTML page in Chrome and use a plugin such as **html.to.design** or **Figma to Code (reverse)** to import the real DOM as layers, then swap in the Figma variables below so everything stays token-driven. Rebuilding by hand using the specs below works too, and gives you cleaner layer names.

---

## 1. Brand direction

**One-line concept:** *Talk first. See later — or never.*

Where most dating apps lead with a face, Veilo leads with a personality signal: an abstract color identity ("aura") and a nickname. The visual language needed to support that without feeling clinical or app-store-generic — so the direction is **bold and playful**, built around organic blob shapes (standing in for the "face" you don't get to see) and a vivid two-color gradient, not a muted, safety-first palette. Restriction (no photos, no calls) is framed throughout as a feature to be proud of, not a limitation to apologize for — see the "What you won't find here" section on the landing page for the tone this should carry everywhere.

---

## 2. Design tokens

### 2.1 Color

| Token | Hex | Role |
|---|---|---|
| `ink` | `#1B1330` | Primary text, dark surfaces |
| `ink-soft` | `#4A4159` | Secondary text |
| `paper` | `#FFF7ED` | App background (warm, not stark white) |
| `paper-raised` | `#FFFFFF` | Cards, inputs, raised surfaces |
| `violet` (primary) | `#7A3DF5` | Primary actions, links, focus states |
| `violet-deep` | `#5B22CE` | Pressed state, dark gradient stop |
| `pink` (secondary) | `#FF3E7C` | Gradient partner, alerts, unread indicators |
| `sun` (tertiary) | `#FFC93C` | Small pops — badges, notification dots |
| `mint` | `#17D6A6` | Voice/audio, "active now" status, success |
| `line` | `#EBE2F5` | Hairline borders on `paper` |
| `line-deep` | `#D8CBEF` | Borders on `paper-raised`, input borders |
| destructive | `#C4306B` | Block / report / delete confirmations |

**Primary gradient ("Signal"):** `linear-gradient(135deg, #7A3DF5 0%, #FF3E7C 100%)` — used on primary buttons, the hero CTA band, and step markers.
**Dark gradient ("Dusk"):** `linear-gradient(160deg, #251A3D 0%, #4B2472 100%)` — used on the desktop nav rail and the auth-screen side panel.

Six "aura" gradients are used for user avatars (assigned per user, not user-chosen beyond picking a favorite at signup):
1. `#7A3DF5 → #FF3E7C` 2. `#FFC93C → #FF3E7C` 3. `#17D6A6 → #7A3DF5` 4. `#FF3E7C → #FFC93C` 5. `#5B22CE → #17D6A6` 6. `#FF7A59 → #7A3DF5`

### 2.2 Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display / headings | **Fredoka** | 600 (SemiBold) | Rounded, bouncy — carries the "playful" half of the brand. Used for H1–H3, big numbers, nicknames. |
| Body / UI | **Inter** | 400 / 500 / 700 | Neutral, highly legible counterweight so long conversations stay easy to read. |

Type scale (fluid via `clamp()` for the two largest sizes):

| Style | Size | Line-height | Weight |
|---|---|---|---|
| Display 1 (hero H1) | 38–64px | 1.05 | 600, Fredoka |
| Display 2 (section H2) | 30–44px | 1.08 | 600, Fredoka |
| Display 3 (page H1 / card H2) | 22–28px | 1.2 | 600, Fredoka |
| Heading (card titles) | 18px | 1.3 | 600, Fredoka |
| Body large | 18px | 1.6 | 400, Inter |
| Body | 16px | 1.5 | 400, Inter |
| Body small | 14px | 1.5 | 400, Inter |
| Micro (timestamps, meta) | 12px | 1.4 | 400, Inter |

Line length target: ~46ch max for paragraph copy (`.body-lg` is capped at `max-width: 46ch`).

### 2.3 Spacing (4px base)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` — named `sp-1` through `sp-9`. Use these for every margin/padding/gap; nothing in the system uses an arbitrary value.

### 2.4 Radius

| Token | Value | Used for |
|---|---|---|
| `r-sm` | 10px | Small chips, focus outline corners |
| `r-md` | 18px | Inputs, buttons (non-pill), notification icons |
| `r-lg` | 28px | Cards, modals, the dark boundary/CTA bands |
| `r-full` | 999px | All primary/secondary buttons, chips, nav pills |
| Avatar "blob" | `61% 39% 52% 48% / 45% 55% 45% 55%` | Organic, asymmetric — never a perfect circle |

### 2.5 Elevation

Shadows are always tinted violet, never neutral grey:
- Card: `0 8px 24px -8px rgba(90,40,180,0.18)`
- Popover/modal: `0 16px 40px -12px rgba(90,40,180,0.28)`
- Primary button: `0 6px 16px -4px rgba(122,61,245,0.45)`

### 2.6 Motion

One rule: motion answers an action, it doesn't decorate a load. The only ambient animation in the system is the "finding your match" pulsing blob on the Home waiting state — everything else (button press, modal pop-in, mic recording pulse) responds to something the person just did. All motion respects `prefers-reduced-motion`.

---

## 3. Information architecture / sitemap

```
Public
 ├─ Landing (/)
 ├─ Log in
 └─ Register  →  5-step wizard:
      1. Account (email/password)
      2. Anonymous identity (nickname + aura color)
      3. Compatibility quiz (4 questions)
      4. Match preferences (seeking / age range / intent)
      5. Confirmation → Home

Logged-in app (persistent left rail on desktop / bottom tab bar on mobile)
 ├─ Home            — match dashboard: waiting / new-match reveal / active-match states, daily prompt
 ├─ Messages         — conversation list (active + past/unmatched)
 │    └─ Chat thread — text + voice messages, block/report/unmatch
 ├─ Feed             — text-only public posts, resonate + comment
 ├─ Notifications    — matches, messages, feed activity, safety updates
 ├─ Profile          — own identity, bio, interests, prompts, retake quiz
 └─ Settings         — account, notification prefs, blocked list, report history, delete account, logout
```

Notice what's *not* here: there is no browse/discover/swipe screen anywhere in the IA. Matching is presented to the person, never searched for — that constraint should stay true in Figma page structure too (don't add a "discover" frame later without revisiting this decision deliberately).

---

## 4. Core user flows

**Onboarding → first match**
Landing → Register (account → identity → quiz → preferences → confirmation) → Home (waiting state) → \[system finds a match, out of band] → Home (new-match reveal state) → Chat.

**Ending a match**
Chat → kebab menu → Unmatch (confirm) → returns to Messages, conversation moves to "past matches" section, Home returns to waiting state.

**Safety escalation**
Chat → kebab menu → Report (pick reason incl. "Asking for photos or off-app contact" as a first-class, pre-selected reason since that directly violates the product's core promise) → submit → conversation ends → Notifications later confirms review.

**Voice messaging**
Chat composer: text field + circular mic button + send button. Press-and-hold the mic to record (button turns pink and pulses while held); release to send. There is no attach/photo/camera icon anywhere in the composer — that omission is intentional and should never be "fixed" by a future contributor who assumes it's missing.

---

## 5. Component specifications

**Buttons** — pill-shaped (`r-full`), 46px min tap target, 14/28px padding. Primary = gradient fill + tinted shadow; Secondary = white fill + 2px border, borders go violet on hover; Ghost = transparent, text-only, for tertiary actions (Skip, Cancel inside light contexts).

**Inputs** — 2px border in `line-deep`, `r-md` radius, 14/16px padding, border goes `violet` on focus (no default browser outline; a custom 3px violet `focus-visible` ring is used site-wide for keyboard users).

**Avatar ("blob")** — sizes sm(40) / md(56) / lg(84) / xl(140). Always the aura gradient + 2-letter glyph from the nickname, centered. Never replaced with a photo placeholder, silhouette, or camera icon — those all imply a missing photo, which contradicts the product.

**Message bubble** — `r-lg` with one corner (bottom-left for them, bottom-right for you) reduced to 6px, mimicking a speech-tail without an actual tail graphic. Max width 68% of thread column.

**Voice bubble** — same shell as text bubble, containing: circular play/pause toggle (34px) → animated waveform (mint bars, or translucent white on your own messages) → duration label. Waveform bar heights are pre-rendered per message (see `paintWaveforms()` in `app.js`) so every voice message looks visually distinct.

**Compatibility ring** — SVG donut, 8px stroke, track in `line`, fill in the Signal gradient, percentage centered in Fredoct 600.

**Nav rail (desktop, ≥901px)** — 260px fixed, Dusk gradient background, white text at 72% opacity dropping to 100% + a soft highlight pill on the active item. Collapses entirely below 900px in favor of:

**Tab bar (mobile, ≤900px)** — 4 items only (Home, Messages, Feed, Profile) — Notifications and Settings are one tap deeper (via the bell icon in the mobile top bar, and via Profile, respectively) to keep the bar uncrowded.

**Modal** — centered overlay, 440px max width, `r-lg`, pop-in scale+fade on open. Used for: daily prompt answer, unmatch/report/block confirmations, delete-account confirmation, edit-identity.

---

## 6. Page-by-page notes

- **Landing** — Asymmetric hero (headline + CTA left, floating blob cluster + a sample "match found" card right) rather than a centered hero — avoid re-centering it later, that's a deliberate choice to feel less like a generic SaaS template. The "how it works" steps use blob-shaped numerals (not bare "01/02/03") to tie the sequence device back into the brand's core visual motif.
- **Login / Register** — Split-screen on desktop (Dusk-gradient brand panel + form), form-only on mobile. Register is a 5-step wizard with a segmented progress bar (`.stepper`) — steps are shown/hidden via state, never routed to separate URLs, so back/forward inside the wizard is instant.
- **Home** — The central object is match *status*, not a feed. Three states covered in the prototype (toggle at the top of the page is a prototype-only aid, not real product UI — remove it in the Figma file, and instead make these three states separate frames/variants of one "Match status card" component): waiting (pulsing blob + reassurance copy), new match (full reveal: aura, nickname, resonance %, three shared-answer highlights, CTA), active match (compact summary + "Open chat").
- **Messages** — Flat list, active match(es) at top, past/unmatched conversations below at reduced opacity with an "Unmatched" label instead of a timestamp.
- **Chat** — Full-bleed thread (rail persists on desktop, hides on mobile in favor of a back arrow) so the conversation gets maximum width. A dismissible tip bar reinforces the no-photo/video rule the first time someone opens a thread.
- **Feed** — Text-only composer with a live character counter (280 max, Twitter-length, to keep posts skimmable). "Like" is relabeled **Resonate** with a spark/starburst icon instead of a heart — small vocabulary choice that keeps the product's language about compatibility, not romance-by-default.
- **Profile** — Own identity is editable (nickname reshuffle, aura color) but changing it mid-conversation surfaces a warning in the edit modal, since an active match built context around the old nickname.
- **Notifications** — Grouped New / Earlier, four notification types (match, message, feed activity, safety/report status), each with a tinted icon chip keyed to the same semantic colors used elsewhere (violet=match, mint=message, pink=resonance, sun=safety).
- **Settings** — Grouped list pattern (Account / Notifications / Privacy & Safety / Legal / Danger zone). Blocked-people list lives here with one-tap unblock. Delete account requires a confirm modal that states plainly what's lost — no soft language.

---

## 7. Accessibility & responsive notes

- Every interactive element has a visible focus ring (3px solid violet, 2px offset) — don't strip this in Figma prototyping, carry it into dev handoff.
- Color is never the only signal: the "active now" status pairs a dot with the word "Active now"; unread state pairs a pink dot with bold weight, not color alone.
- Two breakpoints drive the whole system: **≥901px** (rail nav, multi-column grids) and **≤900px** (bottom tab bar, single column, mobile-optimized touch targets ≥44px).
- Reduced-motion users get the same states instantly, no pulsing/pop-in animation (see the `prefers-reduced-motion` block in `styles.css`).

---

## 8. File map (this delivery)

```
veilo-prototype/
├─ index.html          Landing
├─ login.html
├─ register.html       5-step wizard
├─ home.html            Match dashboard (3 states, toggle to preview)
├─ messages.html        Conversation list
├─ chat.html            Thread — text + voice, block/report/unmatch
├─ feed.html             Text-only posts
├─ profile.html
├─ notifications.html
├─ settings.html
├─ css/styles.css        Full design-system stylesheet (start here)
└─ js/app.js             Modals, waveform rendering, mic demo, wizard logic
```

Open `index.html` in a browser with the whole folder intact (so relative links resolve) to click through the entire flow.
