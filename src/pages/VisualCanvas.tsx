import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { 
  Linkedin, 
  ArrowLeft, 
  Send, 
  Upload, 
  Download, 
  Share2, 
  Maximize2, 
  Loader2,
  Trash2,
  Copy,
  Save,
  Image as Gallery,
  Plus,
  LogOut,
  User as UserIcon,
  CreditCard,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

interface ReferenceImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
}

const VisualCanvas = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
    // Add welcome message when component loads
    if (chatMessages.length === 0) {
      setChatMessages([{
        id: Date.now().toString(),
        type: 'ai',
        content: 'Welcome to Visual Canvas! Start creating visuals with AI. Describe what you want to create, upload reference images, or both!',
        timestamp: new Date()
      }]);
    }
  }, [chatMessages.length]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to sign out",
      });
    } else {
      navigate("/");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          variant: "destructive",
          title: "File too large",
          description: `${file.name} is larger than 10MB limit`,
        });
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: `${file.name} is not a supported image format`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newImage: ReferenceImage = {
          id: Date.now().toString() + Math.random(),
          file,
          preview: base64,
          base64: base64.split(',')[1] // Remove data:image/... prefix
        };
        
        setReferenceImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeReferenceImage = (imageId: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== imageId));
  };

  const generateImage = async () => {
    if (!currentPrompt.trim() && referenceImages.length === 0) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please enter a prompt or upload reference images",
      });
      return;
    }

    if (!profile || profile.credits_remaining < 1) {
      toast({
        variant: "destructive",
        title: "Insufficient credits",
        description: "You need at least 1 credit to generate an image",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Add user message to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: currentPrompt || "Generate image from uploaded references",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMessage]);

      // Call our edge function for image generation
      const { data, error } = await supabase.functions.invoke('generate-visual-canvas', {
        body: {
          prompt: currentPrompt,
          referenceImages: referenceImages.map(img => ({
            mimeType: img.file.type,
            data: img.base64
          })),
          currentImage: currentImage ? currentImage.split(',')[1] : null // If editing existing image
        }
      });

      if (error) throw error;

      if (data.success && data.imageUrl) {
        setCurrentImage(data.imageUrl);
        
        // Add AI response to chat
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "Image generated successfully!",
          imageUrl: data.imageUrl,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiMessage]);

        // Update credits
        setProfile(prev => prev ? { ...prev, credits_remaining: prev.credits_remaining - 1 } : null);

        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }

    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Failed to generate image. Please try again.",
      });
    } finally {
      setIsGenerating(false);
      setCurrentPrompt("");
      setReferenceImages([]);
    }
  };

  const downloadImage = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `visual-canvas-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "Failed to download image",
      });
    }
  };

  const shareImage = async () => {
    if (!currentImage) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Visual Canvas Creation',
          url: currentImage
        });
      } else {
        await navigator.clipboard.writeText(currentImage);
        toast({
          title: "Link copied",
          description: "Image link copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Share failed",
        description: "Failed to share image",
      });
    }
  };

  const clearChat = () => {
    setChatMessages([{
      id: Date.now().toString(),
      type: 'ai',
      content: 'Chat cleared! Ready for a new creative session.',
      timestamp: new Date()
    }]);
    setCurrentImage(null);
    setReferenceImages([]);
  };

  const saveProject = async () => {
    if (!projectName.trim()) {
      toast({
        variant: "destructive",
        title: "Input required",
        description: "Please enter a project name",
      });
      return;
    }

    if (chatMessages.length <= 1) {
      toast({
        variant: "destructive",
        title: "Nothing to save",
        description: "Generate some images first before saving",
      });
      return;
    }

    // For now, just save to localStorage until database is properly set up
    const projectData = {
      name: projectName.trim(),
      conversation: chatMessages,
      finalImage: currentImage,
      createdAt: new Date().toISOString()
    };

    try {
      const existingProjects = JSON.parse(localStorage.getItem('visualCanvasProjects') || '[]');
      existingProjects.push(projectData);
      localStorage.setItem('visualCanvasProjects', JSON.stringify(existingProjects));

      toast({
        title: "Project saved",
        description: `Project "${projectName}" saved locally!`,
      });

      setProjectName("");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "Failed to save project locally.",
      });
    }
  };

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
                Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Linkedin className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold">Visual Canvas</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {chatMessages.length > 1 && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Project name..."
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-40"
                    disabled={false}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={saveProject}
                    disabled={!projectName.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Project
                  </Button>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Chat
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                <span>{profile?.credits_remaining || 0} credits</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="w-4 h-4" />
                <span>{profile?.full_name || user?.email}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[400px_1fr] gap-6 h-[calc(100vh-200px)]">
            
            {/* Chat Interface - Left Sidebar */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">AI Assistant</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                
                {/* Reference Images Upload */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Reference Images</span>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mb-2"
                    disabled={isGenerating}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                  </Button>

                  {/* Reference Image Previews */}
                  {referenceImages.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {referenceImages.map((image) => (
                        <div key={image.id} className="relative">
                          <img
                            src={image.preview}
                            alt="Reference"
                            className="w-full h-20 object-cover rounded border"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute -top-1 -right-1 w-5 h-5 p-0"
                            onClick={() => removeReferenceImage(image.id)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Chat History */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-60">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground ml-4' 
                          : 'bg-muted mr-4'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      {message.imageUrl && (
                        <img
                          src={message.imageUrl}
                          alt="Generated"
                          className="mt-2 max-w-full h-20 object-cover rounded"
                        />
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Input Area */}
                <div className="space-y-2">
                  <Textarea
                    value={currentPrompt}
                    onChange={(e) => setCurrentPrompt(e.target.value)}
                    placeholder="Describe what you want to create..."
                    className="min-h-20 resize-none"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={generateImage}
                    disabled={isGenerating || (!currentPrompt.trim() && referenceImages.length === 0)}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main Canvas Area */}
            <Card className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Canvas</CardTitle>
                  {currentImage && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setImageZoom(Math.max(0.5, imageZoom - 0.25))}>
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <span className="text-sm">{Math.round(imageZoom * 100)}%</span>
                      <Button variant="outline" size="sm" onClick={() => setImageZoom(Math.min(2, imageZoom + 0.25))}>
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)}>
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {currentImage ? (
                  <div className="flex-1 flex items-center justify-center bg-muted rounded-lg p-4 overflow-auto">
                    <img
                      src={currentImage}
                      alt="Generated"
                      className="max-w-full max-h-full object-contain transition-transform"
                      style={{ transform: `scale(${imageZoom})` }}
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-muted rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <Gallery className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No image generated yet</p>
                      <p className="text-sm">Start by entering a prompt or uploading reference images</p>
                    </div>
                  </div>
                )}

                {/* Image Controls */}
                {currentImage && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={downloadImage}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={shareImage}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Fullscreen Modal */}
      {isFullscreen && currentImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={currentImage}
              alt="Generated"
              className="max-w-full max-h-full object-contain"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4"
              onClick={() => setIsFullscreen(false)}
            >
              ×
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualCanvas;