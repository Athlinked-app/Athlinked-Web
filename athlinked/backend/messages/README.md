# Messages Module

## Database Migration

To add name fields to the messaging tables, run the migration script:

```bash
psql -U your_username -d your_database -f messages.schema.sql
```

Or using the connection string from your .env file:

```bash
psql $DATABASE_URL -f messages.schema.sql
```

This migration will:
1. Add `sender_name` column to `messages` table
2. Add `user_name` column to `conversation_participants` table
3. Backfill existing records with names from the `users` table

## What Changed

- **messages table**: Now stores `sender_name` alongside `sender_id` for faster queries
- **conversation_participants table**: Now stores `user_name` alongside `user_id`
- All new messages and participants will automatically have names stored
- Queries will use stored names with fallback to users table if name is NULL

