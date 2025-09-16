import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Image, 
  Palette, 
  TrendingUp, 
  Clock, 
  Download,
  BarChart3,
  Sparkles
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Style Learning",
      description: "Advanced AI analyzes your writing patterns, tone, and engagement style to create authentic content.",
      badge: "Core Feature"
    },
    {
      icon: Image,
      title: "Visual Content Generation",
      description: "Generate infographics, carousel posts, and quote cards that perfectly match your brand.",
      badge: "Visual AI"
    },
    {
      icon: Palette,
      title: "Smart Design System",
      description: "Consistent visual branding across all your content with intelligent color and typography choices.",
      badge: "Design"
    },
    {
      icon: TrendingUp,
      title: "Engagement Optimization",
      description: "AI recommends the best posting format and visual strategy to maximize your reach.",
      badge: "Growth"
    },
    {
      icon: Clock,
      title: "Lightning Fast",
      description: "Generate complete posts with visuals in under 60 seconds. No more hours of content creation.",
      badge: "Speed"
    },
    {
      icon: Download,
      title: "Export Ready",
      description: "Download high-quality images, copy optimized text, and publish directly to LinkedIn.",
      badge: "Workflow"
    }
  ];

  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            Powerful Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <br />
            <span className="bg-gradient-hero bg-clip-text text-transparent">Dominate LinkedIn</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From style analysis to visual creation, our platform handles every aspect of professional content creation
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="p-8 bg-gradient-card border-0 shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                
                <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
        
        {/* Stats Section */}
        <div className="mt-20 bg-background rounded-2xl p-8 md:p-12 shadow-elegant max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-4">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">10x</div>
              <p className="text-muted-foreground">Faster Content Creation</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">85%</div>
              <p className="text-muted-foreground">Higher Engagement Rate</p>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-2">&lt;60s</div>
              <p className="text-muted-foreground">Post Generation Time</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;