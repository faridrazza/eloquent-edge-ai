import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { 
  Linkedin, 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  Edit, 
  Copy, 
  Grid3X3, 
  Share2,
  FileImage,
  Plus
} from "lucide-react";
import { useVisualGeneration } from "@/hooks/use-visual-generation";
import type { User } from "@supabase/supabase-js";

const PreviewDownload = () => {
  const [user, setUser] = useState<User | null>(null);
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');
  const [generatedPost, setGeneratedPost] = useState<string>("");
  const [currentPostVisuals, setCurrentPostVisuals] = useState<any[]>([]);
  const [isEditPromptOpen, setIsEditPromptOpen] = useState(false);
  const [selectedVisual, setSelectedVisual] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const navigate = useNavigate();
  
  const { 
    regenerateVisual,
    downloadVisual
  } = useVisualGeneration(user);

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
    if (!postId) {
      navigate("/post-generation");
      return;
    }

    // Fetch the generated post content and visuals
    fetchPostData();
  }, [postId]);

  const fetchPostData = async () => {
    if (!postId) return;

    try {
      // Get post content
      const { data: postData, error: postError } = await supabase
        .from('generated_posts')
        .select('generated_content')
        .eq('id', postId)
        .single();

      if (postError) throw postError;
      setGeneratedPost(postData.generated_content);

      // Get generated visuals - ONLY for this specific post
      const { data: visualsData, error: visualsError } = await supabase
        .from('generated_visuals')
        .select('*')
        .eq('post_id', postId)
        .order('generation_order');

      if (visualsError) throw visualsError;
      
      // Transform to match the hook's expected format
      const transformedVisuals = visualsData.map(visual => ({
        id: visual.id,
        order: visual.generation_order || 1,
        title: `Visual ${visual.generation_order}`,
        imageUrl: visual.image_url || '',
        prompt: visual.prompt_used || '',
        textOverlay: '',
        status: visual.status as 'generating' | 'completed' | 'failed'
      }));

      // Set the visuals for this specific post only
      setCurrentPostVisuals(transformedVisuals);

    } catch (error) {
      console.error("Error fetching post data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your content.",
      });
    }
  };

  const handleCopyPost = () => {
    navigator.clipboard.writeText(generatedPost);
    toast({
      title: "Copied!",
      description: "Post text copied to clipboard.",
    });
  };

  const handleDownloadVisual = async (visual: any) => {
    if (visual.imageUrl) {
      await downloadVisual(visual.imageUrl, `${visual.title.replace(/\s+/g, '_')}.jpg`);
    }
  };

  const handleDownloadAllCurrentVisuals = async () => {
    if (currentPostVisuals.length === 0) return;

    try {
      // Download only the completed visuals from the current post
      for (let i = 0; i < currentPostVisuals.length; i++) {
        const visual = currentPostVisuals[i];
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

  const handleRegenerateVisual = async (visualId: string) => {
    const success = await regenerateVisual(visualId, newPrompt || undefined);
    if (success) {
      // Refresh the current post visuals after regeneration
      fetchPostData();
    }
    setIsEditPromptOpen(false);
    setNewPrompt("");
    setSelectedVisual(null);
  };

  const handleEditPrompt = (visual: any) => {
    setSelectedVisual(visual.id);
    setNewPrompt(visual.prompt);
    setIsEditPromptOpen(true);
  };

  const completedVisuals = currentPostVisuals.filter(v => v.status === 'completed');
  const failedVisuals = currentPostVisuals.filter(v => v.status === 'failed');

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
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Page Title */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Preview & Download</h1>
            <p className="text-xl text-muted-foreground">
              Your content is ready! Review, download, and share your visuals.
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{currentPostVisuals.length}</div>
                <div className="text-sm text-muted-foreground">Total Visuals</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{completedVisuals.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{failedVisuals.length}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">High</div>
                <div className="text-sm text-muted-foreground">Quality</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Post Content */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Post Content
                    <Button variant="outline" size="sm" onClick={handleCopyPost}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Your generated LinkedIn post text
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">
                    {generatedPost}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visual Content */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Bulk Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Grid3X3 className="w-5 h-5" />
                        Visual Content ({completedVisuals.length} ready)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        onClick={handleDownloadAllCurrentVisuals}
                        disabled={completedVisuals.length === 0}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download All ({completedVisuals.length})
                      </Button>
                      <Button variant="outline" disabled>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Collection
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => navigate("/post-generation")}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Another Post
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Visuals */}
                <div className="grid md:grid-cols-2 gap-6">
                  {currentPostVisuals.map((visual) => (
                    <Card key={visual.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center justify-between">
                          <span>{visual.title}</span>
                          <Badge 
                            variant={
                              visual.status === 'completed' ? 'default' :
                              visual.status === 'failed' ? 'destructive' : 'secondary'
                            }
                          >
                            {visual.status}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Image Preview */}
                        {visual.status === 'completed' && visual.imageUrl ? (
                          <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                            <img 
                              src={visual.imageUrl} 
                              alt={visual.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                              onClick={() => window.open(visual.imageUrl, '_blank')}
                            />
                          </div>
                        ) : visual.status === 'failed' ? (
                          <div className="aspect-square bg-red-50 border-2 border-dashed border-red-200 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <FileImage className="w-8 h-8 text-red-400 mx-auto mb-2" />
                              <p className="text-sm text-red-600">Generation failed</p>
                            </div>
                          </div>
                        ) : (
                          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <FileImage className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Generating...</p>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {visual.status === 'completed' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleDownloadVisual(visual)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleEditPrompt(visual)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Regenerate
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditPrompt(visual)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Prompt Preview */}
                        {visual.prompt && (
                          <div className="text-xs text-muted-foreground bg-muted p-2 rounded text-ellipsis overflow-hidden">
                            {visual.prompt.substring(0, 100)}...
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Prompt Dialog */}
      <Dialog open={isEditPromptOpen} onOpenChange={setIsEditPromptOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Visual Prompt</DialogTitle>
            <DialogDescription>
              Modify the AI prompt to regenerate this visual with different specifications.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Visual Generation Prompt</Label>
              <Textarea
                id="prompt"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Describe how you want this visual to look..."
                className="min-h-[120px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditPromptOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedVisual && handleRegenerateVisual(selectedVisual)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Visual
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreviewDownload;