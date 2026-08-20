import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { UploadSection } from "@/components/UploadSection";
import { ResultsSection } from "@/components/ResultsSection";
import { Rail } from "@/components/Rail";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { analyzeEvidence, type AnalysisResult } from "@/lib/api";

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
      // No results beat invented ones: clear the panel and say what broke.
      const message =
        cause instanceof Error ? cause.message : "Could not reach the analysis service.";
      setResults(null);
      setError(message);
      toast({ title: "Analysis failed", description: message, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pb-32 pt-14 sm:px-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
          Does the report match the footage?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Upload a clip and the incident report written about it. EvidenceCheck counts the people
          and vehicles the camera actually saw, checks them against what the report claims, and
          scores the agreement from 0 to 100.
        </p>
      </div>

      <div className="mt-12">
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
          <Rail label="Error" className="animate-reveal">
            <div className="space-y-3">
              <p className="flex items-start gap-2.5 text-sm text-contradicted">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {error}
              </p>
              <p className="max-w-prose text-sm text-muted-foreground">
                Check that the API is running and reachable, then try again.
              </p>
              <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
                Retry
              </Button>
            </div>
          </Rail>
        )}

        {results && <ResultsSection results={results} />}
      </div>
    </main>
  );
};

export default Index;
