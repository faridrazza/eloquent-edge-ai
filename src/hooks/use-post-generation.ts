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
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-post-structure', {
        body: { postContent }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze post structure');
      }

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
    contentType: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-visual-prompts', {
        body: {
          postContent,
          visualCount,
          visualStyle,
          contentType
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate visual prompts');
      }

      setVisualPrompts(data.visualPrompts);
      return true;
    } catch (error) {
      console.error("Error generating visual prompts:", error);
      toast({
        variant: "destructive",
        title: "Prompt generation failed",
        description: "Failed to generate visual prompts. Please try again.",
      });
      return false;
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
    resetGeneration
  };
};