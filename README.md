# 📝 QuillSpace

QuillSpace is a full-stack blogging platform where anyone can read blogs publicly, registered users can write and publish their own posts (instantly, as drafts, or scheduled for later), interact through comments/likes/bookmarks, and admins moderate content through a dedicated analytics-driven dashboard.

Built with **React (Vite) + Tailwind CSS** on the frontend and **Node.js + Express + MongoDB** on the backend.

---

## ✨ Features

### 🔐 Authentication
- Email/password registration & login
- Google Sign-In (login & register modes, respects which tab you're on)
- JWT-based sessions, persisted across page refreshes
- Forgot Password — email reset link via Resend
- Reset Password — in-app, for logged-in users (with "set a password" flow for Google-only accounts)

### 🛡️ Roles & Admin
- User vs Admin roles, enforced server-side (never trusts the client)
- Admin seed script (`createAdmin.js`) + a protected promote-to-admin endpoint
- Admin Analytics Dashboard — total users, total blogs, total comments, published vs unpublished
- Charts: monthly blog publishing trend, monthly user registrations, blogs by category
- Admin Blog List — moderate/delete any post
- Admin Comments — moderate/delete any comment (cascades to replies)

### 📰 Blog Writing & Publishing
- Any logged-in user can write a blog (not admin-only)
- AI-assisted content generation (Google Gemini)
- Three publish modes: **Publish Now**, **Save as Draft**, **Schedule for Later**
- Scheduled posts auto-publish via a cron job that runs every minute
- 30-minute edit window after a post goes live (drafts/scheduled posts are editable anytime)
- Authors can delete their own posts anytime; admins can delete any post
- Real author tracking + byline on every post, linking to the author's public profile

### 📖 Reading Experience
- Public blog listing with category filtering + search — no login required
- Responsive blog cards across phone/tablet/laptop
- Editorial-styled blog detail page
- Like / dislike voting — per-user tracked server-side, requires login
- Share to WhatsApp, Facebook, Instagram (native share sheet fallback), or copy link

### 💬 Comments
- Live comment posting — no admin approval delay
- One level of nested replies
- Like comments and replies
- Admin can delete any comment (removes its replies too)

### 🔖 Bookmarks
- Save/unsave any blog post
- Dedicated "Saved Blogs" tab in the user's profile

### 👤 Profile
- Username + bio, shown on a public profile page (`/user/:username`)
- Profile photo upload via ImageKit, auto-cropped square
- "My Posts" tab — see status (draft/scheduled/published), edit, delete, or publish early
- Password reset directly from the profile menu

### 🔔 Notifications
- Bell icon with unread badge, auto-polling
- Notified when someone comments on your blog
- Notified when someone likes your comment
- Notified when your scheduled post auto-publishes

### 🎨 Design System
- Editorial identity — ink/paper palette, serif headlines (Instrument Serif), monospace labels (JetBrains Mono)
- Consistent styling across Login, Home, Blog listing, and Blog detail pages
- Fully responsive across phone, tablet, and laptop breakpoints

---

## 🧱 Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| Frontend       | React (Vite), React Router, Tailwind CSS, Axios |
| Backend        | Node.js, Express                                |
| Database       | MongoDB (Mongoose)                              |
| Auth           | JWT, bcryptjs, Google OAuth (`@react-oauth/google`, `google-auth-library`) |
| Image Storage  | ImageKit                                        |
| AI Content     | Google Gemini API                               |
| Email          | Resend                                          |
| Scheduling     | node-cron                                       |
| Charts         | Recharts                                        |

---

## 📁 Project Structure

```
QuillSpace/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/     # Navbar, BlogCard, BlogList, EditProfileModal, etc.
│   │   ├── components/admin/  # Sidebar, Login, CommentTableItem, BlogTableItem
│   │   ├── pages/           # Home, Blog, WriteBlog, EditBlog, MyProfile, PublicProfile...
│   │   ├── pages/admin/     # Layout, Dashboard, ListBlog, Comments
│   │   ├── context/          # AppContext.jsx
│   │   └── main.jsx
│   └── .env
└── server/                  # Express backend
    ├── configs/              # db.js, imageKit.js, gemini.js, resendConfig.js
    ├── contollers/           # authController, blogController, adminController, notificationController
    ├── middleware/           # auth.js, adminAuth.js, multer.js
    ├── models/               # userModel, Blog, commentModel, Notification
    ├── routes/               # authRoutes, blogRoutes, adminRoutes, notificationRoutes
    ├── jobs/                 # publishScheduled.js
    ├── createAdmin.js
    ├── server.js
    └── .env
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB Atlas cluster (or local MongoDB instance)
- Accounts/API keys for: ImageKit, Google Gemini, Google Cloud (OAuth), Resend

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd QuillSpace
```

> **Tip:** avoid keeping the project inside `~/Desktop` or `~/Documents` on macOS if iCloud Drive sync is enabled — it can cause random file-read crashes in Node during development. Keep it somewhere like `~/Developer` instead.

### 2. Backend setup
```bash
cd server
npm install
```

Create a `server/.env` file:
```env
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

GEMINI_API_KEY=your_gemini_api_key

GOOGLE_CLIENT_ID=your_google_oauth_client_id

RESEND_API_KEY=your_resend_api_key
CLIENT_URL=http://localhost:5173
```

⚠️ **.env formatting rules that matter:**
- No spaces around `=`
- No quotes around values
- No trailing semicolons
- No duplicate keys

Seed your first admin account:
```bash
node createAdmin.js
```

Start the backend:
```bash
npm run server
```

### 3. Frontend setup
```bash
cd ../client
npm install
```

Create a `client/.env` file:
```env
VITE_BASE_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Start the frontend:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`, talking to the backend at `http://localhost:3000`.

### 4. Google OAuth setup (for Google Sign-In)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create/select a project → configure the **OAuth consent screen** (set the App name correctly — this is what users see in the sign-in popup)
3. **Credentials → Create Credentials → OAuth Client ID** (Web application)
4. Add `http://localhost:5173` under **Authorized JavaScript origins**
5. Copy the Client ID into both `.env` files as shown above

### 5. Resend setup (for password reset emails)
1. Sign up at [resend.com](https://resend.com)
2. **API Keys → Create API Key** → copy it into `server/.env`
3. Note: until you verify a custom domain, Resend's free tier only delivers to the email address you signed up with

---

## 🔑 Default Admin Access

After running `node createAdmin.js`, log in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `server/.env` to access `/admin`.

To promote another existing user to admin:
```
PATCH /api/admin/promote/:userId
Authorization: Bearer <admin_token>
```

---

## 🚀 Deployment Notes

- **Frontend:** Vercel (or similar) — set `VITE_BASE_URL` and `VITE_GOOGLE_CLIENT_ID` as environment variables in the platform dashboard
- **Backend:** Render (or similar) — set every variable from `server/.env` in the platform's Environment tab (local `.env` files are never deployed automatically)
- **MongoDB Atlas:** under Network Access, allow `0.0.0.0/0` since most hosts (Render, Vercel) use dynamic outbound IPs
- **Scheduled posts on free-tier hosting:** Render's free tier spins the server down when idle. A post scheduled to publish while the server is asleep won't go live until the next incoming request wakes it up — consider an uptime-ping service or a paid tier if exact-time publishing matters for your use case.


