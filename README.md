# EvidenceCheck MVP

**Video ↔ Text Consistency Checker**

A minimal viable product that analyzes short video clips and compares them against text descriptions to determine consistency. This tool detects people, cars, and weapons in videos and checks if the counts match what's described in text.

## 🎯 Project Overview

EvidenceCheck MVP is designed to:
- Take a short video clip (10-30 seconds)
- Take a text description of that clip
- Analyze both and provide a consistency score (0-100)
- Show detailed per-claim breakdown

### Supported Claim Types (v1)
- **Number of people**: "Three people", "2 persons", etc.
- **Number of cars/vehicles**: "Two cars", "1 vehicle", etc.
- **Weapon presence/absence**: "gun present", "no weapon", etc.

## 🐳 Quick Start with Docker (Recommended)

**The easiest way to run EvidenceCheck - no Python setup needed!**

### Prerequisites
- Docker Desktop installed ([Download here](https://www.docker.com/products/docker-desktop))
- Git installed

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rithvik-palepu/mad-hacks-project.git
   cd mad-hacks-project
   ```

2. **Build and run with Docker:**
   ```bash
   docker-compose up --build
   ```
   
   ⚠️ **First build takes 5-10 minutes** (downloading dependencies)

3. **Open your browser:**
   - Navigate to: `http://localhost:3000`
   - App should be running!

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

**That's it!** No Python, no virtual environments, no dependency management needed.

For more Docker options, see [DOCKER.md](DOCKER.md)

## 🏗️ Architecture

The project has two main parts:

- **Backend (`backend/`)** – FastAPI service that:
  - Extracts claims about **people, cars, and weapons** from text
  - Runs YOLOv8 on video to detect people, vehicles, and weapon-like objects
  - Computes a **0–100 consistency score** between text claims and video
- **Frontend (`frontend/`)** – Vite + React app that:
  - Lets you upload a short video and description
  - Calls the FastAPI backend
  - Visualizes the overall score and per-claim breakdown

## 📦 Backend Installation (optional, without Docker)

### Prerequisites
- Python 3.10 or higher
- pip package manager

### Setup Steps

1. **Navigate to the backend:**
   ```bash
   cd mad-hacks-project/backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows (Command Prompt):**
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the FastAPI app:**
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

The backend will be available at `http://localhost:8000` (docs at `/docs`).

### Using the Application (end-to-end)

1. Open the frontend at `http://localhost:3000`.
2. Upload a short video clip (10–30 seconds, MP4/MOV/AVI/MKV).
3. Enter a text description including people, vehicles, and/or weapons.
4. Click **Analyze** to see:
   - Overall consistency score (0–100)
   - Per-claim breakdown
   - Sample annotated frames from the video

## 🧪 Testing Instructions

### Test Case 1: Basic Functionality Test

**Purpose:** Verify the application works end-to-end

1. **Prepare test video:**
   - Use a short video (10-30 seconds) showing:
     - 2-3 people clearly visible
     - 1-2 cars visible
     - No weapons

2. **Test description:**
   ```
   There were three people and two cars in the parking lot. No weapons were present.
   ```

3. **Expected results:**
   - Video should detect people and cars
   - Score should reflect accuracy of counts
   - Sample frames should show bounding boxes around detected objects

### Test Case 2: People Count Accuracy

**Purpose:** Test people detection accuracy

1. **Video:** Record or use a video with exactly 2 people
2. **Text:** "Two people were present in the scene."
3. **Expected:** Score should be high (80-100) if count matches

**Variations to test:**
- Text says "one person" when video has 2 → Score should drop (~70-80)
- Text says "three people" when video has 2 → Score should drop (~70-80)
- Text says "two people" when video has 2 → Score should be 100

### Test Case 3: Cars Count Accuracy

**Purpose:** Test vehicle detection accuracy

1. **Video:** Record or use a video with exactly 1 car
2. **Text:** "One car was parked in the lot."
3. **Expected:** Score should be high if detection is accurate

**Variations:**
- Text says "two cars" when video has 1 → Score penalty
- Text says "no cars" when video has 1 → Score penalty

### Test Case 4: Weapon Detection

**Purpose:** Test weapon detection (note: limited by YOLOv8 capabilities)

1. **Video:** Use a video with a knife or similar weapon visible
2. **Text:** "A knife was visible in the scene."
3. **Expected:** If weapon detected, score should reflect match

**Note:** Standard YOLOv8 may not reliably detect guns. Knives are more likely to be detected.

### Test Case 5: Multiple Claims

**Purpose:** Test system with multiple claim types

1. **Video:** Scene with 2 people, 1 car, no weapons
2. **Text:** "There were two people near one car. No weapons were present."
3. **Expected:** All three claims should be evaluated, combined score provided

### Test Case 6: Edge Cases

**No claims in text:**
- **Text:** "Something happened in the parking lot."
- **Expected:** No claims extracted, score may default or show info message

**Video too dark/blurry:**
- **Text:** "Three people were visible."
- **Expected:** Lower detection accuracy, score should reflect this

**Video too long/short:**
- Test with 5-second video → may work but limited frames
- Test with 60-second video → processing takes longer

## 📝 Example Test Videos

### Creating Test Videos

**Option 1: Use existing videos**
- Find short clips online (respecting copyright)
- Use your own recorded clips

**Option 2: Record test videos**
- Use phone camera to record:
  - Parking lot with visible cars
  - People walking in frame
  - Well-lit, daytime scenes
- Keep clips to 10-30 seconds

**Option 3: Use video editing software**
- Create simple test scenes
- Add multiple people/cars to same frame for easier testing

### Sample Test Descriptions

```
Example 1:
"There were three people walking through the parking lot. Two cars were visible. No weapons were present."

Example 2:
"Two men were standing near a single vehicle. A weapon was not visible."

Example 3:
"One person entered the area. There were no cars and no weapons in the scene."
```

## 🔍 Manual Testing Checklist

- [ ] Application launches successfully
- [ ] Video upload works (MP4, MOV, AVI formats)
- [ ] Text input accepts and processes descriptions
- [ ] Video analysis completes without errors
- [ ] People count is extracted from text correctly
- [ ] Cars count is extracted from text correctly
- [ ] Weapon presence/absence is extracted from text correctly
- [ ] Consistency score is calculated (0-100 range)
- [ ] Details table displays correctly
- [ ] Sample frames show with bounding boxes
- [ ] Video statistics display correctly

## 🐛 Troubleshooting

### Common Issues

**1. "Module not found" errors:**
- Ensure virtual environment is activated
- Reinstall requirements: `pip install -r requirements.txt`

**2. YOLOv8 download issues:**
- First run downloads model weights (~6MB)
- Check internet connection
- Weights cached after first download

**3. Video won't process:**
- Check video format (supported: MP4, MOV, AVI, MKV)
- Ensure video is not corrupted
- Try a shorter clip (10-30 seconds)

**4. Poor detection accuracy:**
- Use well-lit, daytime videos
- Ensure objects are clearly visible
- Avoid very dark or blurry footage

**5. Streamlit not starting:**
- Check if port 8501 is already in use
- Try: `streamlit run app.py --server.port 8502`

## 📊 Scoring Logic

The consistency score starts at 100 and deducts points for mismatches:

- **People/Cars Count:**
  - Exact match: No penalty
  - Difference of 1: -10 points
  - Difference > 1: -30 points

- **Weapon Presence:**
  - Match: No penalty
  - Mismatch: -40 points

## ⚠️ Known Limitations (MVP)

- **Weapon detection:** Limited to knives in standard YOLOv8. Guns may not be detected reliably.
- **Night scenes:** Not supported; requires daytime/well-lit footage
- **Complex actions:** Only static counts supported (no actions or timelines)
- **Audio:** Not analyzed
- **Multiple cameras:** Single camera perspective only
- **Roles:** Cannot distinguish officer/suspect roles

## 🔧 Development Notes

- **Model:** Uses YOLOv8n (nano) by default for speed. Can switch to 'yolov8s.pt' or 'yolov8m.pt' in `video_analyzer.py` for better accuracy.
- **Frame sampling:** Defaults to 1 frame per second. Adjustable via `frame_rate` parameter.
- **Confidence threshold:** 0.5 (50%) for object detections. Adjustable in code.

## 📄 License

This is an MVP project for MadHacks 2025.

---

**Happy Testing! 🚀**

# mad-hacks-project
