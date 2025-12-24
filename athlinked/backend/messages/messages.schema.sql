-- Migration script to add name fields to messaging tables

-- Add sender_name to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- Add user_name to conversation_participants table
ALTER TABLE conversation_participants 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- Update existing messages with sender names
UPDATE messages m
SET sender_name = COALESCE(u.full_name, u.username, 'User')
FROM users u
WHERE m.sender_id = u.id AND m.sender_name IS NULL;

-- Update existing conversation_participants with user names
UPDATE conversation_participants cp
SET user_name = COALESCE(u.full_name, u.username, 'User')
FROM users u
WHERE cp.user_id = u.id AND cp.user_name IS NULL;

