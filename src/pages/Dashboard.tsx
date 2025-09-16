import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Linkedin, Plus, LogOut, User as UserIcon, CreditCard } from "lucide-react";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

  if (isLoading) {
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
              <span className="text-xl font-bold">ContentAI</span>
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
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'Creator'}!
            </h1>
            <p className="text-xl text-muted-foreground">
              Ready to create your next viral LinkedIn post?
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Create New Post
                </CardTitle>
                <CardDescription>
                  Generate a LinkedIn post with matching visuals in your unique style
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  onClick={() => navigate("/onboarding")}
                >
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
      </main>
    </div>
  );
};

export default Dashboard;