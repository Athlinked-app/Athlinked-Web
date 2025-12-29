# Messages Module

## Database Migrations

### 1. Add Media Support

To add media support (photos, videos, files, GIFs) to messages, run:

```bash
psql -U your_username -d your_database -f add_media_support.sql
```

Or using the connection string from your .env file:

```bash
psql $DATABASE_URL -f add_media_support.sql
```

This migration will:
1. Add `media_url` column to `messages` table (TEXT, nullable)
2. Add `message_type` column to `messages` table (TEXT with CHECK constraint: 'text', 'image', 'video', 'file', 'gif', 'post')

### 1.5. Add Post Data Support

To add post sharing support to messages, run:

```bash
psql -U your_username -d your_database -f add_post_data_support.sql
```

Or using the connection string from your .env file:

```bash
psql $DATABASE_URL -f add_post_data_support.sql
```

This migration will:
1. Add `post_data` column to `messages` table (JSONB, nullable) - stores post information when sharing posts

### 2. Add Name Fields (if not already done)

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

- **messages table**: 
  - Stores `sender_name` alongside `sender_id` for faster queries
  - Stores `media_url` for uploaded files (photos, videos, files, GIFs)
  - Stores `message_type` to identify the type of media ('text', 'image', 'video', 'file', 'gif', 'post')
  - Stores `post_data` (JSONB) for shared posts, containing post information and preview
- **conversation_participants table**: Stores `user_name` alongside `user_id`
- All new messages and participants will automatically have names stored
- Media files are stored in `/public/uploads/messages/` directory
- Queries will use stored names with fallback to users table if name is NULL

