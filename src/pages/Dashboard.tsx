import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Linkedin, Plus, LogOut, User as UserIcon, CreditCard, FileText, Settings, Palette, CheckCircle, AlertCircle } from "lucide-react";
import { useWritingStyle } from "@/hooks/use-writing-style";
import WritingStyleModal from "@/components/WritingStyleModal";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const navigate = useNavigate();
  const { hasStyle, isLoading: styleLoading, refreshStyle } = useWritingStyle(user);

  useEffect(() => {
    // Check authentication and get user data
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(profileData);
      }

      setIsLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleOpenStyleModal = () => {
    setIsStyleModalOpen(true);
  };

  const handleStyleLearned = () => {
    refreshStyle();
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

  if (isLoading || styleLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
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
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Navigation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      onClick={() => navigate("/post-generation")}
                    >
                      <Plus className="w-4 h-4 mr-3" />
                      Create New Post
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" disabled>
                      <FileText className="w-4 h-4 mr-3" />
                      My Generated Posts
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" disabled>
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Button>
                  </CardContent>
                </Card>

                {/* Writing Style Section */}
                <Card className={!hasStyle ? "border-orange-200 bg-orange-50/50" : "border-green-200 bg-green-50/50"}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Writing Style
                      {hasStyle ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasStyle ? (
                      <div className="space-y-3">
                        <div className="text-sm text-green-700">
                          ✅ AI knows your writing style
                        </div>
                        <div className="text-xs text-muted-foreground">
                          You can now generate posts in your personal style
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={handleOpenStyleModal}
                        >
                          Update Style
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-sm text-orange-700">
                          Teach AI your voice
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Upload 3-5 previous posts to enable personalized content
                        </div>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={handleOpenStyleModal}
                        >
                          Add Your Posts
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Credits Display */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-medium">Credits</span>
                      </div>
                      <span className="font-bold">{profile?.credits_remaining || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="space-y-8">
                {/* Welcome Section */}
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold">
                    Welcome back, {profile?.full_name?.split(' ')[0] || 'Creator'}!
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Ready to create your next engaging LinkedIn post?
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate("/post-generation")}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Create New Post
                      </CardTitle>
                      <CardDescription>
                        Generate engaging LinkedIn content {hasStyle ? "in your unique style" : "with AI assistance"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full">
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-elegant transition-shadow">
                    <CardHeader>
                      <CardTitle>Content History</CardTitle>
                      <CardDescription>
                        View and manage your previously generated posts
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full" disabled>
                        View History
                        <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold">{profile?.credits_remaining || 0}</div>
                      <div className="text-sm text-muted-foreground">Credits Left</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Posts Created</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="text-2xl font-bold text-primary">
                        {profile?.subscription_status || 'Free'}
                      </div>
                      <div className="text-sm text-muted-foreground">Plan</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Writing Style Modal */}
      <WritingStyleModal 
        isOpen={isStyleModalOpen} 
        onClose={() => setIsStyleModalOpen(false)}
        user={user}
        onStyleLearned={handleStyleLearned}
      />
    </div>
  );
};

export default Dashboard;