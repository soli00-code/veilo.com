# Veilo — blind dating, built on words and voice

A full-stack implementation of the Veilo concept: two people match on compatibility —
never on looks — and talk through text and voice messages only. No photos, no video,
no calls, anywhere in the product.

This is a real, working app: Node/Express + MongoDB on the backend, vanilla HTML/CSS/JS
on the frontend, all wired together over a JSON API. See `HOSTING.md` for how to put it
on the internet.

## Features

- **Accounts** — email/password auth (JWT in an httpOnly cookie), 18+ age check at signup.
- **Anonymous identity** — every user is a generated nickname + abstract color "aura."
  Nothing else identifies them anywhere in the product.
- **Algorithm-only matching** — no swiping, no browsing. The matching engine scores
  candidates by:
  - compatibility-quiz similarity
  - shared interests
  - matching relationship intent
  - **activity-time overlap** — a 24-hour histogram of when each person tends to be
    active, compared by histogram intersection, so two night owls (or two early
    risers) score higher together
  One active algorithm-assigned match at a time; unmatching (or blocking/reporting)
  lets the engine assign a new one.
- **Profile sharing via QR code + link** — every user gets a private, regenerable
  link (`/p/<code>`) and matching QR code. Anyone who opens it *while logged in*
  sees that person's anonymous profile and can start a conversation directly —
  this is the one deliberate way to skip the algorithm queue, separate from (and
  unlimited by) the one-active-match rule above.
- **Messaging** — text and voice messages only. Voice notes are recorded in-browser
  (MediaRecorder API) and stored as binary data in MongoDB — see "Why voice notes
  live in MongoDB" below.
- **Text-only feed** — short posts, "resonate" reactions, comments.
- **Safety** — unmatch, block, and report (with a first-class "asking for photos or
  off-app contact" reason) are always one tap away from a conversation.
- **Notifications, settings, matching preferences, blocked-people list, account
  deletion** — the operational stuff a real product needs.

## Project structure

```
veilo-app/
├── server.js                 Express entry point
├── src/
│   ├── config/db.js           MongoDB connection
│   ├── models/                Mongoose schemas (User, Match, Message, Post, ...)
│   ├── middleware/             auth, activity tracking, uploads, rate limits
│   ├── controllers/            business logic, one file per resource
│   ├── routes/                 route wiring, one file per resource
│   └── utils/                  identity generation, the matching engine, JWT, asyncHandler
└── public/                     the frontend — plain HTML/CSS/JS, one file per screen
    ├── index.html               marketing landing page
    ├── login.html / register.html
    ├── home.html                match dashboard
    ├── messages.html / chat.html
    ├── feed.html / profile.html / profile-view.html (shared-link viewer)
    ├── notifications.html / settings.html
    ├── css/styles.css           the whole design system
    └── js/api.js, js/app.js     shared frontend helpers
```

## Running it locally

You'll need Node 18+ and a MongoDB connection (a free MongoDB Atlas cluster works
fine — see `HOSTING.md` for how to create one in a few minutes).

```bash
cd veilo-app
cp .env.example .env        # then fill in MONGO_URI and JWT_SECRET at minimum
npm install
npm run dev                 # nodemon, restarts on file changes
```

Visit `http://localhost:3000`. Register two separate accounts (e.g. in a normal
window and an incognito window) with compatible preferences to see the matching
engine actually pair them up, or use the "Share your profile" link from one
account's Profile page to connect them directly.

## How matching actually runs

There's no background job or cron in this build — `POST /api/match/find` runs the
search synchronously when a waiting user's Home page polls for one (every 15s).
That's a deliberate simplification for something you can run anywhere with zero
extra infrastructure. If you outgrow it, the natural next step is to move that same
logic into a scheduled job (e.g. a cron-triggered script or a queue worker) that
matches everyone waiting in one pass, rather than one-request-at-a-time.

## Why voice notes live in MongoDB

Voice messages are recorded client-side and uploaded as binary data stored directly
on the `Message` document (via `multer`'s in-memory storage), not saved to disk.
That's not the usual approach — most apps push audio to S3/Cloudinary and store a
URL — but it means this app has **zero dependency on persistent disk storage**,
which matters because most affordable hosts (including the one recommended in
`HOSTING.md`) wipe local disk on every restart or redeploy. The tradeoff: MongoDB
documents cap out at 16MB and this bloats your database faster than a URL would.
Fine for a project at this scale; if voice notes get long or numerous, migrate to
GridFS or an object store and swap `message.audio` for `message.audioUrl`.

## Known simplifications (by design, not oversight)

- **Polling, not WebSockets** — chat refreshes every 4 seconds instead of pushing
  messages instantly. Simpler to run and reason about; swap in Socket.io later if
  you want real-time delivery.
- **No email verification / password reset** — "Forgot password" is a placeholder
  link. Add a mail provider (Resend, Postmark, SES) if you need this for real users.
- **"Report history" and legal pages** are placeholders — there's no user-facing
  report-status page or real privacy policy/terms content yet.
