# 🪶 QuillSpace

A full-stack blogging platform built with the MERN stack — writers publish, readers engage, admins moderate, and the whole thing runs in Docker with a CI/CD pipeline behind it.

---

## 🛠️ Tech Stack

**Frontend:**  React (Vite) ·  Tailwind CSS v4 ·  React Router ·  Axios ·  Quill (rich text editor) ·  Recharts ·  React Hot Toast

**Backend:**  Node.js ·  Express ·  MongoDB (Mongoose) ·  JWT authentication ·  bcryptjs ·  Multer ·  node-cron

**Third-party services:**
- 🖼️ **ImageKit** — image hosting/optimization (blog thumbnails, profile photos, ticket screenshots)
- 🤖 **Google Gemini API** — AI-assisted blog content generation
- 🔑 **Google OAuth** — Sign in with Google
- 📧 **Resend** — transactional email (welcome, password reset/change, newsletter, ticket notifications)

**Production & DevOps:**
-  **Helmet** — security HTTP headers
-  **express-rate-limit** — tiered rate limiting (general, auth, AI generation)
-  **Compression** — gzip response compression
-  **Zod** — request validation middleware
-  **Pino** — structured logging + request logging
-  **Swagger (OpenAPI)** — interactive API documentation
-  **Docker + Docker Compose** — containerized frontend (Nginx) and backend
-  **GitHub Actions** — CI/CD pipeline (build validation → deploy → smoke test)
-  **AWS EC2** — self-managed deployment target (alongside Render/Vercel)

---

## ✨ Features

### 🔐 Authentication
- Email/password registration & login
- Google Sign-In (login and register modes handled separately)
- JWT-based sessions, persisted across refreshes
- Welcome email on registration
- Forgot Password — email reset link, 30-minute expiring token
- Reset/Change Password — from within the app, with a confirmation email either way
- Self-service account deletion, with cascade cleanup of the user's own content

### 👑 Roles & Admin
- `user` / `admin` roles, enforced entirely server-side (never trusted from client input)
- One-time local seed script (`createAdmin.js`) creates the first admin
- Existing admins can promote other users to admin
- 📊 **Analytics Dashboard** — total users, blogs, comments, published/unpublished counts, plus monthly blog-publishing, monthly user-registration, and blogs-by-category charts
- Blog moderation (delete any post, author notified)
- Comment moderation (delete any comment, cascades to replies, commenter notified)

### ✍️ Writing & Publishing
- Any logged-in user can write and publish blog posts
- 🤖 AI-assisted content generation (Gemini), rate-limited to prevent abuse
- Three publishing modes: 🟢 **Publish now** · 📝 **Save as draft** · ⏰ **Schedule for later** (auto-published via a cron job that checks every minute)
- 🏷️ Tags (up to 10 per post) alongside categories
- 30-minute edit window after publishing; drafts/scheduled posts are editable with no time limit
- Authors can delete their own posts anytime, or manually publish a draft/scheduled post early

### 📖 Reading Experience
- Public feed with category filtering and search
- Responsive blog cards across phone/tablet/laptop
-  Real, deduplicated view counts — server-side tracking for logged-in users, browser-based dedup for anonymous readers
-  Per-user like/dislike voting (mutually exclusive, requires login)
-  Share to WhatsApp, Facebook, Instagram (native share sheet fallback), or copy link

### 💬 Comments
- Post live instantly, no approval delay
- Infinite level of nested replies.
-  Like comments and replies
-  Report/flag a comment for admin review

### 🔖 Bookmarks
- Save/unsave any post
- Dedicated "Saved Blogs" tab in the user's profile

