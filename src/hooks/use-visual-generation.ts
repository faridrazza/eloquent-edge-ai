import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export interface GeneratedVisual {
  id: string;
  order: number;
  title: string;
  imageUrl: string;
  prompt: string;
  textOverlay: string;
  status: 'generating' | 'completed' | 'failed';
  error?: string;
}

export interface VisualGenerationJob {
  jobId: string;
  postId: string;
  totalVisuals: number;
  completedVisuals: number;
  failedVisuals: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: GeneratedVisual[];
}

export const useVisualGeneration = (user: User | null, postId?: string) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState<VisualGenerationJob | null>(null);
  const [generatedVisuals, setGeneratedVisuals] = useState<GeneratedVisual[]>([]);

  // Fetch existing visuals when user or postId changes
  useEffect(() => {
    if (user && postId) {
      fetchExistingVisualsForPost(postId);
    } else if (user && !postId) {
      fetchExistingVisuals();
    }
  }, [user, postId]);

  const fetchExistingVisualsForPost = async (currentPostId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('generated_visuals')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', currentPostId)
        .order('generation_order');

      if (error) throw error;
      
      const transformedVisuals: GeneratedVisual[] = data.map(visual => ({
        id: visual.id,
        order: visual.generation_order || 1,
        title: `Visual ${visual.generation_order}`,
        imageUrl: visual.image_url || '',
        prompt: visual.prompt_used || '',
        textOverlay: '',
        status: visual.status as 'generating' | 'completed' | 'failed'
      }));
      
      setGeneratedVisuals(transformedVisuals);
    } catch (error) {
      console.error('Error fetching post visuals:', error);
    }
  };

  const fetchExistingVisuals = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('generated_visuals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedVisuals: GeneratedVisual[] = data.map(visual => ({
        id: visual.id,
        order: visual.generation_order || 1,
        title: `Visual ${visual.generation_order}`,
        imageUrl: visual.image_url || '',
        prompt: visual.prompt_used || '',
        textOverlay: '',
        status: visual.status as 'generating' | 'completed' | 'failed'
      }));
      
      setGeneratedVisuals(transformedVisuals);
    } catch (error) {
      console.error('Error fetching existing visuals:', error);
    }
  };

  const startVisualGeneration = async (
    postId: string,
    visualPrompts: any[],
    postContent?: string
  ): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "Please sign in to generate visuals.",
      });
      return false;
    }

    if (!visualPrompts || visualPrompts.length === 0) {
      toast({
        variant: "destructive",
        title: "No prompts available",
        description: "Visual prompts are required for generation.",
      });
      return false;
    }

    const jobId = crypto.randomUUID();
    setIsGenerating(true);
    setGenerationProgress(0);
    
    const job: VisualGenerationJob = {
      jobId,
      postId,
      totalVisuals: visualPrompts.length,
      completedVisuals: 0,
      failedVisuals: 0,
      status: 'pending',
      results: []
    };
    
    setCurrentJob(job);

    try {
      // Start the generation process
      job.status = 'running';
      setCurrentJob({ ...job });

      console.log('Calling generate-visuals function with:', {
        postId,
        userId: user.id,
        visualPrompts,
        jobId
      });

      // Start monitoring progress during generation
      const progressInterval = setInterval(async () => {
        if (!postId) return;
        
        try {
          const { data: visualsData } = await supabase
            .from('generated_visuals')
            .select('status')
            .eq('post_id', postId)
            .eq('user_id', user.id);
          
          if (visualsData) {
            const completed = visualsData.filter(v => v.status === 'completed').length;
            const failed = visualsData.filter(v => v.status === 'failed').length;
            const progress = Math.round((completed / visualPrompts.length) * 100);
            
            setGenerationProgress(progress);
            setCurrentJob(prev => prev ? {
              ...prev,
              completedVisuals: completed,
              failedVisuals: failed
            } : null);
          }
        } catch (error) {
          console.error('Error checking progress:', error);
        }
      }, 1000); // Check every second

      const { data, error } = await supabase.functions.invoke('generate-visuals', {
        body: {
          postId,
          userId: user.id,
          visualPrompts,
          jobId,
          postContent  // Pass post content for more context-aware generation
        }
      });

      // Clear progress monitoring
      clearInterval(progressInterval);

      console.log('Generate-visuals response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to generate visuals');
      }

      // Update job with results
      job.status = 'completed';
      job.completedVisuals = data.totalGenerated || 0;
      job.failedVisuals = data.totalFailed || 0;
      job.results = data.results || [];
      
      setCurrentJob({ ...job });
      setGeneratedVisuals(data.results || []);
      setGenerationProgress(100);

      // Update the post record with visual count
      await supabase
        .from('generated_posts')
        .update({
          visual_count: data.totalGenerated || 0,
          visual_style: visualPrompts[0]?.designNotes || 'mixed'
        })
        .eq('id', postId);

      toast({
        title: "Visuals generated!",
        description: `Successfully created ${data.totalGenerated || 0} visuals for your post.`,
      });

      return true;
    } catch (error) {
      console.error("Error generating visuals:", error);
      
      if (currentJob) {
        currentJob.status = 'failed';
        setCurrentJob({ ...currentJob });
      }
      
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "There was an error generating your visuals. Please try again.",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateVisual = async (visualId: string, newPrompt?: string): Promise<boolean> => {
    try {
      // Get the visual to regenerate
      const { data: visual, error: fetchError } = await supabase
        .from('generated_visuals')
        .select('*')
        .eq('id', visualId)
        .single();

      if (fetchError) throw fetchError;

      // Mark as generating
      await supabase
        .from('generated_visuals')
        .update({ status: 'generating' })
        .eq('id', visualId);

      // Simulate regeneration (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newImageUrl = `https://picsum.photos/1080/1080?random=${Date.now()}`;
      
      const { error: updateError } = await supabase
        .from('generated_visuals')
        .update({
          image_url: newImageUrl,
          prompt_used: newPrompt || visual.prompt_used,
          status: 'completed'
        })
        .eq('id', visualId);

      if (updateError) throw updateError;

      // Update local state
      setGeneratedVisuals(prev => 
        prev.map(v => 
          v.id === visualId 
            ? { ...v, imageUrl: newImageUrl, status: 'completed' }
            : v
        )
      );

      toast({
        title: "Visual regenerated!",
        description: "Your visual has been updated successfully.",
      });

      return true;
    } catch (error) {
      console.error("Error regenerating visual:", error);
      toast({
        variant: "destructive",
        title: "Regeneration failed",
        description: "Failed to regenerate the visual. Please try again.",
      });
      return false;
    }
  };

  const downloadVisual = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Your image is being downloaded.",
      });
    } catch (error) {
      console.error("Error downloading visual:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download the image. Please try again.",
      });
    }
  };

  const downloadAllVisuals = async () => {
    if (generatedVisuals.length === 0) return;

    try {
      // In a real implementation, you would create a ZIP file
      // For now, we'll download them individually
      for (let i = 0; i < generatedVisuals.length; i++) {
        const visual = generatedVisuals[i];
        if (visual.status === 'completed') {
          await downloadVisual(visual.imageUrl, `visual-${i + 1}.jpg`);
          // Add delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      toast({
        title: "All visuals downloaded",
        description: "Your visual set has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading all visuals:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download all visuals. Please try again.",
      });
    }
  };

  const resetGeneration = () => {
    setCurrentJob(null);
    setGeneratedVisuals([]);
    setGenerationProgress(0);
    setIsGenerating(false);
  };

    return {
    isGenerating,
    generationProgress,
    currentJob,
    generatedVisuals,
    startVisualGeneration,
    regenerateVisual,
    downloadVisual,
    downloadAllVisuals,
    resetGeneration,
    fetchExistingVisualsForPost
  };
};