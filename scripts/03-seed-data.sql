-- Insert sample users
INSERT INTO users (email, name, age, bio, photos, location, interests, gender) VALUES
('emma@example.com', 'Emma', 25, 'Love hiking and coffee ☕️', 
 ARRAY['/placeholder.svg?height=600&width=400'], 
 '{"lat": 37.7749, "lng": -122.4194, "city": "San Francisco"}',
 ARRAY['Hiking', 'Coffee', 'Photography'], 'female'),

('alex@example.com', 'Alex', 28, 'Musician and dog lover 🎸🐕', 
 ARRAY['/placeholder.svg?height=600&width=400'], 
 '{"lat": 34.0522, "lng": -118.2437, "city": "Los Angeles"}',
 ARRAY['Music', 'Dogs', 'Travel'], 'male'),

('sarah@example.com', 'Sarah', 24, 'Yoga instructor and foodie 🧘‍♀️🍕', 
 ARRAY['/placeholder.svg?height=600&width=400'], 
 '{"lat": 40.7128, "lng": -74.0060, "city": "New York"}',
 ARRAY['Yoga', 'Food', 'Meditation'], 'female'),

('mike@example.com', 'Mike', 30, 'Software engineer who loves rock climbing', 
 ARRAY['/placeholder.svg?height=600&width=400'], 
 '{"lat": 37.7749, "lng": -122.4194, "city": "San Francisco"}',
 ARRAY['Technology', 'Rock Climbing', 'Gaming'], 'male'),

('lisa@example.com', 'Lisa', 26, 'Artist and nature lover 🎨🌿', 
 ARRAY['/placeholder.svg?height=600&width=400'], 
 '{"lat": 37.7749, "lng": -122.4194, "city": "San Francisco"}',
 ARRAY['Art', 'Nature', 'Photography'], 'female');

-- Insert some sample swipes and matches
INSERT INTO swipes (swiper_id, swiped_id, is_like) 
SELECT u1.id, u2.id, TRUE
FROM users u1, users u2 
WHERE u1.email = 'emma@example.com' AND u2.email = 'mike@example.com';

INSERT INTO swipes (swiper_id, swiped_id, is_like) 
SELECT u1.id, u2.id, TRUE
FROM users u1, users u2 
WHERE u1.email = 'mike@example.com' AND u2.email = 'emma@example.com';
