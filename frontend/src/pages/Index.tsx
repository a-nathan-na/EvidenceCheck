import { useState } from "react";
import { UploadSection } from "@/components/UploadSection";
import { ResultsSection } from "@/components/ResultsSection";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { analyzeEvidence, type AnalysisResult } from "@/lib/api";
import { Shield, Video, FileText, CheckCircle2, Linkedin, AlertTriangle } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!videoFile || (!textFile && !textDescription.trim())) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      setResults(
        await analyzeEvidence({
          video: videoFile,
          reportFile: textFile,
          reportText: textDescription
        })
      );
    } catch (cause) {
      // No results are better than invented ones: clear the panel and say what broke.
      const message =
        cause instanceof Error ? cause.message : "Could not reach the analysis service.";
      setResults(null);
      setError(message);
      toast({
        title: "Analysis failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <section
        id="top"
        className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pt-16"
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-4 py-2 text-sm backdrop-blur-sm border border-cyan-500/30">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span className="text-cyan-100">YOLOv8 object detection</span>
            </div>

            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Does the report match
              <span className="block bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-500 bg-clip-text text-transparent">
                the footage?
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-slate-200 sm:text-xl lg:text-2xl leading-relaxed">
              Upload a clip and the written report that goes with it. EvidenceCheck counts the
              people and vehicles the camera actually saw, checks them against what the report
              claims, and scores the agreement from 0 to 100.
            </p>

            <div className="pt-4">
              <Button
                onClick={() => scrollTo("analyze-section")}
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold shadow-lg shadow-cyan-500/30 text-lg px-8 py-6 h-auto hover:scale-105 transition-transform"
              >
                Analyze Evidence
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 pt-12">
              {[
                { icon: Video, title: "Video Analysis", detail: "10–30 second clips" },
                { icon: FileText, title: "Report Parsing", detail: "Counts and weapon claims" },
                { icon: CheckCircle2, title: "Consistency Score", detail: "0–100, per claim" }
              ].map(({ icon: Icon, title, detail }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="rounded-full bg-cyan-500/20 p-2 border border-cyan-500/30">
                    <Icon className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-slate-200">{title}</div>
                    <div className="text-xs text-slate-300">{detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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

          {error && (
            <div className="mx-auto mt-8 max-w-4xl">
              <Card className="border-destructive/50">
                <CardContent className="flex items-start gap-4 p-6">
                  <div className="rounded-full bg-destructive/10 p-3">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold text-foreground">Analysis failed</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <p className="text-xs text-muted-foreground">
                      Check that the API is running and reachable, then try again.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                    >
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {results && (
            <div className="mt-8">
              <ResultsSection results={results} />
            </div>
          )}
        </div>
      </section>

      <section id="scope-section" className="py-20 bg-slate-950 text-slate-100">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-3xl font-semibold tracking-tight">What it checks</h2>
            <p className="mt-2 text-slate-300">
              Three verifiable facts, scored independently and combined.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Video,
                title: "People and vehicles",
                body: "Frames are sampled once per second and each class is reported as the highest count seen in any single frame."
              },
              {
                icon: FileText,
                title: "Claims from the report",
                body: "Counts written as digits or words, singular phrasings, and weapon presence or absence including negations."
              },
              {
                icon: CheckCircle2,
                title: "Explainable scoring",
                body: "Each claim carries its own score and a plain-language note, so you can see exactly where the two disagree."
              }
            ].map(({ icon: Icon, title, body }) => (
              <Card
                key={title}
                className="h-full bg-slate-900 border border-slate-700/80 shadow-xl shadow-cyan-500/15"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-cyan-500/10 p-2 border border-cyan-500/30">
                      <Icon className="h-5 w-5 text-cyan-500" />
                    </div>
                    <CardTitle className="text-lg text-slate-50">{title}</CardTitle>
                  </div>
                  <CardDescription className="text-slate-300">{body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="about-section" className="py-20 bg-slate-950 text-slate-100">
        <div className="container mx-auto px-4">
          <Card className="bg-slate-900 border border-slate-700/80 shadow-xl shadow-cyan-500/15 text-slate-50">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-50">About EvidenceCheck</CardTitle>
              <CardDescription className="text-slate-300">Why this exists.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-slate-200">
              <p>
                Insurance claims arrive as free text describing an incident, and where dashcam or
                CCTV footage exists, someone has to watch it and check whether the two agree. The
                countable parts of that check — how many people, how many vehicles, whether a weapon
                was visible — are mechanical, repetitive, and easy to get wrong when you are doing
                it for the hundredth time.
              </p>
              <p>
                EvidenceCheck automates that first pass. It does not decide who was at fault; it
                tells a reviewer which specific claims are worth a second look, and shows the
                annotated frames it based that on.
              </p>

              <Separator className="bg-slate-700" />

              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-50">Built by</h3>
                <a
                  href="https://www.linkedin.com/in/nathan-aye-328450334/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button
                    variant="outline"
                    className="gap-2 bg-slate-50 text-slate-900 hover:bg-slate-100"
                  >
                    <Linkedin className="h-4 w-4" />
                    Nathan Aye
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
