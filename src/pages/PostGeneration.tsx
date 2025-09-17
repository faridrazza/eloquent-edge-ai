import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Linkedin, ArrowLeft, Loader2, Sparkles, User as UserIcon, Wand2 } from "lucide-react";
import { useWritingStyle } from "@/hooks/use-writing-style";
import { usePostGeneration } from "@/hooks/use-post-generation";
import type { User } from "@supabase/supabase-js";

const PostGeneration = () => {
  const [user, setUser] = useState<User | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("generic");
  const navigate = useNavigate();
  const { hasStyle, isLoading: styleLoading } = useWritingStyle(user);
  const { 
    isGenerating, 
    generatedPost, 
    generatePost, 
    resetGeneration 
  } = usePostGeneration(user);

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

  const handleGeneratePost = async () => {
    if (!prompt.trim()) {
      toast({
        variant: "destructive",
        title: "Missing prompt",
        description: "Please enter what you want to post about.",
      });
      return;
    }

    const usePersonalStyle = selectedStyle === "personal";
    await generatePost(prompt, usePersonalStyle);
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(generatedPost);
    toast({
      title: "Copied to clipboard!",
      description: "Your post has been copied. You can now paste it on LinkedIn.",
    });
  };

  const handleNewPost = () => {
    setPrompt("");
    setSelectedStyle(hasStyle ? "personal" : "generic");
    resetGeneration();
  };

  if (styleLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
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
                Back to Dashboard
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
          {/* Page Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Create New Post</h1>
            <p className="text-xl text-muted-foreground">
              Generate engaging LinkedIn content that resonates with your audience
            </p>
          </div>

          {!generatedPost ? (
            <div className="space-y-6">
              {/* Prompt Input */}
              <Card>
                <CardHeader>
                  <CardTitle>What do you want to post about?</CardTitle>
                  <CardDescription>
                    Describe the topic, share an idea, or tell us what message you want to convey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="e.g., Tips for remote work productivity, My experience with career transitions, How to build a personal brand..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px] resize-none"
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    {prompt.length} characters
                  </div>
                </CardContent>
              </Card>

              {/* Style Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Writing Style</CardTitle>
                  <CardDescription>
                    Choose how you want your post to sound and feel
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="generic" id="generic" />
                        <Label htmlFor="generic" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            <div>
                              <div className="font-medium">Generic AI Style</div>
                              <div className="text-sm text-muted-foreground">
                                Professional, clear, and engaging content suitable for any audience
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>

                      <div className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                        hasStyle 
                          ? "hover:bg-muted/50 cursor-pointer" 
                          : "opacity-50 cursor-not-allowed bg-muted/20"
                      }`}>
                        <RadioGroupItem value="personal" id="personal" disabled={!hasStyle} />
                        <Label htmlFor="personal" className={`flex-1 ${hasStyle ? "cursor-pointer" : "cursor-not-allowed"}`}>
                          <div className="flex items-center gap-3">
                            <UserIcon className="w-5 h-5 text-green-500" />
                            <div>
                              <div className="font-medium">My Personal Style</div>
                              <div className="text-sm text-muted-foreground">
                                {hasStyle 
                                  ? "Content written in your unique voice based on your previous posts"
                                  : "Upload your previous posts first to enable this option"
                                }
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <Card className="border-2 border-primary/20">
                <CardContent className="p-6">
                  <Button 
                    onClick={handleGeneratePost}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating your post...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-5 w-5" />
                        Generate Post
                      </>
                    )}
                  </Button>
                  
                  {isGenerating && (
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                      AI is crafting your perfect LinkedIn post...
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Generated Post Display */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Your Generated Post
                  </CardTitle>
                  <CardDescription>
                    Here's your LinkedIn post ready to share. You can copy and customize it as needed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap font-mono text-sm">
                    {generatedPost}
                  </div>
                  
                  <div className="flex gap-3 mt-6">
                    <Button onClick={handleCopyPost} className="flex-1">
                      Copy to Clipboard
                    </Button>
                    <Button variant="outline" onClick={handleNewPost}>
                      Create Another Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PostGeneration;