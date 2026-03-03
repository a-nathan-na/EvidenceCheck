import { CheckCircle2, XCircle, Users, Car, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AnalysisResult } from "@/pages/Index";

interface ResultsSectionProps {
  results: AnalysisResult;
}

const getClaimIcon = (type: string) => {
  switch (type) {
    case "people":
      return <Users className="h-5 w-5" />;
    case "vehicles":
      return <Car className="h-5 w-5" />;
    case "weapons":
      return <Shield className="h-5 w-5" />;
    default:
      return null;
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-destructive";
};

const getScoreBg = (score: number) => {
  if (score >= 80) return "bg-success/10";
  if (score >= 60) return "bg-warning/10";
  return "bg-destructive/10";
};

export const ResultsSection = ({ results }: ResultsSectionProps) => {
  return (
    <div className="mx-auto mt-12 max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-2 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Analysis Results</CardTitle>
          <CardDescription>Detailed consistency verification of your video evidence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Overall Score */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Overall Consistency Score</span>
              <span className={`text-4xl font-bold ${getScoreColor(results.overallScore)}`}>
                {results.overallScore}%
              </span>
            </div>
            <Progress value={results.overallScore} className="h-3" />
            <div className={`rounded-lg p-4 ${getScoreBg(results.overallScore)}`}>
              <p className={`text-center text-sm font-medium ${getScoreColor(results.overallScore)}`}>
                {results.overallScore >= 80
                  ? "High consistency between video and text description"
                  : results.overallScore >= 60
                  ? "Moderate consistency - some discrepancies detected"
                  : "Low consistency - significant discrepancies found"}
              </p>
            </div>
          </div>

          {/* Individual Claims */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Claim Breakdown</h3>
            <div className="space-y-3">
              {results.claims.map((claim, index) => (
                <Card
                  key={index}
                  className={`transition-all hover:shadow-md ${
                    claim.consistent ? "border-success/50" : "border-destructive/50"
                  }`}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`rounded-full p-3 ${claim.consistent ? "bg-success/10" : "bg-destructive/10"}`}>
                      {getClaimIcon(claim.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">{claim.type}</span>
                        <Badge variant={claim.consistent ? "default" : "destructive"} className="ml-auto">
                          {claim.consistent ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Consistent
                            </>
                          ) : (
                            <>
                              <XCircle className="mr-1 h-3 w-3" />
                              Inconsistent
                            </>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Claimed: <span className="font-medium text-foreground">{claim.claimed}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Detected: <span className="font-medium text-foreground">{claim.detected}</span>
                        </span>
                        <span>•</span>
                        <span>
                          Confidence: <span className="font-medium text-foreground">{claim.confidence}%</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
