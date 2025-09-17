-- Create storage bucket for generated visuals
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-visuals', 'generated-visuals', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for generated visuals
CREATE POLICY "Public read access for generated visuals" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-visuals');

CREATE POLICY "Authenticated users can upload generated visuals" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-visuals' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own generated visuals" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'generated-visuals' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own generated visuals" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-visuals' AND auth.role() = 'authenticated');