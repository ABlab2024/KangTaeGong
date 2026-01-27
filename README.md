# KangTaeGong (강태공) - 능동형 피싱 예방 및 위협 수집 플랫폼

본 프로젝트는 AI Agent를 활용하여 최신 피싱 위협 정보를 능동적으로 수집하고, 사용자 맞춤형 피싱 모의 훈련을 제공하는 웹 서비스입니다. 비용이 발생하지 않는 **Zero-Cost Architecture**를 기반으로 MVP(Minimum Viable Product)를 구축하는 것을 목표로 합니다.

## 1. 프로젝트 개요

- **비전**: 사용자 맞춤형 피싱 예방 훈련 제공 및 AI 기반 위협 인텔리전스 확보
- **핵심 가치**: 비용 0원으로 구축 가능한 고효율 보안 플랫폼 검증
- **타겟 사용자**: 디지털 환경에 익숙하지만 새로운 보안 위협에 노출된 20대 디지털 네이티브

---

## 2. 주요 기능

1.  **Threat Collector (위협 수집기)**
    - `GPT-4.1.-nano` 모델을 활용하여 보안 뉴스 및 커뮤니티에서 피싱 사례 수집
    - 수집된 데이터를 분석하여 구조화된(JSON) 위협 정보로 변환 및 DB 적재
2.  **Web Dashboard (웹 대시보드)**
    - 사용자 가입 및 로그인, 보안 취향 설문 조사
    - 개인별 보안 점수 리포트 시각화 제공
3.  **Simulation Engine (모의 훈련 엔진)**
    - 수집된 위협 사례와 사용자 정보를 결합하여 맞춤형 피싱 이메일 시나리오 생성
    - SMTP를 이용한 훈련용 이메일 발송
4.  **Behavior Tracking (행동 추적)**
    - 가짜 피싱 사이트 내 클릭, 체류 시간 등 사용자 반응 로깅 및 분석

---

## 3. 기술 스택 (Zero-Cost Stratgey)

비용 효율 인프라 구성을 위해 Free Tier를 적극 활용합니다.

-   **Frontend**: React, TailwindCSS, Vite (Hosting: Vercel)
-   **Backend**: Python FastAPI (Hosting: Render Free Tier)
-   **Collector**: Python Scripts (BeautifulSoup, FeedParser)
-   **Database**: Supabase (PostgreSQL + pgvector)
-   **AI Model**: GPT-4.1.-nano (Cost-effective)

---

## 4. 프로젝트 구조

```text
/
├── docs/               # 기획 및 설계 문서
│   ├── 00_MASTER_PLAN.md
│   ├── 01_DATA_MODEL.md
│   ├── 02_TECH_STACK_RULES.md
│   └── 03_ROADMAP.md
├── src/
│   ├── backend/        # FastAPI 백엔드 서버
│   ├── frontend/       # React 프론트엔드 웹
│   └── collector/      # 위협 정보 수집 스크립트
├── taegong-venv/       # Python 가상환경
├── requirements.txt    # 의존성 패키지 목록
└── README.md           # 프로젝트 설명 문서
```

---

## 5. 설치 및 실행 가이드 (Local Development)

### 전제 조건
- **Python 3.10+** (가상환경 사용 권장)
- **Node.js 18+** & **npm** (Frontend 실행용)
- **Supabase 계정** 및 프로젝트 설정 완료
- **OpenAI API Key** (위협 분석용)

### 1단계: 저장소 클론 및 환경 설정

```bash
# 1. 저장소 클론
git clone <repository-url>
cd KangTaeGong

# 2. Python 가상환경 생성 및 활성화
python -m venv taegong-venv

# Linux/Mac
source taegong-venv/bin/activate

# Windows (CMD)
taegong-venv\Scripts\activate

# Windows (PowerShell)
.\taegong-venv\Scripts\Activate.ps1

# 3. Python 의존성 설치 (전체)
pip install -r requirements.txt
```

### 2단계: 환경 변수 설정

최상위 디렉토리에 `.env` 파일을 생성하고 아래 템플릿을 참고하여 값을 입력합니다.

