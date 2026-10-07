-- Add preferred_font column to profiles table
ALTER TABLE profiles 
ADD COLUMN preferred_font text DEFAULT 'inter';

-- Add constraint for valid fonts
ALTER TABLE profiles
ADD CONSTRAINT valid_preferred_font 
CHECK (preferred_font IN ('inter', 'outfit', 'playfair', 'poppins', 'roboto', 'open-sans', 'lato', 'montserrat', 'source-sans'));

COMMENT ON COLUMN profiles.preferred_font IS 'User selected font preference for UI and PDF exports';