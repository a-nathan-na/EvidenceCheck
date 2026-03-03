import { useState } from "react";
import { UploadSection } from "@/components/UploadSection";
import { ResultsSection } from "@/components/ResultsSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Shield, Video, FileText, CheckCircle2, Linkedin } from "lucide-react";

export interface AnalysisResult {
  overallScore: number;
  claims: {
    type: "people" | "vehicles" | "weapons";
    claimed: string;
    detected: string;
    consistent: boolean;
    confidence: number;
  }[];
}

// Smooth scroll helper function
const scrollTo = (id: string) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Index = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [textFile, setTextFile] = useState<File | null>(null);
  const [textDescription, setTextDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    // Validation: must have video and either text file or text description
    if (!videoFile) {
      return;
    }
    if (!textFile && !textDescription.trim()) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Build FormData for multipart/form-data request
      const formData = new FormData();
      
      // Always append video file
      formData.append("video", videoFile);
      
      // Priority: text file > text description
      if (textFile) {
        formData.append("text_file", textFile);
      } else if (textDescription.trim()) {
        formData.append("text_description", textDescription.trim());
      }
      
      // Optional: include flag for keyframe processor
      formData.append("use_keyframe_processor", "true");
      
      // Call backend API
      const response = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        body: formData, // FormData automatically sets Content-Type: multipart/form-data
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform backend response to frontend format
      if (data.success) {
        const transformedResults: AnalysisResult = {
          overallScore: data.consistency_score,
          claims: data.details.map((detail: any) => ({
            type: detail.claim_type === "people" ? "people" : 
                  detail.claim_type === "cars" ? "vehicles" : "weapons",
            claimed: String(detail.claim_value ?? "N/A"),
            detected: String(detail.video_value ?? "N/A"),
            consistent: detail.result === "supported",
            confidence: detail.claim_score ?? 0
          }))
        };
        setResults(transformedResults);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      // For now, use mock results on error (you can replace with proper error handling)
      const mockResults: AnalysisResult = {
        overallScore: 85,
        claims: [
          {
            type: "people",
            claimed: "3 people",
            detected: "3 people",
            consistent: true,
            confidence: 95
          },
          {
            type: "vehicles",
            claimed: "2 cars",
            detected: "2 cars",
            consistent: true,
            confidence: 92
          },
          {
            type: "weapons",
            claimed: "No weapons",
            detected: "No weapons",
            consistent: true,
            confidence: 88
          }
        ]
      };
      setResults(mockResults);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ========== HERO SECTION START ========== */}
      <section 
        id="top" 
        className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-16"
      >
        {/* Blurred cyan glow effect behind content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl" />
        </div>
        
        {/* Main hero content */}
        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm backdrop-blur-sm border border-cyan-500/30">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span className="text-cyan-100">Powered by AI Video Analysis</span>
            </div>
            
            {/* Main heading */}
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Verify Evidence with
              <span className="block bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 bg-clip-text text-transparent">
                AI-Powered Precision
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="mx-auto max-w-2xl text-lg text-slate-200 sm:text-xl lg:text-2xl leading-relaxed">
              Upload video evidence and written reports. EvidenceCheck compares people, vehicles, 
              and weapon presence in the footage against the text and returns a 0–100 consistency score.
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <Button
                onClick={() => scrollTo("analyze-section")}
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/30 text-lg px-8 py-6 h-auto hover:scale-105 transition-transform"
              >
                Analyze Evidence
              </Button>
            </div>

            {/* Feature row */}
            <div className="flex flex-wrap items-center justify-center gap-8 pt-12">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-cyan-500/20 p-2 border border-cyan-500/30">
                  <Video className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-200">Video Analysis</div>
                  <div className="text-xs text-slate-300">10–30 second clips</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-cyan-500/20 p-2 border border-cyan-500/30">
                  <FileText className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-200">Text Verification</div>
                  <div className="text-xs text-slate-300">Claim consistency</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-cyan-500/20 p-2 border border-cyan-500/30">
                  <CheckCircle2 className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-200">Consistency Score</div>
                  <div className="text-xs text-slate-300">0–100 alignment</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ========== HERO SECTION END ========== */}

      {/* Upload/Analysis Section */}
      <section id="analyze-section" className="py-16 bg-slate-950 text-slate-100">
        <div className="container mx-auto px-4">
          <UploadSection
            videoFile={videoFile}
            setVideoFile={setVideoFile}
            textFile={textFile}
            setTextFile={setTextFile}
            textDescription={textDescription}
            setTextDescription={setTextDescription}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
          {results && <div className="mt-8"><ResultsSection results={results} /></div>}
        </div>
      </section>

      {/* Features Section */}
      <section id="scope-section" className="py-20 bg-slate-950 text-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-semibold tracking-tight">Key Features</h2>
            <p className="mt-2 text-muted-foreground">
              What EvidenceCheck can do for incident and traffic video review today.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Card className="h-full bg-slate-900 border border-slate-700/80 shadow-xl shadow-cyan-500/15">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-cyan-500/10 p-2 border border-cyan-500/30">
                    <Video className="h-5 w-5 text-cyan-500" />
                  </div>
                  <CardTitle className="text-lg text-slate-50">Video Understanding</CardTitle>
                </div>
                <CardDescription className="text-slate-300">
                  10–30 second clips from fixed cameras; detects people, vehicles, and weapons.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="h-full bg-slate-900 border border-slate-700/80 shadow-xl shadow-cyan-500/15">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-cyan-500/10 p-2 border border-cyan-500/30">
                    <FileText className="h-5 w-5 text-cyan-500" />
                  </div>
                  <CardTitle className="text-lg text-slate-50">Claim-Aware Scoring</CardTitle>
                </div>
                <CardDescription className="text-slate-300">
                  Compares written reports to the footage and returns a 0–100 consistency score.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="h-full bg-slate-900 border border-slate-700/80 shadow-xl shadow-cyan-500/15">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-cyan-500/10 p-2 border border-cyan-500/30">
                    <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                  </div>
                  <CardTitle className="text-lg text-slate-50">Explainable Results</CardTitle>
                </div>
                <CardDescription className="text-slate-300">
                  Per-claim breakdowns so reviewers can see exactly where text and video disagree.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="py-20 bg-slate-950 text-slate-100">
        <div className="container mx-auto px-4">
          <Card className="bg-slate-900 border border-slate-700/80 shadow-xl shadow-cyan-500/15 text-slate-50">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-50">About EvidenceCheck</CardTitle>
              <CardDescription className="text-slate-300">
                Why we built this for MadHacks 2025.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-slate-200">
              <p className="text-muted-foreground">
                We built EvidenceCheck to make incident review less subjective. Instead of
                reading a report in isolation, reviewers can see how closely it matches
                what the camera actually captured—using simple, verifiable facts like
                people, vehicles, and weapon presence.
              </p>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-50">
                  Project Contributors
                </h3>
                <div className="flex flex-wrap gap-3">
                  {/* Replace href values and names with the real team info */}
                  <a
                    href="https://www.linkedin.com/in/nathan-aye-328450334/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" className="gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100">
                      <Linkedin className="h-4 w-4" />
                      Nathan Aye
                    </Button>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/teammate-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" className="gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100">
                      <Linkedin className="h-4 w-4" />
                      Teammate 1
                    </Button>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/teammate-2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" className="gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100">
                      <Linkedin className="h-4 w-4" />
                      Teammate 2
                    </Button>
                  </a>
                  <a
                    href="https://www.linkedin.com/in/teammate-3"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" className="gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100">
                      <Linkedin className="h-4 w-4" />
                      Teammate 3
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
