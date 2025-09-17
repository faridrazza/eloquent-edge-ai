import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export interface GeneratedPost {
  id: string;
  original_prompt: string;
  generated_content: string;
  post_structure: string;
  visual_count: number;
  visual_style: string | null;
  created_at: string;
}

export interface PostAnalysis {
  content_type: string;
  recommended_visual_count: number;
  visual_breakdown: string[];
  visual_style_recommendation: string;
  key_points: string[];
  primary_topic: string;
  estimated_credits: number;
}

export interface VisualPrompt {
  order: number;
  title: string;
  imagePrompt: string;
  textOverlay: string;
  designNotes: string;
}

export const usePostGeneration = (user: User | null) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<string>("");
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [postAnalysis, setPostAnalysis] = useState<PostAnalysis | null>(null);
  const [visualPrompts, setVisualPrompts] = useState<VisualPrompt[]>([]);

  const generatePost = async (prompt: string, usePersonalStyle: boolean = false): Promise<boolean> => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "Please sign in to generate posts.",
      });
      return false;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-post', {
        body: {
          prompt,
          userId: user.id,
          usePersonalStyle
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate post');
      }

      // Store the generated post in database
      const { data: postData, error: insertError } = await supabase
        .from("generated_posts")
        .insert({
          user_id: user.id,
          original_prompt: prompt,
          generated_content: data.generatedContent,
          post_structure: data.postStructure,
          visual_count: 0,
          visual_style: null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setGeneratedPost(data.generatedContent);
      setCurrentPostId(postData.id);

      toast({
        title: "Post generated successfully!",
        description: "Your LinkedIn post is ready. Continue to create visuals.",
      });

      return true;
    } catch (error) {
      console.error("Error generating post:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "There was an error generating your post. Please try again.",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzePostStructure = async (postContent: string): Promise<boolean> => {
    console.log('Analyzing post structure for content:', postContent.substring(0, 100) + '...');
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-post-structure', {
        body: { postContent }
      });

      console.log('Post analysis response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        console.error('Analysis function returned error:', data);
        throw new Error(data?.error || 'Failed to analyze post structure');
      }

      console.log('Post analysis completed:', data.analysis);
      setPostAnalysis(data.analysis);
      return true;
    } catch (error) {
      console.error("Error analyzing post:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "Failed to analyze post structure. Please try again.",
      });
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateVisualPrompts = async (
    postContent: string, 
    visualCount: number, 
    visualStyle: string, 
    contentType: string,
    analysisData?: PostAnalysis | null
  ): Promise<VisualPrompt[] | null> => {
    console.log('Generating visual prompts with:', { 
      postContent: postContent.substring(0, 100), 
      visualCount, 
      visualStyle, 
      contentType,
      hasAnalysis: !!analysisData
    });
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-visual-prompts', {
        body: {
          postContent,
          visualCount,
          visualStyle,
          contentType,
          postAnalysis: analysisData
        }
      });

      console.log('Visual prompts response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data || !data.success) {
        console.error('Function returned error:', data);
        throw new Error(data?.error || 'Failed to generate visual prompts');
      }

      console.log('Visual prompts generated successfully:', data.visualPrompts);
      setVisualPrompts(data.visualPrompts);
      
      // Store visual prompts in database with the current post (with error handling)
      if (currentPostId && data.visualPrompts) {
        try {
          console.log('Storing visual prompts in database for post:', currentPostId);
          const { error: updateError } = await supabase
            .from('generated_posts')
            .update({ 
              visual_count: data.visualPrompts.length,
              visual_style: visualStyle
              // Note: visual_prompts column will be added after migration
            })
            .eq('id', currentPostId);
          
          if (updateError) {
            console.warn('Failed to update post metadata:', updateError);
          } else {
            console.log('Post metadata updated successfully');
          }
        } catch (dbError) {
          console.warn('Database update error:', dbError);
        }
      }
      
      // Return the prompts directly for immediate use
      return data.visualPrompts;
    } catch (error) {
      console.error("Error generating visual prompts:", error);
      toast({
        variant: "destructive",
        title: "Prompt generation failed",
        description: "Failed to generate visual prompts. Please try again.",
      });
      return null;
    }
  };

  const loadVisualPromptsFromPost = async (postId: string): Promise<VisualPrompt[] | null> => {
    try {
      console.log('Loading visual prompts - feature will be enabled after migration');
      // TODO: Enable after migration 20250917000003_add_visual_prompts_column.sql is applied
      /*
      const { data: postData, error } = await supabase
        .from('generated_posts')
        .select('visual_prompts, visual_count, visual_style')
        .eq('id', postId)
        .single();

      if (error) {
        console.warn('Error loading visual prompts from database:', error);
        return null;
      }
      
      if (postData?.visual_prompts) {
        let parsedPrompts;
        try {
          parsedPrompts = typeof postData.visual_prompts === 'string' 
            ? JSON.parse(postData.visual_prompts)
            : postData.visual_prompts;
            
          setVisualPrompts(parsedPrompts);
          console.log('Visual prompts loaded successfully from database:', parsedPrompts.length, 'prompts');
          return parsedPrompts;
        } catch (parseError) {
          console.error('Error parsing stored visual prompts:', parseError);
          return null;
        }
      }
      */
      
      console.log('Visual prompts storage will be available after migration');
      return null;
    } catch (error) {
      console.error('Error loading visual prompts:', error);
      return null;
    }
  };

  const resetGeneration = () => {
    setGeneratedPost("");
    setCurrentPostId(null);
    setPostAnalysis(null);
    setVisualPrompts([]);
  };

  return {
    isGenerating,
    isAnalyzing,
    generatedPost,
    currentPostId,
    postAnalysis,
    visualPrompts,
    generatePost,
    analyzePostStructure,
    generateVisualPrompts,
    loadVisualPromptsFromPost,
    resetGeneration
  };
};