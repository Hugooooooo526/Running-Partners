# Database Migrations

SQL migration files will be placed here.

## Naming Convention

Use sequential numbering with descriptive names:
- `001_create_users_table.sql`
- `002_create_runners_table.sql`
- `003_create_matches_table.sql`
- `004_enable_realtime.sql`

## Running Migrations

Migrations can be executed via:
1. Supabase Dashboard SQL Editor
2. Supabase CLI (recommended for production)

## Example Migration

```sql
-- 001_create_users_table.sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
