-- Clips table
CREATE TABLE IF NOT EXISTS clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  user_profile_url TEXT,
  video_url TEXT NOT NULL,
  description TEXT,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Clip comments table
CREATE TABLE IF NOT EXISTS clip_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_comment_id UUID REFERENCES clip_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clips_user_id ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_clips_created_at ON clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clip_comments_clip_id ON clip_comments(clip_id);
CREATE INDEX IF NOT EXISTS idx_clip_comments_parent_comment_id ON clip_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_clip_comments_created_at ON clip_comments(created_at);

