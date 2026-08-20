# API reference

Base URL `http://localhost:8000`. Interactive docs at `/docs`, OpenAPI schema at
`/openapi.json`. All responses below were captured from real runs.

Allowed origins are controlled by `EVIDENCECHECK_CORS_ORIGINS`; see
`backend/.env.example` for every setting.

---

## `GET /health`

```bash
curl http://localhost:8000/health
```

```json
{ "status": "healthy", "message": "EvidenceCheck API is running" }
```

---

## `POST /claims`

Parses a report without running video analysis. Useful for checking how a piece of text is
being read without waiting on inference.

**Form fields**

| Field | Type | Required |
|---|---|---|
| `text_description` | string | yes |

```bash
curl -X POST http://localhost:8000/claims \
  -F "text_description=Two people and one car. No weapons were present."
```

```json
{ "people": 2, "cars": 1, "weapon_present": false }
```

`null` on any field means the report did not make that claim. Returns `400` if the text is
empty or whitespace.

---

## `POST /analyze`

Runs detection over the clip and scores it against the report.

**Form fields**

| Field | Type | Required | Notes |
|---|---|---|---|
| `video` | file | yes | `.mp4`, `.mov`, `.avi`, `.mkv` |
| `text_description` | string | no | Ignored when `text_file` is supplied |
| `text_file` | file | no | `.txt` or `.md`; takes precedence over `text_description` |

One of `text_description` or `text_file` must be present.

```bash
curl -X POST http://localhost:8000/analyze \
  -F "video=@clip.mp4" \
  -F "text_file=@data/clip1/report_form.txt"
```

```json
{
  "consistency_score": 70,
  "details": [
    {
      "claim_type": "people",
      "claim_value": null,
      "video_value": 4,
      "result": "not_applicable",
      "note": "The report did not state a count.",
      "claim_score": 100
    },
    {
      "claim_type": "cars",
      "claim_value": 2,
      "video_value": 9,
      "result": "contradicted",
      "note": "Report says 2, video shows 9 (off by 7).",
      "claim_score": 70
    },
    {
      "claim_type": "weapons",
      "claim_value": null,
      "video_value": false,
      "result": "not_applicable",
      "note": "The report did not mention a weapon.",
      "claim_score": 100
    }
  ],
  "video_analysis": {
    "people": 4,
    "cars": 9,
    "weapon_present": false,
    "frames_sampled": 77,
    "frames": ["<base64 JPEG>", "<base64 JPEG>", "<base64 JPEG>"]
  },
  "text_claims": {
    "people": null,
    "cars": 2,
    "weapon_present": null,
    "raw_text_snippet": "Clip 1 THE INCIDENT Date of Incident: [Date Unknown]..."
  }
}
```

`result` is one of `supported`, `partial`, `contradicted`, or `not_applicable`. `frames`
holds up to `EVIDENCECHECK_MAX_FRAMES` annotated JPEGs, base64-encoded, spread evenly across
the sampled set.

A 30-second clip takes roughly 30 seconds on CPU.

### Errors

Failures are HTTP status codes with a `detail` string, never a 200 carrying a fabricated
score.

| Status | Cause |
|---|---|
| `400` | Unsupported video extension, non-text report file, or no report supplied |
| `422` | Video could not be opened or decoded |

```json
{ "detail": "Unsupported video format. Allowed extensions: .avi, .mkv, .mov, .mp4" }
```
