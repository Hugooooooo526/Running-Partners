# Supabase Backend

This directory contains Supabase configurations and database migrations.

## Structure

```
supabase/
├── sql/
│   └── migrations/
│       ├── 001_create_users_table.sql
│       └── 002_create_runners_table.sql
├── README.md
└── env.example
```

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up / log in
2. Click **"New Project"**
3. Choose an organization (or create one)
4. Fill in:
   - **Project name**: `running-partners` (or anything you like)
   - **Database password**: choose a strong password (save it somewhere)
   - **Region**: pick the closest to your users
5. Click **"Create new project"** and wait ~1 minute for it to spin up

### 2. Get Your API Credentials

1. In your project dashboard, go to **Settings** (gear icon) → **API**
2. Copy these two values:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **Anon public key** — starts with `eyJ...`

### 3. Create Your .env File

In the **root directory** of the project (same level as `package.json`), create a `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run the Migrations

1. In the Supabase dashboard, go to the **SQL Editor** (left sidebar)
2. Open `backend/supabase/sql/migrations/001_create_users_table.sql` and paste it into the SQL Editor
3. Click **"Run"**
4. Repeat for `002_create_runners_table.sql`

This creates the `users` and `runners` tables with Row Level Security policies.

### 5. Enable Realtime (for live runner updates)

1. In the Supabase dashboard, go to **Database** → **Replication**
2. Toggle ON replication for the `runners` table
3. This allows the app to receive live updates when runners go online/offline

## Database Schema

### `users` Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated, linked to Supabase Auth |
| email | text | Unique |
| username | text | Display name |
| avatar_url | text | Profile photo URL (nullable) |
| avg_pace | numeric | Average pace in min/mile (nullable) |
| total_runs | integer | Lifetime run count |
| total_miles | numeric | Lifetime distance |
| created_at | timestamptz | Auto-set on signup |

### `runners` Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid (PK) | Auto-generated |
| user_id | uuid (FK) | References users.id |
| latitude | numeric | Current GPS latitude |
| longitude | numeric | Current GPS longitude |
| pace | numeric | Current pace (nullable) |
| direction | numeric | Heading in degrees (0-360) |
| is_active | boolean | true = looking for partners |
| last_update | timestamptz | Last GPS ping time |

### Row Level Security

- **users**: Anyone can view profiles, only owner can update
- **runners**: Anyone can see active runners, only owner can insert/update/delete their own session

## Realtime Features

- Live location updates via Supabase Realtime
- Runner matching notifications
- Online/offline presence via `runners` table

## Authentication

Using Supabase Auth with:
- Email/Password
- OAuth providers (future)
