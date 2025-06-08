-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check for mutual matches
CREATE OR REPLACE FUNCTION check_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if there's a reverse swipe that's a like
    IF NEW.is_like = TRUE THEN
        UPDATE matches 
        SET is_mutual = TRUE 
        WHERE (user1_id = NEW.swiped_id AND user2_id = NEW.swiper_id)
           OR (user1_id = NEW.swiper_id AND user2_id = NEW.swiped_id);
        
        -- If no match exists yet, create one
        INSERT INTO matches (user1_id, user2_id, is_mutual)
        SELECT NEW.swiper_id, NEW.swiped_id, 
               EXISTS(SELECT 1 FROM swipes 
                     WHERE swiper_id = NEW.swiped_id 
                     AND swiped_id = NEW.swiper_id 
                     AND is_like = TRUE)
        WHERE NOT EXISTS(SELECT 1 FROM matches 
                        WHERE (user1_id = NEW.swiper_id AND user2_id = NEW.swiped_id)
                           OR (user1_id = NEW.swiped_id AND user2_id = NEW.swiper_id));
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for swipes table
CREATE TRIGGER check_mutual_match_trigger
    AFTER INSERT ON swipes
    FOR EACH ROW
    EXECUTE FUNCTION check_mutual_match();

-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT)
RETURNS FLOAT AS $$
BEGIN
    RETURN (
        6371 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        )
    );
END;
$$ language 'plpgsql';
