# Implementation Roadmap

## Phase 1: Foundation & DB
- [ ] Create directory structure: `src/backend`, `src/frontend`, `src/collector`.
- [ ] Create `.env` file with Supabase credentials.
- [ ] Apply DB Schema from `@01_DATA_MODEL.md` to Supabase.

## Phase 2: Threat Collector (Standalone)
- [ ] **Working Directory**: `src/collector/`
- [ ] Setup virtual environment dependencies (httpx, beautifulsoup4, openai).
- [ ] Create `collector.py`:
    1. Fetch threat data (RSS/Web).
    2. Analyze using `GPT-4.1.-nano`.
    3. Connect directly to Supabase and insert into `threat_cases`.
- [ ] Test the script standalone (`python src/collector/collector.py`).

## Phase 3: Backend API
- [ ] **Working Directory**: `src/backend/`
- [ ] Setup FastAPI skeleton.
- [ ] Implement `GET /api/dashboard` (Read User Info & Score).
- [ ] Implement `POST /api/simulate` (Trigger Simulation).
- [ ] Implement Email Sending Logic (SMTP).

## Phase 4: Frontend Web
- [ ] **Working Directory**: `src/frontend/`
- [ ] Initialize Vite React project.
- [ ] Build "User Survey" & "Dashboard" pages.
- [ ] Connect to Backend API (`/api/...`).