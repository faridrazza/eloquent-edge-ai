import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Eye, 
  Download, 
  Trash2, 
  Plus,
  Linkedin,
  LogOut,
  User as UserIcon,
  CreditCard
} from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface GeneratedPost {
  id: string;
  original_prompt: string;
  generated_content: string;
  post_structure: string;
  visual_count: number;
  visual_style: string | null;
  created_at: string;
}

const MyPosts = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch user's generated posts
      await fetchPosts(session.user.id);
    };

    getUser();
  }, [navigate]);

  const fetchPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("generated_posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching posts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load your posts",
        });
      } else {
        setPosts(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("generated_posts")
        .delete()
        .eq("id", postId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete post",
        });
      } else {
        setPosts(posts.filter(post => post.id !== postId));
        toast({
          title: "Success",
          description: "Post deleted successfully",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Post content copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy to clipboard",
      });
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your posts...</p>
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
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Linkedin className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold">PostCraft</span>
            </div>
            
            <div className="flex items-center gap-4">
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
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold">My Generated Posts</h1>
                <p className="text-muted-foreground">
                  View and manage your LinkedIn content library
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/post-generation")}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Post
            </Button>
          </div>

          {/* Posts Grid */}
          {posts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Start creating engaging LinkedIn content to see your posts here
              </p>
              <Button onClick={() => navigate("/post-generation")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Post
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-elegant transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {post.original_prompt}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(post.created_at)}
                          </span>
                          {post.visual_count > 0 && (
                            <Badge variant="secondary">
                              {post.visual_count} visuals
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {post.post_structure}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(post.generated_content)}
                          title="Copy to clipboard"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          title="Delete post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm whitespace-pre-wrap line-clamp-6">
                        {post.generated_content}
                      </p>
                    </div>
                    {post.visual_count > 0 && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          This post has {post.visual_count} generated visuals
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/preview-download?postId=${post.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Visuals
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyPosts;