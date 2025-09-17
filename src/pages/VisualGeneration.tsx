import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Linkedin, ArrowLeft, Loader2, CheckCircle, XCircle, Pause, Play, X } from "lucide-react";
import { useVisualGeneration } from "@/hooks/use-visual-generation";
import { usePostGeneration } from "@/hooks/use-post-generation";
import type { User } from "@supabase/supabase-js";

const VisualGeneration = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');
  const visualCount = parseInt(searchParams.get('visualCount') || '6');
  const visualStyle = searchParams.get('visualStyle') || 'infographic';
  const contentType = searchParams.get('contentType') || 'tips';
  const [isCancelled, setIsCancelled] = useState(false);
  const navigate = useNavigate();
  
  const { 
    isGenerating, 
    generationProgress, 
    currentJob, 
    generatedVisuals,
    startVisualGeneration,
    resetGeneration 
  } = useVisualGeneration(user, postId || undefined);
  
  const { generateVisualPrompts, visualPrompts, loadVisualPromptsFromPost, postAnalysis } = usePostGeneration(user);

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

  useEffect(() => {
    if (!postId || !visualCount || !visualStyle) {
      navigate("/post-generation");
      return;
    }

    // Start generation process when component loads and user is available
    if (user) {
      startGeneration();
    }
  }, [postId, visualCount, visualStyle, contentType, user]);

  const startGeneration = async () => {
    if (!user || !postId) {
      console.log('Missing user or postId:', { user: !!user, postId });
      return;
    }

    try {
      // First, get the post content
      const { data: postData, error } = await supabase
        .from('generated_posts')
        .select('generated_content')
        .eq('id', postId)
        .single();

      if (error || !postData) {
        console.error('Post fetch error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not find the post data.",
        });
        navigate("/post-generation");
        return;
      }

      console.log('Post content found, checking for existing visual prompts...');
      
      // First, try to load existing visual prompts from the database
      const existingPrompts = await loadVisualPromptsFromPost(postId);
      
      if (existingPrompts && existingPrompts.length > 0) {
        console.log('Using existing visual prompts from database');
        await startVisualGeneration(postId, existingPrompts, postData.generated_content);
        return;
      }
      
      console.log('No existing prompts found, generating new visual prompts...');

      // Generate visual prompts first and wait for completion
      const generatedPrompts = await generateVisualPrompts(
        postData.generated_content,
        visualCount,
        visualStyle,
        contentType,
        postAnalysis  // Pass the analysis data for better prompt generation
      );

      console.log('Visual prompts generated successfully');
      
      if (generatedPrompts && generatedPrompts.length > 0) {
        console.log('Visual prompts available after generation, count:', generatedPrompts.length);
        console.log('Starting visual generation with prompts:', generatedPrompts);
        await startVisualGeneration(postId, generatedPrompts, postData.generated_content);
      } else {
        console.error('Visual prompts not available after generation');
        toast({
          variant: "destructive",
          title: "Generation failed",
          description: "Failed to retrieve visual prompts.",
        });
      }
    } catch (error) {
      console.error("Error starting generation:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Failed to start visual generation process.",
      });
    }
  };

  const handleCancel = () => {
    setIsCancelled(true);
    resetGeneration();
    navigate(`/visual-strategy?postId=${postId}`);
  };

  const handleViewResults = () => {
    navigate(`/preview-download?postId=${postId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'generating':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      default:
        return <div className="w-4 h-4 bg-muted rounded-full" />;
    }
  };

  const getOverallProgress = () => {
    if (!currentJob) return 0;
    return Math.round((currentJob.completedVisuals / currentJob.totalVisuals) * 100);
  };

  const isCompleted = currentJob?.status === 'completed' && !isGenerating;
  const hasFailed = currentJob?.status === 'failed';

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
                onClick={() => navigate(`/visual-strategy?postId=${postId}`)}
                disabled={isGenerating && !isCancelled}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Strategy
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
            <h1 className="text-4xl font-bold">
              {isCompleted ? "Generation Complete!" : "Creating Your Visuals"}
            </h1>
            <p className="text-xl text-muted-foreground">
              {isCompleted 
                ? "Your visual content is ready for download" 
                : "AI is crafting your personalized visual content..."
              }
            </p>
          </div>

          {/* Overall Progress */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generation Progress</span>
                <Badge variant={isCompleted ? "default" : "secondary"}>
                  {isCompleted ? "Complete" : `${getOverallProgress()}%`}
                </Badge>
              </CardTitle>
              <CardDescription>
                Creating {visualCount} {visualStyle} images for your {contentType} post
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={getOverallProgress()} className="w-full" />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    {currentJob?.completedVisuals || 0} of {currentJob?.totalVisuals || visualCount} completed
                  </span>
                  <span>
                    {currentJob?.failedVisuals || 0} failed
                  </span>
                </div>

                {isGenerating && !isCancelled && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel Generation
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Individual Visual Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Image Progress</CardTitle>
              <CardDescription>
                Track the generation status of each visual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: visualCount }, (_, index) => {
                  const visual = generatedVisuals.find(v => v.order === index + 1);
                  const status = visual?.status || 'pending';
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(status)}
                        <div>
                          <p className="font-medium">
                            {visual?.title || `Visual ${index + 1}`}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {status === 'generating' ? 'Generating...' : 
                             status === 'completed' ? 'Ready' :
                             status === 'failed' ? 'Failed to generate' : 'Waiting...'}
                          </p>
                        </div>
                      </div>
                      
                      <Badge 
                        variant={
                          status === 'completed' ? 'default' :
                          status === 'failed' ? 'destructive' :
                          status === 'generating' ? 'secondary' : 'outline'
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Generation Status Messages */}
          {isGenerating && !isCancelled && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-900">Generation in progress...</p>
                    <p className="text-sm text-blue-700">
                      This may take a few minutes. You can cancel at any time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isCompleted && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-900">Generation complete!</p>
                      <p className="text-sm text-green-700">
                        {currentJob?.completedVisuals || generatedVisuals.length} visuals ready for download
                      </p>
                    </div>
                  </div>
                  <Button onClick={handleViewResults}>
                    View & Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {hasFailed && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="font-medium text-red-900">Generation failed</p>
                      <p className="text-sm text-red-700">
                        Please try again with different settings
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/visual-strategy?postId=${postId}`)}
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips During Generation */}
          {isGenerating && !isCancelled && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💡 Pro Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Your visuals are being optimized for LinkedIn's best practices</li>
                  <li>• Each image is designed for maximum engagement and readability</li>
                  <li>• You can regenerate individual images later if needed</li>
                  <li>• All images will be available in high resolution for download</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default VisualGeneration;