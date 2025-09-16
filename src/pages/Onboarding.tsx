import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Linkedin, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Onboarding = () => {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState(["", "", "", "", ""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkAuth();
  }, [navigate]);

  const handlePostChange = (index: number, value: string) => {
    const newPosts = [...posts];
    newPosts[index] = value;
    setPosts(newPosts);
  };

  const handleAnalyzeStyle = async () => {
    const filledPosts = posts.filter(post => post.trim().length > 50);
    
    if (filledPosts.length < 3) {
      toast({
        variant: "destructive",
        title: "Not enough content",
        description: "Please provide at least 3 posts with meaningful content (50+ characters each).",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      // For now, we'll simulate the analysis and store basic data
      // In the future, this will call the OpenAI API via an edge function
      
      const mockStyleData = {
        tone: "professional",
        common_topics: ["growth", "tips", "insights"],
        post_structure_preferences: ["lists", "stories"],
        engagement_patterns: ["questions", "calls_to_action"],
        writing_style_markers: ["concise", "actionable"],
        analyzed_posts: filledPosts,
        posts_count: filledPosts.length
      };

      // Store the style analysis in the database
      const { error } = await supabase
        .from("user_styles")
        .upsert({
          user_id: user?.id,
          style_data: mockStyleData,
          confidence_score: 0.85,
          posts_analyzed: filledPosts.length,
          last_updated: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setAnalysisComplete(true);
      
      toast({
        title: "Style analysis complete!",
        description: "Your writing patterns have been learned successfully.",
      });

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);

    } catch (error) {
      console.error("Error during style analysis:", error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: "There was an error analyzing your writing style. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (analysisComplete) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Style Analysis Complete!</h2>
            <p className="text-muted-foreground mb-6">
              AI has successfully learned your writing patterns. You're ready to create content!
            </p>
            <div className="text-sm text-muted-foreground">
              Redirecting to dashboard...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Linkedin className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">ContentAI</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Introduction */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Let's learn your writing style</h1>
            <p className="text-xl text-muted-foreground">
              Paste 3-5 of your previous LinkedIn posts so AI can understand your unique voice
            </p>
          </div>

          {/* Post Input Cards */}
          <div className="grid gap-6">
            {posts.map((post, index) => (
              <Card key={index} className="hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Post {index + 1} {index < 3 && <span className="text-destructive">*</span>}
                  </CardTitle>
                  <CardDescription>
                    {index < 3 ? "Required" : "Optional"} - Paste a complete LinkedIn post here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste your LinkedIn post content here..."
                    value={post}
                    onChange={(e) => handlePostChange(index, e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    {post.length} characters {post.length >= 50 && "✓"}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analysis Section */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Ready to analyze your style?</CardTitle>
              <CardDescription>
                Make sure you've filled in at least 3 posts with meaningful content (50+ characters each)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleAnalyzeStyle}
                disabled={isAnalyzing || posts.filter(p => p.trim().length > 50).length < 3}
                className="w-full"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    AI is learning your writing patterns...
                  </>
                ) : (
                  "Analyze My Style"
                )}
              </Button>
              
              {isAnalyzing && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  This may take a few moments while our AI analyzes your writing patterns...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;