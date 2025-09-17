-- Create visual_generations table for tracking canvas generations
CREATE TABLE IF NOT EXISTS visual_generations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT,
    reference_images JSONB,
    generated_image_url TEXT,
    credits_used INTEGER DEFAULT 1,
    api_provider TEXT DEFAULT 'gemini-2.5-flash-image',
    api_response_data JSONB,
    generation_time INTEGER, -- in milliseconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create visual_projects table for saving canvas projects
CREATE TABLE IF NOT EXISTS visual_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    conversation_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    final_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create storage bucket for generated images (canvas)
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-images', 'generated-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for generated images
CREATE POLICY "Public read access for generated images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Authenticated users can upload generated images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own generated images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own generated images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-images' AND auth.role() = 'authenticated');

-- Enable RLS on the new tables
ALTER TABLE visual_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_projects ENABLE ROW LEVEL SECURITY;

-- Set up RLS policies for visual_generations
CREATE POLICY "Users can view their own visual generations" 
ON visual_generations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visual generations" 
ON visual_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visual generations" 
ON visual_generations 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Set up RLS policies for visual_projects
CREATE POLICY "Users can view their own visual projects" 
ON visual_projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visual projects" 
ON visual_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visual projects" 
ON visual_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own visual projects" 
ON visual_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_visual_generations_user_id ON visual_generations(user_id);
CREATE INDEX idx_visual_generations_created_at ON visual_generations(created_at);
CREATE INDEX idx_visual_projects_user_id ON visual_projects(user_id);
CREATE INDEX idx_visual_projects_created_at ON visual_projects(created_at);