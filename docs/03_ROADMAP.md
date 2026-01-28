# Implementation Roadmap (MVP)

## Phase 1: Foundation & DB ✅
- [x] Create directory structure: `src/backend`, `src/frontend`, `src/collector`.
- [x] Create `.env` file with SQLite, Gemini API, SMTP credentials.
- [x] Apply DB Schema to SQLite (자동 초기화: `init_db.py`).

## Phase 2: Threat Collector (Standalone) ✅
- [x] **Working Directory**: `src/collector/`
- [x] Setup virtual environment dependencies (httpx, beautifulsoup4, feedparser, google-generativeai).
- [x] Create `rss_fetcher.py` for RSS feed parsing.
- [x] Test the script standalone.

## Phase 3: Backend API ✅
- [x] **Working Directory**: `src/backend/`
- [x] Setup FastAPI skeleton with SQLite async engine.
- [x] Implement Auth API (이메일 전용 로그인/관리자 로그인).
- [x] Implement Survey API (LLM 취향 증강, 취약점 분석).
- [x] Implement Admin API (사용자 조회, 통계, 시뮬레이션 발송).
- [x] Implement Tracking API (이메일 열람, 링크 클릭 추적).
- [x] Implement Email Sending Logic (Gmail SMTP).

## Phase 4: Frontend Web ✅
- [x] **Working Directory**: `src/frontend/`
- [x] Initialize Vite React project with TailwindCSS.
- [x] Build "Landing" page (시작하기 버튼만).
- [x] Build "Login" page (이메일 전용).
- [x] Build "Onboarding" (3단계 설문 + LLM 증강).
- [x] Build "VulnerabilityAnalysis" page (취약점 분석 결과).
- [x] Build "Dashboard" page.
- [x] Build "Admin" page (관리자 대시보드).
- [x] Connect to Backend API (`/api/v1/...`).

## Phase 5: Integration & Testing (진행 중)
- [ ] End-to-end 사용자 플로우 테스트.
- [ ] 피싱 시뮬레이션 이메일 발송 및 추적 테스트.
- [ ] 관리자 통계 검증.

## Phase 6: Deployment (예정)
- [ ] Backend: Render Free Tier에 배포.
- [ ] Frontend: Vercel에 배포.
- [ ] 환경 변수 설정 및 CORS 정책 확인.