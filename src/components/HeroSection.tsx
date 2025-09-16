import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Target } from "lucide-react";
import heroIllustration from "@/assets/hero-illustration.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary-glow/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      
      <div className="container mx-auto px-6 py-20 text-center relative z-10">
        <div className="max-w-4xl mx-auto animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/50 border border-border rounded-full px-4 py-2 text-sm font-medium text-accent-foreground mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            AI-Powered LinkedIn Content Creator
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent leading-tight">
            Create LinkedIn Posts
            <br />
            <span className="text-foreground">In Your Style</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            AI analyzes your writing style and generates personalized LinkedIn content with matching visual assets. 
            <strong className="text-foreground"> Turn your ideas into viral posts.</strong>
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button variant="premium" size="lg" className="text-lg px-8 py-4 h-auto">
              Start Creating Now
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 h-auto">
              Watch Demo
            </Button>
          </div>
          
          {/* Hero Image */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-primary/20 rounded-2xl blur-2xl" />
            <img 
              src={heroIllustration}
              alt="LinkedIn Content Creation Platform Interface"
              className="relative w-full h-auto rounded-2xl shadow-elegant hover:shadow-glow transition-all duration-500"
            />
          </div>
          
          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">Learns Your Writing Style</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">Generates Visual Assets</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium">Boosts Engagement</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;