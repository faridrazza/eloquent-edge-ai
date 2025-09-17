import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Linkedin, ArrowLeft, Loader2, CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { useWritingStyle } from "@/hooks/use-writing-style";
import type { User } from "@supabase/supabase-js";

const Onboarding = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showStyleLearning, setShowStyleLearning] = useState(false);
  const [posts, setPosts] = useState(["", "", "", "", ""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const navigate = useNavigate();
  const { analyzeWritingStyle } = useWritingStyle(user);

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

  const handleLearnMyStyle = () => {
    setShowStyleLearning(true);
  };

  const handleSkipForNow = () => {
    navigate("/dashboard");
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
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const success = await analyzeWritingStyle(filledPosts);
      
      if (success) {
        setAnalysisComplete(true);
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
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
                <span className="text-xl font-bold">PostCraft</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {!showStyleLearning ? (
            /* Welcome Screen */
            <div className="space-y-8">
              {/* Introduction */}
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">Welcome to PostCraft!</h1>
                <p className="text-xl text-muted-foreground">
                  Ready to create amazing LinkedIn content? Choose how you'd like to get started.
                </p>
              </div>

              {/* Option Cards */}
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Card className="hover:shadow-elegant transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50" onClick={handleLearnMyStyle}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">Learn My Writing Style</CardTitle>
                    <CardDescription className="text-base">
                      Paste 3-5 previous posts so AI understands your unique voice
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        This helps create more personalized content that sounds like you
                      </div>
                      <Button className="w-full" size="lg">
                        Get Started
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-elegant transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary/50" onClick={handleSkipForNow}>
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <ArrowRight className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-2xl">Skip for Now</CardTitle>
                    <CardDescription className="text-base">
                      Start creating posts right away (you can add your style later)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground">
                        Jump straight to creating content with our AI assistant
                      </div>
                      <Button variant="outline" className="w-full" size="lg">
                        Continue to Dashboard
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                You can always teach AI your writing style later from the dashboard
              </div>
            </div>
          ) : (
            /* Style Learning Section */
            <div className="space-y-8">
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
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleAnalyzeStyle}
                      disabled={isAnalyzing || posts.filter(p => p.trim().length > 50).length < 3}
                      className="flex-1"
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
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setShowStyleLearning(false)}
                      disabled={isAnalyzing}
                      className="px-8"
                    >
                      Back
                    </Button>
                  </div>
                  
                  {isAnalyzing && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      This may take a few moments while our AI analyzes your writing patterns...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;