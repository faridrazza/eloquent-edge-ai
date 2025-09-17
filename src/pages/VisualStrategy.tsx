import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Linkedin, ArrowLeft, Loader2, Image, Grid3X3, Palette, BarChart3, Quote, Sparkles, CreditCard } from "lucide-react";
import { usePostGeneration } from "@/hooks/use-post-generation";
import type { User } from "@supabase/supabase-js";

const VisualStrategy = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');
  const [selectedFormat, setSelectedFormat] = useState("carousel");
  const [selectedStyle, setSelectedStyle] = useState("infographic");
  const [customImageCount, setCustomImageCount] = useState([6]);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { 
    isAnalyzing, 
    postAnalysis, 
    analyzePostStructure, 
    generatedPost 
  } = usePostGeneration(user);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      // Get user profile for credits
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    if (!postId) {
      navigate("/post-generation");
      return;
    }

    // Fetch post data and analyze when component loads
    fetchAndAnalyzePost();
  }, [postId]);

  const fetchAndAnalyzePost = async () => {
    if (!postId) return;

    try {
      // First, get the post content
      const { data: postData, error } = await supabase
        .from('generated_posts')
        .select('generated_content')
        .eq('id', postId)
        .single();

      if (error || !postData) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not find the post data.",
        });
        navigate("/post-generation");
        return;
      }

      // Analyze the post structure
      await analyzePostStructure(postData.generated_content);
    } catch (error) {
      console.error("Error fetching post data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load post data.",
      });
    }
  };

  const formatOptions = [
    {
      id: "single",
      name: "Single Infographic",
      description: "All content in one comprehensive image",
      credits: 1,
      icon: Image,
      recommended: false
    },
    {
      id: "carousel",
      name: "Carousel Post",
      description: "Multiple images for LinkedIn carousel",
      credits: postAnalysis?.recommended_visual_count || 6,
      icon: Grid3X3,
      recommended: true
    },
    {
      id: "custom",
      name: "Custom",
      description: "Choose your own number of images",
      credits: customImageCount[0],
      icon: Sparkles,
      recommended: false
    }
  ];

  const styleOptions = [
    {
      id: "infographic",
      name: "Infographics",
      description: "Data-focused, clean design with charts and icons",
      icon: BarChart3
    },
    {
      id: "quote_cards",
      name: "Quote Cards",
      description: "Bold text, minimal design for high impact",
      icon: Quote
    },
    {
      id: "mixed",
      name: "Mixed Style",
      description: "Combination of infographic and quote elements",
      icon: Palette
    }
  ];

  const getEstimatedCredits = () => {
    if (selectedFormat === "single") return 1;
    if (selectedFormat === "carousel") return postAnalysis?.recommended_visual_count || 6;
    if (selectedFormat === "custom") return customImageCount[0];
    return 6;
  };

  const handleGenerateVisuals = () => {
    const estimatedCredits = getEstimatedCredits();
    
    if (!profile || profile.credits_remaining < estimatedCredits) {
      toast({
        variant: "destructive",
        title: "Insufficient credits",
        description: `You need ${estimatedCredits} credits but only have ${profile?.credits_remaining || 0}.`,
      });
      return;
    }

    const visualCount = getEstimatedCredits();
    const params = new URLSearchParams({
      postId: postId!,
      visualCount: visualCount.toString(),
      visualStyle: selectedStyle,
      contentType: postAnalysis?.content_type || "tips"
    });

    navigate(`/visual-generation?${params.toString()}`);
  };

  if (!postAnalysis && isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 bg-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing your post structure...</p>
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
                onClick={() => navigate("/post-generation")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Post
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Linkedin className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">PostCraft</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>{profile?.credits_remaining || 0} credits</span>
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
            <h1 className="text-4xl font-bold">Visual Strategy</h1>
            <p className="text-xl text-muted-foreground">
              Choose how you want to visualize your content
            </p>
          </div>

          {/* AI Analysis Results */}
          {postAnalysis && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  AI Analysis Results
                </CardTitle>
                <CardDescription>
                  Our AI analyzed your post and detected the following:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Content Type</p>
                    <p className="text-muted-foreground capitalize">{postAnalysis.content_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Primary Topic</p>
                    <p className="text-muted-foreground">{postAnalysis.primary_topic}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">Key Points Detected</p>
                    <p className="text-muted-foreground">{postAnalysis.key_points?.length || 0} points</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">AI Recommendation</p>
                    <Badge variant="secondary">
                      {postAnalysis.recommended_visual_count} images
                    </Badge>
                  </div>
                </div>
                
                {postAnalysis.visual_breakdown && postAnalysis.visual_breakdown.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Recommended Structure:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {postAnalysis.visual_breakdown.map((item, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Visual Format</CardTitle>
              <CardDescription>
                Select how you want to present your content visually
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedFormat} onValueChange={setSelectedFormat}>
                <div className="space-y-4">
                  {formatOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div 
                        key={option.id}
                        className={`flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                          option.recommended ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="w-5 h-5 text-primary" />
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {option.name}
                                  {option.recommended && (
                                    <Badge variant="secondary" className="text-xs">
                                      AI Recommended
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{option.credits} credits</div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {/* Custom Image Count Slider */}
              {selectedFormat === "custom" && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/20">
                  <Label className="text-sm font-medium mb-3 block">
                    Number of images: {customImageCount[0]}
                  </Label>
                  <Slider
                    value={customImageCount}
                    onValueChange={setCustomImageCount}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>1 image</span>
                    <span>10 images</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Style Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose Visual Style</CardTitle>
              <CardDescription>
                Select the design style for your visual content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedStyle} onValueChange={setSelectedStyle}>
                <div className="space-y-4">
                  {styleOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div 
                        key={option.id}
                        className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-primary" />
                            <div>
                              <div className="font-medium">{option.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Summary and Generate Button */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Generation Summary</CardTitle>
              <CardDescription>
                Review your selections before generating visuals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Format</p>
                    <p className="text-muted-foreground">
                      {formatOptions.find(f => f.id === selectedFormat)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Style</p>
                    <p className="text-muted-foreground">
                      {styleOptions.find(s => s.id === selectedStyle)?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Number of Images</p>
                    <p className="text-muted-foreground">{getEstimatedCredits()} images</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Credit Cost</p>
                    <p className="text-muted-foreground">{getEstimatedCredits()} credits</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleGenerateVisuals}
                    className="w-full"
                    size="lg"
                    disabled={!profile || profile.credits_remaining < getEstimatedCredits()}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate {getEstimatedCredits()} Visuals ({getEstimatedCredits()} credits)
                  </Button>
                  
                  {profile && profile.credits_remaining < getEstimatedCredits() && (
                    <p className="text-sm text-destructive mt-2 text-center">
                      Insufficient credits. You have {profile.credits_remaining} but need {getEstimatedCredits()}.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VisualStrategy;