# Hosting Veilo

Short version: **Render (or Railway) for the app + MongoDB Atlas for the database.**
Both have free tiers, neither needs you to touch a terminal on a remote server, and
— because of how this app was built — going live is almost entirely an
**environment-variable change, not a code change.**

---

## 1. The database: MongoDB Atlas

1. Create a free account at mongodb.com/cloud/atlas and create a new project.
2. Build a free **M0 cluster** (512MB — plenty for this app).
3. **Database Access** → add a database user with a username/password (not your
   Atlas login — a separate DB-only credential).
4. **Network Access** → add an IP entry. For a first deploy, `0.0.0.0/0` (allow
   from anywhere) is the easy path; it's what lets Render/Railway's rotating IPs
   connect without you having to look them up. Tighten this later if you want —
   Atlas's paid tiers support VPC peering for a fully private connection.
5. **Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```
   Add your database name before the `?`: `.../veilo?retryWrites=...`. That whole
   string is your `MONGO_URI`.

## 2. The app: Render

Render runs your Node process persistently (unlike serverless platforms), which is
the right shape for this app — it needs a long-lived process. Railway and Fly.io
are equally good alternatives if you prefer them; the steps are nearly identical.

1. Push this project to a GitHub repo.
2. On render.com: **New → Web Service** → connect the repo.
3. Settings:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free is fine to start.
4. **Environment** tab — add these (see the full list and explanations below):
   - `MONGO_URI` — from Atlas above
   - `JWT_SECRET` — a long random string (see below for how to generate one)
   - `NODE_ENV` — `production`
   - `PUBLIC_BASE_URL` — `https://<your-service-name>.onrender.com` (Render shows
     you this URL before you even finish creating the service)
   - `ALLOWED_ORIGIN` — same as `PUBLIC_BASE_URL`
5. Deploy. Render builds, starts `npm start`, and gives you a live HTTPS URL —
   TLS is automatic and free, no certificate setup needed.

That's the entire deployment. No Dockerfile, no server to patch, no reverse proxy
to configure.

### Option: your own VPS (DigitalOcean, Linode, etc.)

If you'd rather run this yourself for the learning experience:
1. Provision an Ubuntu droplet, install Node 18+.
2. Clone the repo, `npm install`, create `.env` with the same variables as above
   (with your own domain in `PUBLIC_BASE_URL`).
3. Run the app under a process manager so it survives reboots/crashes:
   `npm install -g pm2 && pm2 start server.js --name veilo && pm2 save && pm2 startup`.
4. Put nginx in front of it as a reverse proxy to port 3000, then run
   `certbot --nginx` (Let's Encrypt) for free HTTPS.
5. Point your domain's A record at the droplet's IP.

This gives you more control and no cold starts, at the cost of being the one who
patches the OS and renews things.

---

## 3. What actually needs to change in the code

**Almost nothing — this was built env-var-first specifically so publishing doesn't
mean editing source.** Here's the full list of things that matter, and none of them
are inside a `.js` file:

| Variable | Why it matters in production |
|---|---|
| `PUBLIC_BASE_URL` | **This is the one that will visibly break things if you forget it.** Every QR code and every shareable profile link (`/p/<code>`) is built from this value. If you deploy without setting it, your users' QR codes will encode `http://localhost:3000/p/...` and be useless to anyone but you. |
| `NODE_ENV=production` | Switches login cookies to `secure` (HTTPS-only) and stops the API from leaking internal error messages/stack traces to clients. |
| `JWT_SECRET` | Must be a long, random, unique value — never the placeholder from `.env.example`. Generate one with: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ALLOWED_ORIGIN` | Only matters if you ever split the frontend onto a different domain than the API. With the default setup (one app serves both), leave it equal to `PUBLIC_BASE_URL`. |
| `MONGO_URI` | Your real Atlas connection string, not the local placeholder. |

One line already in `server.js` that you don't need to add, but is worth knowing
about: `app.set('trust proxy', 1)`. Render/Railway/most hosts put your app behind
a reverse proxy — without this line, secure cookies and rate-limiting-by-IP behave
incorrectly behind that proxy. It's already there, just flagging why.

## 4. Optional hardening for a real launch (not required to go live)

These are genuine next steps if this stops being a class project and starts being
a real product, roughly in the order you'd feel the pain:

- **Real-time messaging** — chat currently polls every 4 seconds. Fine for a demo;
  swap in Socket.io if you want messages to arrive instantly.
- **Move voice notes out of MongoDB** — see the README for why they're in Mongo
  today. If usage grows, migrate to S3/Cloudinary/GridFS.
- **Email verification + password reset** — there's a `.env`-driven mail provider
  (Resend, Postmark, SES) waiting to be plugged into the "Forgot password" link,
  which is currently just a placeholder.
- **Background matching job** — right now matching runs when a waiting user's
  page asks for it. A scheduled job that matches everyone waiting in one pass
  scales better once you have real concurrent users.
- **Monitoring** — Render/Railway both show basic logs and metrics for free;
  consider Sentry (errors) once you have real users to worry about.
- **Automated tests** — none exist yet. Start with the matching engine
  (`src/utils/matching.js`) — it's pure functions and easy to unit test.
