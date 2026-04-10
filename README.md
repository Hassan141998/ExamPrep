# ExamPrep — Complete Setup & Deployment Guide
## AI-Powered Exam Preparation for Data Mining, ML, OOSE & IT Project Management

---

## PROJECT STRUCTURE

```
examprep/
├── src/
│   ├── components/
│   │   └── Layout.js          ← Sidebar navigation
│   ├── lib/
│   │   ├── db.js              ← Neon database connection
│   │   ├── auth.js            ← JWT authentication
│   │   └── ai.js              ← Anthropic AI functions
│   ├── pages/
│   │   ├── _app.js            ← Auth context & global state
│   │   ├── index.js           ← Redirect to dashboard/login
│   │   ├── login.js           ← Login & register
│   │   ├── dashboard.js       ← Home with stats & progress
│   │   ├── quiz.js            ← MCQ quiz with timer
│   │   ├── flashcards.js      ← Spaced repetition cards
│   │   ├── notes.js           ← AI tutor chat
│   │   ├── progress.js        ← Analytics & weak topics
│   │   └── subjects/
│   │       └── index.js       ← Manage subjects + PDF upload
│   ├── pages/api/
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   └── register.js
│   │   ├── subjects/
│   │   │   ├── index.js       ← GET all, POST new
│   │   │   ├── [id].js        ← DELETE subject
│   │   │   ├── upload-pdf.js  ← PDF text extraction
│   │   │   └── generate.js    ← AI quiz & flashcard generation
│   │   ├── questions/
│   │   │   └── index.js
│   │   ├── quiz/
│   │   │   └── attempt.js
│   │   ├── flashcards/
│   │   │   ├── index.js
│   │   │   └── review.js      ← SM-2 spaced repetition
│   │   ├── ai/
│   │   │   ├── explain.js     ← Explain any concept
│   │   │   └── chat.js        ← AI tutor chat
│   │   ├── dashboard.js
│   │   └── progress.js
│   └── styles/
│       └── globals.css
├── scripts/
│   └── db-setup.js            ← Run once to create DB tables
├── .env.local.example
├── vercel.json
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## STEP 1 — NEON DATABASE SETUP

1. Go to https://neon.tech and create a FREE account
2. Click "New Project" → Name it `examprep` → Select region closest to you
3. After creation, click "Connection Details"
4. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Keep this tab open — you'll need it in Step 3

---

## STEP 2 — ANTHROPIC API KEY

1. Go to https://console.anthropic.com
2. Click "API Keys" → "Create Key"
3. Copy the key (starts with `sk-ant-...`)
4. Note: You need credits. Add $5 minimum for testing.

---

## STEP 3 — LOCAL SETUP

```bash
# 1. Clone / download this project folder

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.local.example .env.local

# 4. Edit .env.local with your values:
#    DATABASE_URL=postgresql://your-neon-connection-string
#    ANTHROPIC_API_KEY=sk-ant-your-key
#    JWT_SECRET=any-random-32-char-string-like-abc123xyz789

# 5. Create database tables (run ONCE)
node scripts/db-setup.js
# You should see: ✅ All tables created successfully!

# 6. Run development server
npm run dev
# Open http://localhost:3000
```

---

## STEP 4 — USING THE APP LOCALLY

1. Open http://localhost:3000
2. Click "Register" → create your account
3. Go to **Subjects** → Click "Add subject"
4. Add your 4 subjects using the preset buttons:
   - Data Mining & Warehouse
   - Machine Learning
   - OOSE
   - IT Project Management
5. For each subject, click "↑ Upload PDF" and select your PDF file
6. After upload succeeds, click "⬡ Generate questions & cards"
   - This takes 30-60 seconds per subject
   - It creates 15 quiz questions + 20 flashcards using Claude AI
7. Now use Quiz, Flashcards, and AI Tutor!

---

## STEP 5 — DEPLOY TO VERCEL

### 5a. Push to GitHub

```bash
# Initialize git (in the examprep folder)
git init
git add .
git commit -m "Initial ExamPrep commit"

