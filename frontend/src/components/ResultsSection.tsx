import { Rail } from "@/components/Rail";
import { cn } from "@/lib/utils";
import type { AnalysisResult, Claim, ClaimResult } from "@/lib/api";

interface ResultsSectionProps {
  results: AnalysisResult;
}

const CLAIM_LABEL: Record<Claim["type"], string> = {
  people: "People",
  vehicles: "Vehicles",
  weapons: "Weapons"
};

/**
 * Four outcomes, four readings. `not_applicable` stays neutral on purpose: a
 * claim the report never made is not a disagreement, and the old UI rendered it
 * in the same red as a contradiction.
 */
const OUTCOME: Record<ClaimResult, { label: string; tone: string }> = {
  supported: { label: "Supported", tone: "text-supported" },
  partial: { label: "Near miss", tone: "text-partial" },
  contradicted: { label: "Contradicted", tone: "text-contradicted" },
  not_applicable: { label: "Not stated", tone: "text-muted-foreground" }
};

const band = (score: number) =>
  score >= 80
    ? { tone: "bg-supported", summary: "The report closely matches the footage." }
    : score >= 60
      ? { tone: "bg-partial", summary: "Some claims do not match the footage." }
      : { tone: "bg-contradicted", summary: "The report and the footage disagree substantially." };

/**
 * Counts are measurements and read in the numeric face. Words like "no weapon"
 * are not, and get the body face — mono would space them like a data column.
 */
const Value = ({ label, value }: { label: string; value: string }) => {
  const isMeasurement = /^\d+$/.test(value);
  return (
    <span className="text-muted-foreground">
      {label}{" "}
      <span className={cn("text-foreground", isMeasurement && "tabular font-mono font-medium")}>
        {value}
      </span>
    </span>
  );
};

export const ResultsSection = ({ results }: ResultsSectionProps) => {
  const { tone, summary } = band(results.overallScore);

  return (
    <section aria-label="Results" className="animate-reveal">
      <Rail label="Score">
        <div className="space-y-4">
          <div className="flex items-baseline gap-4">
            <span className="tabular font-mono text-5xl font-medium leading-none tracking-tight">
              {results.overallScore}
            </span>
            <span className="text-sm text-muted-foreground">out of 100</span>
          </div>

          {/* Hairline meter. The band carries the judgement; the number stays neutral. */}
          <div
            className="h-0.5 w-full max-w-md overflow-hidden rounded-full bg-border-strong"
            role="img"
            aria-label={`Consistency score ${results.overallScore} out of 100`}
          >
            <div
              className={cn("h-full transition-[width] duration-500", tone)}
              style={{ width: `${results.overallScore}%` }}
            />
          </div>

          <p className="max-w-prose text-sm text-foreground">{summary}</p>
        </div>
      </Rail>

      {results.claims.map((claim) => {
        const outcome = OUTCOME[claim.result];
        return (
          <Rail key={claim.type} label={CLAIM_LABEL[claim.type]}>
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
                <span className={cn("inline-flex items-center gap-2 font-medium", outcome.tone)}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {outcome.label}
                </span>
                <Value label="Report" value={claim.claimed} />
                <Value label="Video" value={claim.detected} />
              </div>
              <p className="max-w-prose text-sm text-muted-foreground">{claim.note}</p>
            </div>
          </Rail>
        );
      })}

      {results.frames.length > 0 && (
        <Rail label="Frames">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {results.frames.map((frame, index) => (
                <img
                  key={index}
                  src={`data:image/jpeg;base64,${frame}`}
                  alt={`Detections in sampled frame ${index + 1}`}
                  className="w-full rounded-md border border-border"
                  loading="lazy"
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Three of{" "}
              <span className="tabular font-mono text-foreground">{results.framesSampled}</span>{" "}
              sampled frames, with detector boxes drawn on.
            </p>
          </div>
        </Rail>
      )}
    </section>
  );
};