```ini
# ============================================
# Database (Supabase PostgreSQL)
# ============================================
# Format: postgresql+asyncpg://user:password@host:port/dbname
DATABASE_URL=postgresql+asyncpg://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Supabase Client Config
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_KEY=your_supabase_anon_key

# ============================================
# AI Model (OpenAI)
# ============================================
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxx

# ============================================
# Messaging (Email - Gmail SMTP)
# ============================================
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
# Gmail의 경우 앱 비밀번호 사용 (로그인 비밀번호 X)
SMTP_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# ============================================
# Security (FastAPI JWT)
# ============================================
# 아래 명령어로 시크릿 키 생성: openssl rand -hex 32
SECRET_KEY=your_super_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 3단계: 모듈별 실행

#### 🔹 Backend (API 서버) - 포트 8002

```bash
# 가상환경 활성화 후 실행
cd src/backend

# 방법 1: uvicorn 직접 실행
uvicorn app.main:app --reload --port 8002

# 방법 2: main.py 실행
python -m app.main
```

**실행 확인**: http://localhost:8002 접속 시 아래 응답 확인
```json
{"message": "KangTaeGong API is running"}
```

**API 문서**: http://localhost:8002/docs (Swagger UI)

---

#### 🔹 Frontend (웹 클라이언트) - 포트 5173

```bash
cd src/frontend

# 의존성 설치 (최초 1회)
npm install

# 개발 서버 실행
npm run dev
```

**실행 확인**: http://localhost:5173 접속

**빌드 (프로덕션용)**:
```bash
npm run build
npm run preview  # 빌드 결과 미리보기
```

---

#### 🔹 Collector (위협 수집기)

```bash
# 프로젝트 루트에서 실행 (가상환경 활성화 필수)
python src/collector/collector.py
```

> ⚠️ **주의**: Collector는 GitHub Actions를 통해 Cron으로 자동 실행되도록 설계되어 있습니다. 로컬 실행은 테스트 용도로만 사용하세요.

---

### 4단계: 전체 시스템 동시 실행 (개발 환경)

개발 시 **Backend**와 **Frontend**를 동시에 실행해야 합니다. 각각 별도의 터미널에서 실행하세요.

| 터미널 | 명령어 | 포트 |
|:---:|:---|:---:|
| 터미널 1 | `cd src/backend && uvicorn app.main:app --reload --port 8002` | 8002 |
| 터미널 2 | `cd src/frontend && npm run dev` | 5173 |

---

### 트러블슈팅

| 문제 | 해결 방법 |
|:---|:---|
| `DATABASE_URL` 환경변수 오류 | `.env` 파일이 프로젝트 루트에 있는지 확인 |
| Port 8002 이미 사용 중 | `--port` 옵션으로 다른 포트 지정 또는 기존 프로세스 종료 |
| CORS 오류 | Backend의 `main.py`에서 Frontend URL이 `allow_origins`에 포함되어 있는지 확인 |
| npm 의존성 오류 | `rm -rf node_modules && npm install` 후 재시도 |

---

## 6. 개발 로드맵 및 진행 상황

이 프로젝트는 단계별(Phase) 접근 방식을 따릅니다.

### Phase 1: Foundation & DB (✅ 완료)
- [x] 프로젝트 디렉토리 구조 설계
- [x] Supabase DB 스키마 설계 및 적용 (`docs/01_DATA_MODEL.md` 참고)

### Phase 2: Threat Collector (✅ 완료)
- [x] 수집기 환경 설정 (`src/collector`)
- [x] RSS/Web 크롤러 구현 (`rss_fetcher.py`)
- [x] GPT 활용 위협 데이터 분석 파이프라인 구축 (`ai_analyzer.py`)
- [x] Supabase 데이터 적재 연동

### Phase 3: Backend API (✅ 완료)
- [x] FastAPI 기본 골격 구성 (`src/backend/app/main.py`)
- [x] 사용자 인증 API (JWT 기반 로그인/회원가입)
- [x] 위협 정보 조회 API (`/api/v1/threats`)
- [x] 시뮬레이션 API (`/api/v1/simulation`)

### Phase 4: Frontend Web (✅ 완료)
- [x] Vite + React + TailwindCSS 프로젝트 초기화
- [x] 사용자 인증 UI (로그인/회원가입)
- [x] 대시보드 UI 구현
- [x] 백엔드 API 연동

### Phase 5: Integration & Deployment (🚧 진행 중)
- [ ] GitHub Actions를 통한 Collector Cron Job 구성
- [ ] Render Free Tier 백엔드 배포
- [ ] Vercel 프론트엔드 배포
- [ ] 통합 테스트 및 버그 수정

상세한 개발 계획은 `docs/03_ROADMAP.md` 문서를 참고하십시오.
