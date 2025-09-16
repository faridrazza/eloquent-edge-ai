import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Check } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      <div className="absolute top-20 right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-20 w-32 h-32 bg-primary-glow/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Ready to Get Started?
          </Badge>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Join Content Creators
            <br />
            <span className="bg-gradient-hero bg-clip-text text-transparent">Scaling on LinkedIn</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Transform your LinkedIn presence with AI-powered content creation. 
            Start generating viral posts and stunning visuals today.
          </p>
          
          {/* Benefits list */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12 text-sm">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">5 free posts to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Setup in 2 minutes</span>
            </div>
          </div>
          
          {/* CTA Button */}
          <div className="space-y-4">
            <Button variant="premium" size="lg" className="text-lg px-12 py-6 h-auto group">
              Start Creating Content Now
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Connect your LinkedIn account and generate your first post in under 60 seconds
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;