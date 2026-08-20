import { describe, expect, it } from "vitest";
import { transformResponse, type AnalyzeResponse } from "./api";

const response = (details: AnalyzeResponse["details"], score = 100): AnalyzeResponse => ({
  consistency_score: score,
  details,
  video_analysis: {
    people: 2,
    cars: 1,
    weapon_present: false,
    frames_sampled: 12,
    frames: ["AAAA"]
  },
  text_claims: {
    people: 2,
    cars: 1,
    weapon_present: false,
    raw_text_snippet: "Two people and one car."
  }
});

const detail = (over: Partial<AnalyzeResponse["details"][number]> = {}) => ({
  claim_type: "people" as const,
  claim_value: 2,
  video_value: 2,
  result: "supported" as const,
  note: "Exact match: 2.",
  claim_score: 100,
  ...over
});

describe("transformResponse", () => {
  it("carries over the score, frame count, and frames", () => {
    const result = transformResponse(response([detail()], 90));
    expect(result.overallScore).toBe(90);
    expect(result.framesSampled).toBe(12);
    expect(result.frames).toEqual(["AAAA"]);
  });

  it("renames the cars claim type to vehicles for display", () => {
    const result = transformResponse(response([detail({ claim_type: "cars" })]));
    expect(result.claims[0].type).toBe("vehicles");
  });

  it("preserves all four claim results rather than collapsing to a boolean", () => {
    const result = transformResponse(
      response([
        detail({ result: "supported" }),
        detail({ claim_type: "cars", result: "partial" }),
        detail({ claim_type: "weapons", result: "contradicted" })
      ])
    );
    expect(result.claims.map((c) => c.result)).toEqual(["supported", "partial", "contradicted"]);
  });

  it("renders an unstated claim as 'not stated' rather than a disagreement", () => {
    const result = transformResponse(
      response([detail({ claim_value: null, result: "not_applicable" })])
    );
    expect(result.claims[0].claimed).toBe("not stated");
    expect(result.claims[0].result).toBe("not_applicable");
  });

  it("renders weapon booleans as words", () => {
    const result = transformResponse(
      response([detail({ claim_type: "weapons", claim_value: true, video_value: false })])
    );
    expect(result.claims[0].claimed).toBe("weapon present");
    expect(result.claims[0].detected).toBe("no weapon");
  });

  it("keeps the per-claim note and score", () => {
    const result = transformResponse(
      response([detail({ note: "Report says 5, video shows 2 (off by 3).", claim_score: 70 })])
    );
    expect(result.claims[0].note).toContain("off by 3");
    expect(result.claims[0].score).toBe(70);
  });
});
