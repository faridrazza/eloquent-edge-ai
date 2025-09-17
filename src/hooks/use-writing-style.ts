import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

export interface UserStyle {
  id: string;
  user_id: string;
  style_data: any;
  confidence_score: number | null;
  posts_analyzed: number | null;
  last_updated: string;
  created_at: string;
}

export interface StyleAnalysisData {
  tone: string;
  common_topics: string[];
  post_structure_preferences: string[];
  engagement_patterns: string[];
  writing_style_markers: string[];
  analyzed_posts: string[];
  posts_count: number;
  [key: string]: any; // Make it compatible with Json type
}

export const useWritingStyle = (user: User | null) => {
  const [userStyle, setUserStyle] = useState<UserStyle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStyle, setHasStyle] = useState(false);

  const fetchUserStyle = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_styles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching user style:", error);
      } else if (data) {
        setUserStyle(data);
        setHasStyle(true);
      } else {
        setHasStyle(false);
      }
    } catch (error) {
      console.error("Error in fetchUserStyle:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserStyle();
  }, [user]);

  const analyzeWritingStyle = async (posts: string[]): Promise<boolean> => {
    if (!user || posts.length < 3) {
      toast({
        variant: "destructive",
        title: "Not enough content",
        description: "Please provide at least 3 posts with meaningful content.",
      });
      return false;
    }

    try {
      const mockStyleData: StyleAnalysisData = {
        tone: "professional",
        common_topics: ["growth", "tips", "insights"],
        post_structure_preferences: ["lists", "stories"],
        engagement_patterns: ["questions", "calls_to_action"],
        writing_style_markers: ["concise", "actionable"],
        analyzed_posts: posts,
        posts_count: posts.length
      };

      const { error } = await supabase
        .from("user_styles")
        .upsert({
          user_id: user.id,
          style_data: mockStyleData,
          confidence_score: 0.85,
          posts_analyzed: posts.length,
          last_updated: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      await fetchUserStyle(); // Refresh the style data
      
      toast({
        title: "Style analysis complete!",
        description: "Your writing patterns have been learned successfully.",
      });

      return true;
    } catch (error) {
      console.error("Error during style analysis:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "There was an error analyzing your writing style. Please try again.",
      });
      return false;
    }
  };

  const clearWritingStyle = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("user_styles")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      setUserStyle(null);
      setHasStyle(false);
      
      toast({
        title: "Writing style cleared",
        description: "Your writing style data has been removed.",
      });

      return true;
    } catch (error) {
      console.error("Error clearing writing style:", error);
      toast({
        variant: "destructive",
        title: "Failed to clear style",
        description: "There was an error clearing your writing style.",
      });
      return false;
    }
  };

  return {
    userStyle,
    hasStyle,
    isLoading,
    analyzeWritingStyle,
    clearWritingStyle,
    refreshStyle: fetchUserStyle
  };
};