### 🚨 Content Moderation
- Users can report blogs or comments (with a reason) for admin review
- Admin Reports queue: dismiss, or delete the content outright (which also notifies the content's owner)

### 👤 Profile
- Username, bio, and profile photo (auto-cropped via ImageKit)
- Public profile pages at `/user/:username`
- "My Posts" tab — status (Draft/Scheduled/Published), inline analytics per post (views, likes, dislikes, comment count), edit/delete/publish-now actions
- ⚠️ Danger Zone: self-service account deletion with password (or typed) confirmation

### 🔔 Notifications
- Bell icon with a live unread count (polls every 30 seconds)
- Triggers: someone comments on your blog, someone likes your comment, your scheduled post auto-publishes, an admin deletes your content, a support ticket gets a reply or status change

### 🎫 Customer Support
- Users can open support tickets (category, description, optional screenshot)
- Threaded conversation per ticket between the user and admins
- Admin can change ticket status (🟡 Open / 🔵 In Progress / 🟢 Resolved / ⚪ Closed)
- A user reply automatically reopens a resolved/closed ticket
- Email notifications on ticket creation and admin replies

### 📬 Newsletter
- Real subscribe form, stored in the database, with a confirmation email

### 🎨 Design
- Custom editorial identity — ink/paper palette, serif display headlines, monospace field labels
- Fully responsive, phone through laptop

---

## 🛡️ Production Hardening

-  **Helmet** — sets security-related HTTP headers by default
-  **Compression** — gzips API responses
-  **Rate limiting**, tiered:
  - General baseline across all routes (300 req / 15 min)
  - Strict limit on login/register/forgot-password (10 req / 15 min) — brute-force protection
  - Strict limit on AI content generation (15 req / 15 min) — cost protection
-  **Request validation** (Zod) — runs before the controller on the highest-risk routes, rejecting bad input with a consistent error shape
-  **Structured logging** (Pino) — pretty-printed in development, JSON in production; automatic request logging via `pino-http`
-  **Health check** — `GET /api/health` returns DB connection status and process uptime, placed outside the rate limiter so monitoring tools are never throttled
-  **API Documentation** — interactive Swagger UI at `/api-docs`

---

## 📂 Project Structure

```
QuillSpace/
├── 🐳 docker-compose.yml
├── 🔑 .env
├── ⚙️ .github/workflows/ci-cd.yml
├── 💻 client/                     # React frontend (Vite)
│   ├── Dockerfile                 # Multi-stage: build with Node, serve with Nginx
│   ├── nginx.conf                 # SPA routing fallback for React Router
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── context/                # AppContext — global auth/user/blog state
│       └── assets/
└── 🚂 server/                     # Express backend
    ├── Dockerfile
    ├── configs/                    # DB, ImageKit, Gemini, Resend, logger, Swagger
    ├── contollers/                  # Route logic
    ├── middleware/                  # auth, adminAuth, optionalAuth, multer, rateLimiters, validate
    ├── models/                     # Mongoose schemas
    ├── routes/
    ├── validators/                 # Zod schemas
    ├── jobs/                       # Scheduled post publishing (cron)
    └── utils/                      # Shared email template
```

---

## 🚀 Local Installation (without Docker)

### ✅ Prerequisites
- Node.js (v18+)
- A MongoDB database (MongoDB Atlas recommended)
- Accounts for: ImageKit, Google Cloud Console (OAuth), Google AI Studio (Gemini), Resend

### 1️⃣ Clone and install dependencies

```bash
git clone <your-repo-url>
cd QuillSpace
cd server && npm install
cd ../client && npm install
```

### 2️⃣ Environment variables

**`server/.env`**
```
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
RESEND_API_KEY=your_resend_api_key
CLIENT_URL=http://localhost:5173
```

**`client/.env`**
```
VITE_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

> ⚠️ No spaces around `=`, no quotes around values. Never commit `.env` files.

### 3️⃣ Create your first admin

```bash
cd server
node createAdmin.js
```

### 4️⃣ Run the app

```bash
# Terminal 1 — backend
cd server && npm run server

# Terminal 2 — frontend
cd client && npm run dev
```

🌐 Visit `http://localhost:5173` · 📖 API docs at `http://localhost:3000/api-docs`

---

## 🐳 Running with Docker

```bash
cd QuillSpace
docker compose up -d --build
```

- 💻 Frontend → `http://localhost:5173`
- 🚂 Backend → `http://localhost:3000` (or whatever host port is configured in `docker-compose.yml`)

```bash
docker compose ps        # ✅ check container status
docker compose logs -f   # 📜 follow logs
docker compose down      # 🛑 stop and remove containers
```

---

## ⚙️ CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`) runs on every push to `main`:

1. 🔨 **Build & Validate** — installs dependencies, syntax-checks the backend, builds the frontend, builds both Docker images. Any failure stops the pipeline before anything deploys.
2. 🚀 **Deploy** — triggers Render (backend) and Vercel (frontend) via their Deploy Hooks, gated behind step 1 passing.
3. 🩺 **Smoke Test** — checks `/api/health` and `/api/blog/all` on the live site after deployment. A failure surfaces immediately in GitHub; rollback is currently a manual dashboard action, not automatic.

🔒 Required GitHub repository secrets: `RENDER_DEPLOY_HOOK_URL`, `VERCEL_DEPLOY_HOOK_URL`, `PRODUCTION_API_URL`, `VITE_GOOGLE_CLIENT_ID`.

---

## ☁️ Deployment

**Current setup:** Render (backend) + Vercel (frontend), with an AWS EC2 instance running the same Dockerized stack in parallel for testing/learning purposes.

- **Render** — environment variables set directly in the dashboard; MongoDB Atlas Network Access allows `0.0.0.0/0`.
- **Vercel** — runs its own build step before deploying, acting as an independent build gate.
- **AWS EC2** — Ubuntu instance running Docker + Docker Compose directly, using the same Dockerfiles as local dev. Currently accessed via public IP (no domain/HTTPS yet); Google Sign-In requires each tested origin to be added in Google Cloud Console.

---

## 📌 Notes on Third-Party Setup

- 🔑 **Google OAuth** — add every origin you test from as an Authorized JavaScript origin.
- 📧 **Resend** — free tier only sends to your own signup email until a domain is verified.
- ⏰ **Scheduled posts** — cron checks every minute; on hosts that spin down when idle, publishing happens on the next incoming request after the scheduled time.

---

<p align="center">Made with 🩷 by writers, for writers — <b>QuillSpace</b></p>
