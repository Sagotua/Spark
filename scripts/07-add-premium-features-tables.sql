-- Super Likes table
CREATE TABLE IF NOT EXISTS super_likes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, target_user_id)
);

-- Boosts table
CREATE TABLE IF NOT EXISTS boosts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  views_generated INTEGER DEFAULT 0,
  likes_generated INTEGER DEFAULT 0
);

-- Rewind Actions table
CREATE TABLE IF NOT EXISTS rewind_actions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  original_action TEXT NOT NULL CHECK (original_action IN ('like', 'pass')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, target_user_id)
);

-- Passport Locations table
CREATE TABLE IF NOT EXISTS passport_locations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message Read Receipts table
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  message_id TEXT NOT NULL,
  reader_id TEXT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, reader_id)
);

-- Premium Usage table
CREATE TABLE IF NOT EXISTS premium_usage (
  user_id TEXT PRIMARY KEY,
  super_likes_used INTEGER DEFAULT 0,
  super_likes_limit INTEGER DEFAULT 1,
  boosts_used INTEGER DEFAULT 0,
  boosts_limit INTEGER DEFAULT 0,
  rewinds_used INTEGER DEFAULT 0,
  rewinds_limit INTEGER DEFAULT 0,
  last_reset_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Swipe Actions table (for rewind functionality)
CREATE TABLE IF NOT EXISTS swipe_actions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass', 'super_like')),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, target_user_id)
);

-- Favorite Starters table (from previous AI features)
CREATE TABLE IF NOT EXISTS favorite_starters (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_super_likes_user_id ON super_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_super_likes_target_user_id ON super_likes(target_user_id);
CREATE INDEX IF NOT EXISTS idx_boosts_user_id ON boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_boosts_active ON boosts(is_active, end_time);
CREATE INDEX IF NOT EXISTS idx_rewind_actions_user_id ON rewind_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_passport_locations_user_id ON passport_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_message_read_receipts_message_id ON message_read_receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_premium_usage_user_id ON premium_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_actions_user_id ON swipe_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_actions_timestamp ON swipe_actions(timestamp DESC);
