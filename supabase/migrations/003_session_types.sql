-- Add new session type values
ALTER TYPE session_type ADD VALUE IF NOT EXISTS 'Topic Review';
ALTER TYPE session_type ADD VALUE IF NOT EXISTS 'Practice Questions';
ALTER TYPE session_type ADD VALUE IF NOT EXISTS 'Practice Paper';
