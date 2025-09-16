import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Image, FileText, Zap } from "lucide-react";
import demoPost1 from "@/assets/demo-post-1.jpg";
import demoCarousel from "@/assets/demo-carousel.jpg";

const DemoSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Live Demo
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See Your Content Come to Life
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Watch how our AI transforms your ideas into professional LinkedIn posts with stunning visuals
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Process Steps */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold">
                1
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Analyze Your Style
                </h3>
                <p className="text-muted-foreground">
                  Upload 4-5 of your previous LinkedIn posts. Our AI learns your tone, structure, and engagement patterns.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold">
                2
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Generate Content
                </h3>
                <p className="text-muted-foreground">
                  Simply describe what you want to post about. AI creates personalized content matching your style.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center text-white font-bold">
                3
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  Create Visuals
                </h3>
                <p className="text-muted-foreground">
                  Automatically generate matching infographics, carousel posts, or quote cards that complement your content.
                </p>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                Ready to publish on LinkedIn
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
          
          {/* Demo Results */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="text-sm text-muted-foreground mb-3">Generated Post Example</div>
              <div className="bg-background rounded-lg p-4 mb-4">
                <p className="text-sm leading-relaxed">
                  "5 LinkedIn tips that doubled my engagement in 30 days 📈
                  
                  After analyzing 100+ viral posts, here's what works:
                  
                  ✅ Hook in first line
                  ✅ Personal story + data
                  ✅ Visual content
                  ✅ Call to action
                  ✅ Perfect timing
                  
                  The secret? Authenticity beats perfection every time.
                  
                  What's your biggest LinkedIn challenge? 👇"
                </p>
              </div>
              <img 
                src={demoPost1} 
                alt="Generated LinkedIn post with analytics" 
                className="w-full rounded-lg shadow-sm"
              />
            </Card>
            
            <Card className="p-6 bg-gradient-card border-0 shadow-card">
              <div className="text-sm text-muted-foreground mb-3">Generated Carousel (6 images)</div>
              <img 
                src={demoCarousel} 
                alt="Generated carousel of LinkedIn tip cards" 
                className="w-full rounded-lg shadow-sm"
              />
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;