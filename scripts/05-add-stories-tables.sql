-- Stories table
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('photo', 'video')),
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Story views table
CREATE TABLE story_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

-- Story reactions table
CREATE TABLE story_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
    reactor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reaction_type VARCHAR(10) NOT NULL CHECK (reaction_type IN ('heart', 'fire', 'wow', 'laugh', 'sad')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(story_id, reactor_id)
);

-- Story highlights table
CREATE TABLE story_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(50) NOT NULL,
    cover_photo TEXT NOT NULL,
    story_ids UUID[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table (for activity feed)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_stories_user_active ON stories (user_id, expires_at) WHERE expires_at > NOW();
CREATE INDEX idx_stories_expires ON stories (expires_at);
CREATE INDEX idx_story_views_story ON story_views (story_id);
CREATE INDEX idx_story_views_viewer ON story_views (viewer_id);
CREATE INDEX idx_story_reactions_story ON story_reactions (story_id);
CREATE INDEX idx_story_highlights_user ON story_highlights (user_id);
CREATE INDEX idx_activities_target ON activities (target_id, created_at);
CREATE INDEX idx_activities_actor ON activities (actor_id, created_at);
CREATE INDEX idx_activities_type ON activities (type, created_at);

-- Add trigger for story highlights updated_at
CREATE TRIGGER update_story_highlights_updated_at 
    BEFORE UPDATE ON story_highlights 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired stories
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS void AS $$
BEGIN
    DELETE FROM stories WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (in production, use pg_cron or similar)
-- SELECT cron.schedule('cleanup-stories', '0 * * * *', 'SELECT cleanup_expired_stories();');
