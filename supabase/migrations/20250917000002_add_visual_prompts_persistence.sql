-- Add visual_prompts column to generated_posts table to persist prompts
ALTER TABLE generated_posts 
ADD COLUMN visual_prompts JSONB DEFAULT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_posts_visual_prompts 
ON generated_posts USING GIN (visual_prompts);

-- Add comment to explain the column
COMMENT ON COLUMN generated_posts.visual_prompts IS 'JSON array of visual prompts generated for this post';