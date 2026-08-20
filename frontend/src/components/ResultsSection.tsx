import { CheckCircle2, XCircle, AlertCircle, MinusCircle, Users, Car, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResult, ClaimKind, ClaimResult } from "@/lib/api";

interface ResultsSectionProps {
  results: AnalysisResult;
}

const CLAIM_ICON: Record<ClaimKind, JSX.Element> = {
  people: <Users className="h-5 w-5" />,
  vehicles: <Car className="h-5 w-5" />,
  weapons: <Shield className="h-5 w-5" />
};

/**
 * Four outcomes, four presentations. `not_applicable` in particular must read as
 * neutral: the report simply never made that claim, which is not a disagreement.
 */
const RESULT_STYLE: Record<
  ClaimResult,
  {
    label: string;
    icon: JSX.Element;
    border: string;
    tint: string;
    badge: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  supported: {
    label: "Supported",
    icon: <CheckCircle2 className="mr-1 h-3 w-3" />,
    border: "border-success/50",
    tint: "bg-success/10",
    badge: "default"
  },
  partial: {
    label: "Near miss",
    icon: <AlertCircle className="mr-1 h-3 w-3" />,
    border: "border-warning/50",
    tint: "bg-warning/10",
    badge: "secondary"
  },
  contradicted: {
    label: "Contradicted",
    icon: <XCircle className="mr-1 h-3 w-3" />,
    border: "border-destructive/50",
    tint: "bg-destructive/10",
    badge: "destructive"
  },
  not_applicable: {
    label: "Not stated",
    icon: <MinusCircle className="mr-1 h-3 w-3" />,
    border: "border-border",
    tint: "bg-muted",
    badge: "outline"
  }
};

const scoreColor = (score: number) =>
  score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-destructive";

const scoreTint = (score: number) =>
  score >= 80 ? "bg-success/10" : score >= 60 ? "bg-warning/10" : "bg-destructive/10";

const scoreSummary = (score: number) =>
  score >= 80
    ? "The report closely matches what the video shows."
    : score >= 60
      ? "Some claims in the report do not match the footage."
      : "Significant disagreement between the report and the footage.";

export const ResultsSection = ({ results }: ResultsSectionProps) => {
  return (
    <div className="mx-auto mt-12 max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Analysis Results</CardTitle>
          <CardDescription>
            Scored across {results.framesSampled} sampled{" "}
            {results.framesSampled === 1 ? "frame" : "frames"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Overall Consistency Score
              </span>
              <span className={`text-4xl font-bold ${scoreColor(results.overallScore)}`}>
                {results.overallScore}
              </span>
            </div>
            <Progress value={results.overallScore} className="h-3" />
            <div className={`rounded-lg p-4 ${scoreTint(results.overallScore)}`}>
              <p className={`text-center text-sm font-medium ${scoreColor(results.overallScore)}`}>
                {scoreSummary(results.overallScore)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Claim Breakdown</h3>
            <div className="space-y-3">
              {results.claims.map((claim) => {
                const style = RESULT_STYLE[claim.result];
                return (
                  <Card
                    key={claim.type}
                    className={`transition-all hover:shadow-md ${style.border}`}
                  >
                    <CardContent className="flex items-start gap-4 p-4">
                      <div className={`rounded-full p-3 ${style.tint}`}>
                        {CLAIM_ICON[claim.type]}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold capitalize">{claim.type}</span>
                          <Badge variant={style.badge} className="ml-auto">
                            {style.icon}
                            {style.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            Report:{" "}
                            <span className="font-medium text-foreground">{claim.claimed}</span>
                          </span>
                          <span aria-hidden>•</span>
                          <span>
                            Video:{" "}
                            <span className="font-medium text-foreground">{claim.detected}</span>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{claim.note}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {results.frames.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Annotated Frames</h3>
              <p className="text-sm text-muted-foreground">
                Sample frames with the detector's bounding boxes drawn on.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {results.frames.map((frame, index) => (
                  <img
                    key={index}
                    src={`data:image/jpeg;base64,${frame}`}
                    alt={`Annotated frame ${index + 1}`}
                    className="w-full rounded-lg border border-border"
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
