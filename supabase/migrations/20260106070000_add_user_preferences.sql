-- Add preferences column to members table
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme": "system", "primaryColor": "blue", "layoutDensity": "comfortable"}';

-- Update existing members to have default preferences if null
UPDATE public.members 
SET preferences = '{"theme": "system", "primaryColor": "blue", "layoutDensity": "comfortable"}' 
WHERE preferences IS NULL;
