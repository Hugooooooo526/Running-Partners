# Supabase Backend

This directory contains Supabase configurations and database migrations.

## Structure

```
supabase/
├── sql/
│   └── migrations/
├── README.md
└── env.example
```

## Setup Instructions

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create `.env` file in the root directory based on `.env.example`
4. Add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Database Schema

### Tables (To be implemented)

- `users` - User profiles
- `runners` - Active runner sessions
- `matches` - Matched runner pairs
- `locations` - Real-time location data
- `runs` - Running history

## Realtime Features

- Live location updates
- Runner matching notifications
- Chat messages (future)

## Authentication

Using Supabase Auth with:
- Email/Password
- OAuth providers (future)

## Migrations

Database migrations will be placed in `sql/migrations/` directory.

Example naming convention:
- `001_create_users_table.sql`
- `002_create_runners_table.sql`
- `003_create_matches_table.sql`