# Create a new repo on github.com (call it examprep)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/examprep.git
git branch -M main
git push -u origin main
```

### 5b. Deploy on Vercel

1. Go to https://vercel.com → Sign up/login with GitHub
2. Click "New Project"
3. Select your `examprep` repo → Click "Import"
4. In "Environment Variables" section, add ALL THREE:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | your Neon connection string |
   | `ANTHROPIC_API_KEY` | your Anthropic API key |
   | `JWT_SECRET` | any random string (32+ chars) |

5. Click "Deploy" → Wait 2-3 minutes
6. Your site is live at `https://examprep-xxx.vercel.app`

---

## STEP 6 — NEON + VERCEL CONNECTION (Important!)

In Neon dashboard:
1. Go to your project → Settings → "Connection pooling"
2. Enable connection pooling (important for serverless)
3. Copy the **pooled** connection string
4. Update `DATABASE_URL` in Vercel with the pooled string:
   - Go to Vercel → Your project → Settings → Environment Variables
   - Update DATABASE_URL → Redeploy

---

## DATABASE TABLES EXPLAINED

| Table | Purpose |
|-------|---------|
| `users` | Stores accounts (email, hashed password) |
| `subjects` | Your 4 subjects + PDF text content |
| `questions` | AI-generated MCQ questions per subject |
| `flashcards` | AI-generated cards with SM-2 scheduling data |
| `quiz_attempts` | Every answer you give (for analytics) |
| `study_sessions` | Daily study tracking (for streak counter) |

---

## HOW AI FEATURES WORK

### PDF Upload Flow
```
You upload PDF → Server extracts text using pdf-parse
→ Text stored in subjects.pdf_text column in Neon
→ Used as context for all AI features
```

### Quiz Generation
```
PDF text → Claude API (claude-opus-4-5)
→ Returns JSON array of 15 MCQs
→ Saved to questions table
→ Randomized when you start a quiz
```

### Spaced Repetition (SM-2 Algorithm)
```
You rate a flashcard:
  "Hard" → card reappears TOMORROW
  "Okay" → card reappears in 3 DAYS
  "Easy" → card reappears in 1 WEEK (or longer)

Each rating adjusts the ease_factor in the database.
The harder you find a card, the more often it appears.
This is the same algorithm used by Anki.
```

### AI Tutor Chat
```
Your question + PDF text + conversation history
→ Claude API with subject-specific system prompt
→ Answer focused on YOUR course material
```

---

## TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| `DATABASE_URL not set` | Create .env.local from .env.local.example |
| `Cannot extract PDF text` | Your PDF might be a scanned image. Use a text-based PDF |
| `AI generation failed` | Check ANTHROPIC_API_KEY is valid and has credits |
| `Unauthorized` errors | Log out and log back in (JWT expired) |
| Vercel deploy fails | Check all 3 env variables are set correctly |
| Neon connection timeout | Use pooled connection string (see Step 6) |

---

## FREE TIER LIMITS

| Service | Free Limit | Notes |
|---------|-----------|-------|
| Neon | 512 MB storage, 190 compute hrs/month | More than enough |
| Vercel | 100 GB bandwidth, unlimited deploys | More than enough |
| Anthropic | Pay per use | ~$0.01 per generation |

---

## ADDING MORE SUBJECTS

This app works for ANY subject:
1. Go to Subjects → Add subject → Type any name
2. Upload the PDF
3. Click Generate → Done!

The AI adapts to whatever subject material you provide.

---

## TECH STACK

- **Frontend**: Next.js 14 + React
- **Database**: Neon (PostgreSQL serverless)
- **AI**: Anthropic Claude (claude-opus-4-5)
- **Auth**: JWT tokens with bcrypt passwords
- **Hosting**: Vercel (serverless functions)
- **Styling**: Custom CSS with JetBrains Mono + DM Serif Display fonts
- **Spaced Repetition**: SM-2 algorithm (same as Anki)
