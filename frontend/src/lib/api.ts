/**
 * Client for the EvidenceCheck API.
 *
 * `transformResponse` is exported separately from the network call so the mapping
 * between the API shape and the shape the UI renders can be unit tested.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export type ClaimResult = "supported" | "partial" | "contradicted" | "not_applicable";

/** One row of the API's `details` array. */
export interface ClaimDetail {
  claim_type: "people" | "cars" | "weapons";
  claim_value: number | boolean | null;
  video_value: number | boolean;
  result: ClaimResult;
  note: string;
  claim_score: number;
}

export interface AnalyzeResponse {
  consistency_score: number;
  details: ClaimDetail[];
  video_analysis: {
    people: number;
    cars: number;
    weapon_present: boolean;
    frames_sampled: number;
    frames: string[];
  };
  text_claims: {
    people: number | null;
    cars: number | null;
    weapon_present: boolean | null;
    raw_text_snippet: string;
  };
}

export type ClaimKind = "people" | "vehicles" | "weapons";

export interface Claim {
  type: ClaimKind;
  claimed: string;
  detected: string;
  result: ClaimResult;
  note: string;
  score: number;
}

export interface AnalysisResult {
  overallScore: number;
  framesSampled: number;
  /** Base64 JPEG payloads of annotated frames. */
  frames: string[];
  claims: Claim[];
}

const CLAIM_KIND: Record<ClaimDetail["claim_type"], ClaimKind> = {
  people: "people",
  cars: "vehicles",
  weapons: "weapons"
};

/** Render a claim value for display. Booleans are weapon presence; null means unstated. */
function formatValue(value: number | boolean | null): string {
  if (value === null || value === undefined) return "not stated";
  if (typeof value === "boolean") return value ? "weapon present" : "no weapon";
  return String(value);
}

export function transformResponse(response: AnalyzeResponse): AnalysisResult {
  return {
    overallScore: response.consistency_score,
    framesSampled: response.video_analysis.frames_sampled,
    frames: response.video_analysis.frames,
    claims: response.details.map((detail) => ({
      type: CLAIM_KIND[detail.claim_type],
      claimed: formatValue(detail.claim_value),
      detected: formatValue(detail.video_value),
      result: detail.result,
      note: detail.note,
      score: detail.claim_score
    }))
  };
}

/** Pull a useful message out of a FastAPI error body, falling back to the status line. */
async function describeFailure(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail) && typeof body.detail[0]?.msg === "string") {
      return body.detail[0].msg;
    }
  } catch {
    // Body was not JSON; the status line below is the best we can do.
  }
  return `Analysis service returned ${response.status} ${response.statusText}`;
}

export interface AnalyzeRequest {
  video: File;
  /** Takes precedence over `reportText` when present. */
  reportFile?: File | null;
  reportText?: string;
}

export async function analyzeEvidence({
  video,
  reportFile,
  reportText = ""
}: AnalyzeRequest): Promise<AnalysisResult> {
  const body = new FormData();
  body.append("video", video);

  if (reportFile) {
    body.append("text_file", reportFile);
  } else {
    body.append("text_description", reportText.trim());
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    body
  });

  if (!response.ok) {
    throw new Error(await describeFailure(response));
  }

  return transformResponse(await response.json());
}
