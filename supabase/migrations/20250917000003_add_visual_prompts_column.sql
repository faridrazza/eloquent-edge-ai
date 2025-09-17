-- Add visual_prompts column to generated_posts table
ALTER TABLE generated_posts 
ADD COLUMN visual_prompts JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN generated_posts.visual_prompts IS 'Stores the generated visual prompts for the post as JSON';