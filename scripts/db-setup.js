// scripts/db-setup.js
// Run: node scripts/db-setup.js
const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

async function setup() {
  const sql = neon(process.env.DATABASE_URL)
  
  console.log('Setting up ExamPrep database...')

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS subjects (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#534AB7',
      exam_date DATE,
      pdf_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      chapter TEXT,
      question TEXT NOT NULL,
      options JSONB,
      correct_answer TEXT NOT NULL,
      explanation TEXT,
      difficulty TEXT DEFAULT 'medium',
      type TEXT DEFAULT 'mcq',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS flashcards (
      id SERIAL PRIMARY KEY,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      ease_factor REAL DEFAULT 2.5,
      interval INTEGER DEFAULT 1,
      repetitions INTEGER DEFAULT 0,
      next_review DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
      user_answer TEXT,
      is_correct BOOLEAN,
      time_taken INTEGER,
      attempted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS study_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id),
      duration_minutes INTEGER,
      session_date DATE DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  console.log('✅ All tables created successfully!')
  console.log('✅ Database ready for ExamPrep')
}

setup().catch(console.error)
