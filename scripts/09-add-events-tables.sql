-- Events tables
CREATE TABLE IF NOT EXISTS dating_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('speed_dating', 'mixer', 'activity', 'workshop', 'party', 'outdoor', 'cultural', 'sports')),
  image_url TEXT,
  date TIMESTAMP NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location_name TEXT NOT NULL,
  location_address TEXT NOT NULL,
  location_city TEXT NOT NULL,
  location_lat REAL,
  location_lng REAL,
  capacity INTEGER NOT NULL,
  attendee_count INTEGER DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  is_premium_only BOOLEAN DEFAULT FALSE,
  age_range_min INTEGER,
  age_range_max INTEGER,
  gender_ratio TEXT CHECK (gender_ratio IN ('mixed', 'balanced', 'any')),
  organizer_id TEXT NOT NULL,
  organizer_name TEXT NOT NULL,
  organizer_photo TEXT,
  organizer_verified BOOLEAN DEFAULT FALSE,
  tags TEXT[], -- Array of tags
  requirements TEXT[], -- Array of requirements
  what_to_expect TEXT[], -- Array of what to expect
  is_active BOOLEAN DEFAULT TRUE,
  registration_deadline TIMESTAMP,
  cancellation_policy TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event attendees
CREATE TABLE IF NOT EXISTS event_attendees (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES dating_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  user_age INTEGER,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'attended', 'no_show', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Group dates
CREATE TABLE IF NOT EXISTS group_dates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('double_date', 'group_hangout', 'activity_group', 'dinner_group')),
  image_url TEXT,
  date TIMESTAMP NOT NULL,
  time TEXT NOT NULL,
  location JSONB NOT NULL, -- {name, address, city}
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 1,
  organizer_id TEXT NOT NULL,
  cost REAL NOT NULL DEFAULT 0,
  split_type TEXT NOT NULL DEFAULT 'equal' CHECK (split_type IN ('equal', 'organizer_pays', 'individual')),
  requirements TEXT[], -- Array of requirements
  is_private BOOLEAN DEFAULT FALSE,
  invite_code TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group date participants
CREATE TABLE IF NOT EXISTS group_date_participants (
  id TEXT PRIMARY KEY,
  group_date_id TEXT NOT NULL REFERENCES group_dates(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('organizer', 'participant', 'plus_one')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_date_id, user_id)
);

-- Event reviews and ratings
CREATE TABLE IF NOT EXISTS event_reviews (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES dating_events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, user_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dating_events_date ON dating_events(date);
CREATE INDEX IF NOT EXISTS idx_dating_events_city ON dating_events(location_city);
CREATE INDEX IF NOT EXISTS idx_dating_events_type ON dating_events(type);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user ON event_attendees(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_group_dates_date ON group_dates(date);
CREATE INDEX IF NOT EXISTS idx_group_date_participants_user ON group_date_participants(user_id);
