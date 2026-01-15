# RetroWatch

**Experience TV Like It's 1985 Again**

RetroWatch is a nostalgic streaming platform that recreates the golden age of television. Watch YouTube videos through an authentic CRT TV simulation, complete with AI-matched period commercials that play during natural ad breaks.

**Live Demo:** https://retrowatch.malhan.ca

## System Architecture

<img width="1053" height="977" alt="RetroWatch System Architecture" src="https://github.com/user-attachments/assets/f96bb5eb-8c22-4dbf-8060-45dc80477938" />

## Features

- **CRT TV Simulation** — Immersive 3D CRT television model with authentic visual effects (scanlines, static, phosphor glow, screen curvature)
- **AI-Powered Ad Matching** — Upload your own ads and let Gemini AI analyze and match them to video content based on categories, tone, and era style
- **Smart Ad Scheduling** — AI suggests natural break points in videos for seamless ad insertion
- **YouTube Integration** — Play any YouTube video through the retro TV experience using official YouTube APIs
- **Watch History** — Track your viewing sessions and ad performance analytics
- **Library Dashboard** — Manage uploaded ads, view stats, and start new watch sessions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, TypeScript, Tailwind CSS, Framer Motion |
| Backend | Spring Boot 4, Java 21 |
| Database | Supabase (PostgreSQL) |
| Authentication | Clerk |
| AI/ML | Vertex AI (Gemini) |
| 3D Rendering | Three.js, React Three Fiber |
| Deployment | Docker, Kubernetes, Google Cloud Run |

## Getting Started

### Prerequisites

- Node.js 20+ and pnpm
- Java 21+
- Docker (for containerized deployment)
- Google Cloud account (for Vertex AI)
- Supabase project
- Clerk application

### Environment Variables

Create a `.env` file in the project root:

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://postgres:...

# Google Cloud / Vertex AI
GCP_PROJECT_ID=your-gcp-project
GCP_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash-001
```

### Local Development

**Using Docker (recommended):**

```bash
# Quick start with docker-compose
./run-local.sh

# Or manually
docker-compose up --build
```

**Using Tilt (Kubernetes):**

```bash
tilt up
```

**Manual setup:**

```bash
# Frontend
cd frontend
pnpm install
pnpm dev

# Backend (separate terminal)
cd backend
mvn spring-boot:run
```

Access the app at `http://localhost:8080` (Docker) or `http://localhost:5173` (Vite dev server).

## Project Structure

```
retrowatch/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── ui/           # Base UI (shadcn/ui)
│   │   │   └── library/      # Library page components
│   │   ├── pages/            # Route pages (Library, Player, Settings)
│   │   ├── hooks/            # Custom React hooks
│   │   └── stores/           # Zustand state stores
│   └── package.json
│
├── backend/                  # Spring Boot application
│   ├── src/main/java/com/richwavelet/backend/
│   │   ├── api/              # REST controllers
│   │   ├── service/          # Business logic (Gemini, Supabase)
│   │   ├── config/           # Configuration beans
│   │   └── model/            # Data models
│   └── pom.xml
│
├── k8s/                      # Kubernetes manifests
├── Dockerfile                # Multi-stage build
├── docker-compose.yml        # Local development
├── Tiltfile                  # Tilt configuration
└── cloudbuild.yaml           # Google Cloud Build
```

## How It Works

### CRT TV Experience

The player uses Three.js and React Three Fiber to render a 3D CRT television model. YouTube videos are embedded via CSS3D transforms, and post-processing effects simulate authentic CRT artifacts:

- Scanlines and phosphor glow
- Screen curvature distortion
- Color bleeding and static noise
- Channel change transitions

### AI Ad Matching

When you upload an ad, Gemini AI analyzes it to extract:
- **Categories** (automotive, food, technology, etc.)
- **Tone** (humorous, nostalgic, exciting)
- **Era style** (1980s, 1990s, modern-retro)
- **Keywords and transcript**

When you watch a YouTube video, the system:
1. Fetches video metadata via YouTube Data API
2. Analyzes content with Gemini to identify topics and natural break points
3. Matches your ads to the video using a weighted scoring algorithm
4. Builds an ad schedule with optimal insertion timestamps

### Ad Playback Flow

```
YouTube Playing → Ad Break Point → Pause Video → Static Transition
                                                        ↓
                                        Play Ad with CRT Effects
                                                        ↓
Resume YouTube ← Static Transition ← Ad Completes
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/protected/ads` | GET/POST | Manage user ads |
| `/api/protected/ads/{id}/analyze` | POST | Trigger AI analysis |
| `/api/protected/library/history` | GET/POST | Watch history |
| `/api/protected/video/analyze` | POST | Analyze YouTube video |
| `/api/protected/match` | POST | Get ad schedule for video |

## Development Commands

```bash
# Frontend
cd frontend
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run linter

# Backend
cd backend
mvn test          # Run tests
mvn package       # Build JAR
mvn spring-boot:run  # Run locally

# Docker
docker-compose up --build      # Build and run
docker-compose down            # Stop containers
```

## Deployment

The project includes `cloudbuild.yaml` for automated deployment to Google Cloud Run:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## License

This project is proprietary software. All rights reserved.

---

Built with nostalgia
