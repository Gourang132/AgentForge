# AgentForge — Full Stack AI SaaS

Build, deploy and monetize AI products. Powered by Groq.

---

## 🚀 DEPLOYMENT GUIDE — Step by Step

### STEP 1 — GitHub Setup

```bash
# Create repo on github.com first, then:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agentforge.git
git push -u origin main
```

---

### STEP 2 — Supabase (Database + Storage)

1. Go to **supabase.com** → New Project
2. Choose region closest to India: **Singapore (ap-southeast-1)**
3. Wait ~2 minutes for project to boot
4. Go to **SQL Editor** → paste entire contents of `supabase/schema.sql` → Run
5. Go to **Storage** → New Bucket → name: `rag-files` → Public: OFF
6. Go to **Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret key` → `SUPABASE_SERVICE_ROLE_KEY`

---

### STEP 3 — Clerk (Authentication)

1. Go to **clerk.com** → Create Application
2. Name: AgentForge → choose Google + Email login
3. Go to **API Keys** → copy:
   - Publishable key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret key → `CLERK_SECRET_KEY`
4. Go to **Redirects** → set:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/dashboard`

---

### STEP 4 — Groq API Key (Free)

1. Go to **console.groq.com** → Sign up (Google login works)
2. Click **API Keys** → Create API Key
3. Copy key → `GROQ_API_KEY`
4. Free tier: 1000 requests/day, 14,400/day on paid

---

### STEP 5 — Razorpay (Payments)

1. Go to **dashboard.razorpay.com** → Create Account
2. Go to **Settings → API Keys → Generate Key**
3. Copy:
   - Key ID → `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - Key Secret → `RAZORPAY_SECRET`
4. For webhooks (after Vercel deploy):
   - Settings → Webhooks → Add Webhook
   - URL: `https://your-vercel-url.vercel.app/api/webhooks/razorpay`
   - Events: `payment.captured`, `subscription.cancelled`

---

### STEP 6 — Vercel (Deploy)

1. Go to **vercel.com** → Add New Project
2. Import from GitHub → select `agentforge` repo
3. Framework: **Next.js** (auto-detected)
4. **Environment Variables** — add all from `.env.example`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_test_xxx
   CLERK_SECRET_KEY                  = sk_test_xxx
   NEXT_PUBLIC_CLERK_SIGN_IN_URL     = /sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL     = /sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = /dashboard
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = /dashboard
   NEXT_PUBLIC_SUPABASE_URL          = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyxxx
   SUPABASE_SERVICE_ROLE_KEY         = eyxxx
   GROQ_API_KEY                      = gsk_xxx
   RAZORPAY_KEY_ID                   = rzp_test_xxx
   RAZORPAY_SECRET                   = xxx
   NEXT_PUBLIC_RAZORPAY_KEY_ID       = rzp_test_xxx
   NEXT_PUBLIC_APP_URL               = https://your-project.vercel.app
   ```
5. Click **Deploy** → wait 2 minutes → live!

---

### STEP 7 — After Deploy

1. Copy your Vercel URL (e.g. `agentforge.vercel.app`)
2. Go back to Razorpay → add webhook URL with your real domain
3. Go to Clerk → update allowed origins with your Vercel URL
4. Update `NEXT_PUBLIC_APP_URL` in Vercel env vars → Redeploy

---

## 📁 Project Structure

```
agentforge/
├── app/
│   ├── page.jsx              ← Landing page
│   ├── dashboard/page.jsx    ← User dashboard
│   ├── builder/[id]/page.jsx ← Builder UI
│   ├── sign-in/              ← Clerk auth
│   ├── sign-up/              ← Clerk auth
│   └── api/
│       ├── chat/route.js     ← Groq proxy (protected)
│       ├── rag/upload/       ← File ingestion
│       ├── rag/query/        ← Retrieval + answer
│       ├── agents/route.js   ← 4-agent pipeline
│       ├── products/route.js ← CRUD
│       ├── payments/route.js ← Razorpay orders
│       └── webhooks/razorpay ← Payment webhook
├── components/
│   ├── Navbar.jsx
│   ├── ChatWidget.jsx
│   ├── RagUpload.jsx
│   └── AgentPipeline.jsx
├── lib/
│   ├── supabase.js           ← DB client
│   ├── groq.js               ← AI client
│   └── razorpay.js           ← Payment client
└── supabase/schema.sql       ← Run in Supabase SQL editor
```

---

## 💰 Cost to Run

| Service | Free Tier | Paid |
|---|---|---|
| Vercel | Free (hobby) | $20/mo |
| Supabase | Free (500MB DB) | $25/mo |
| Clerk | Free (10k users) | $25/mo |
| Groq | Free (1k req/day) | Pay per token |
| Razorpay | 2% per transaction | — |

**Total to launch: ₹0/month**

---

## 🛠 Local Development

```bash
# Install deps
npm install

# Copy env file
cp .env.example .env.local
# Fill in your keys in .env.local

# Run dev server
npm run dev

# Open http://localhost:3000
```

---

## 🔐 Security Notes

- `GROQ_API_KEY` is server-only — never reaches the browser
- `SUPABASE_SERVICE_ROLE_KEY` is server-only — never expose
- `RAZORPAY_SECRET` is server-only — never expose
- All API routes check Clerk auth before doing anything
- Users can only access their own products (clerk_id check)
