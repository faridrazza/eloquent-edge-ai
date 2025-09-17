import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Plus, Trash2 } from "lucide-react";
import { useWritingStyle } from "@/hooks/use-writing-style";
import type { User } from "@supabase/supabase-js";

interface WritingStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onStyleLearned?: () => void;
}

const WritingStyleModal = ({ isOpen, onClose, user, onStyleLearned }: WritingStyleModalProps) => {
  const [posts, setPosts] = useState(["", "", "", "", ""]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const { analyzeWritingStyle } = useWritingStyle(user);

  const handlePostChange = (index: number, value: string) => {
    const newPosts = [...posts];
    newPosts[index] = value;
    setPosts(newPosts);
  };

  const addPostField = () => {
    if (posts.length < 10) {
      setPosts([...posts, ""]);
    }
  };

  const removePostField = (index: number) => {
    if (posts.length > 3) {
      const newPosts = posts.filter((_, i) => i !== index);
      setPosts(newPosts);
    }
  };

  const handleAnalyzeStyle = async () => {
    const filledPosts = posts.filter(post => post.trim().length > 50);
    
    if (filledPosts.length < 3) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const success = await analyzeWritingStyle(filledPosts);
      
      if (success) {
        setAnalysisComplete(true);
        
        // Close modal and call callback after a short delay
        setTimeout(() => {
          setAnalysisComplete(false);
          onClose();
          onStyleLearned?.();
          // Reset form
          setPosts(["", "", "", "", ""]);
        }, 2000);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    if (!isAnalyzing) {
      onClose();
      setAnalysisComplete(false);
      setPosts(["", "", "", "", ""]);
    }
  };

  if (analysisComplete) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center p-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">Style Analysis Complete!</h2>
            <p className="text-muted-foreground mb-6">
              AI has successfully learned your writing patterns. You can now generate posts in your personal style!
            </p>
            <div className="text-sm text-muted-foreground">
              Closing in a moment...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const filledPosts = posts.filter(post => post.trim().length > 50);
  const canAnalyze = filledPosts.length >= 3 && !isAnalyzing;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Teach AI Your Writing Style</DialogTitle>
          <DialogDescription>
            Paste 3-5 of your previous LinkedIn posts below so AI can understand your unique voice and tone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Post Input Fields */}
          <div className="space-y-4">
            {posts.map((post, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`post-${index}`} className="text-sm font-medium">
                    Post {index + 1} {index < 3 && <span className="text-destructive">*</span>}
                    {index >= 3 && " (Optional)"}
                  </Label>
                  {posts.length > 3 && index >= 3 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePostField(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <Textarea
                  id={`post-${index}`}
                  placeholder="Paste your LinkedIn post content here..."
                  value={post}
                  onChange={(e) => handlePostChange(index, e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="text-xs text-muted-foreground">
                  {post.length} characters {post.length >= 50 && "✓"}
                </div>
              </div>
            ))}
          </div>

          {/* Add More Posts Button */}
          {posts.length < 10 && (
            <Button
              type="button"
              variant="outline"
              onClick={addPostField}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add More Posts (Optional)
            </Button>
          )}

          {/* Analysis Section */}
          <div className="border-t pt-6">
            <div className="text-sm text-muted-foreground mb-4">
              Posts ready for analysis: {filledPosts.length}/3 minimum required
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyzeStyle}
                disabled={!canAnalyze}
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
                onClick={handleClose}
                disabled={isAnalyzing}
                className="px-8"
              >
                Cancel
              </Button>
            </div>
            
            {isAnalyzing && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                This may take a few moments while our AI analyzes your writing patterns...
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WritingStyleModal;