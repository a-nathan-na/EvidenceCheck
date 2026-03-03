import { Shield, Video, FileText } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-hero text-primary-foreground">
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:40px_40px]" />
      <div className="container relative mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm backdrop-blur-sm">
            <Shield className="h-4 w-4 text-secondary" />
            <span className="text-primary-foreground/90">Powered by AI Video Analysis</span>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Verify Evidence with
            <span className="block bg-gradient-accent bg-clip-text text-transparent">
              AI-Powered Precision
            </span>
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 sm:text-xl">
            Upload video evidence and text claims. Our advanced AI analyzes and verifies 
            consistency with detailed breakdowns for people, vehicles, and weapons.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 pt-8">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-secondary" />
              <div className="text-left">
                <div className="text-sm font-medium">Video Analysis</div>
                <div className="text-xs text-primary-foreground/60">10-30 second clips</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-secondary" />
              <div className="text-left">
                <div className="text-sm font-medium">Text Verification</div>
                <div className="text-xs text-primary-foreground/60">Claim consistency</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-secondary" />
              <div className="text-left">
                <div className="text-sm font-medium">Confidence Score</div>
                <div className="text-xs text-primary-foreground/60">0-100 accuracy</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
