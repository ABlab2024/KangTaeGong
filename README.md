# KangTaeGong (강태공) - 능동형 피싱 예방 및 위협 수집 플랫폼

본 프로젝트는 AI Agent를 활용하여 최신 피싱 위협 정보를 능동적으로 수집하고, 사용자 맞춤형 피싱 모의 훈련을 제공하는 웹 서비스입니다. 비용이 발생하지 않는 **Zero-Cost Architecture**를 기반으로 MVP(Minimum Viable Product)를 구축하는 것을 목표로 합니다.

## 1. 프로젝트 개요

- **비전**: 사용자 맞춤형 피싱 예방 훈련 제공 및 AI 기반 위협 인텔리전스 확보
- **핵심 가치**: 비용 0원으로 구축 가능한 고효율 보안 플랫폼 검증
- **타겟 사용자**: 디지털 환경에 익숙하지만 새로운 보안 위협에 노출된 20대 디지털 네이티브

---

## 2. 시스템 작동 플로우 (System Flow)

전체 시스템은 크게 **수집(Collector)**, **분석/관리(Backend)**, **사용자/관리자(Frontend)** 세 가지 축으로 작동합니다.
**서버리스 아키텍처**를 채택하여 운영 비용을 최소화했습니다.

1.  **위협 정보 수집 (Threat Collection)**
    -   `Collector`가 보안 뉴스(RSS), 커뮤니티 등에서 최신 피싱 사례를 수집합니다.
    -   Google Gemini 모델이 수집된 비정형 데이터를 분석하여 피싱 유형, 위험도, 주요 키워드를 추출 및 구조화합니다.
    -   구조화된 데이터는 **Supabase PostgreSQL**에 저장되어 시나리오 생성의 기초 데이터로 활용됩니다.

2.  **사용자 분석 (User Profiling)**
    -   사용자는 회원가입 후 **온보딩 설문(Onboarding Survey)**을 진행합니다.
    -   연령대, 성별, 관심사, 디지털 이용 습관 등을 분석하여 개인별 **보안 취약점**을 도출합니다.

3.  **모의 훈련 및 피드백 (Simulation & Feedback)**
    -   **GitHub Actions**가 주기적으로 스케줄을 확인하고 훈련 이메일을 발송합니다(Serverless Cron).
    -   관리자(Admin)는 수집된 위협 정보와 사용자 프로필을 매칭하여 맞춤형 피싱 시뮬레이션(이메일 등)을 생성합니다.
    -   훈련 결과는 대시보드에 반영되어 사용자의 보안 점수(Defense Rate)와 랭킹이 갱신됩니다.

---

## 3. 주요 기능 및 페이지 설명

### 👤 사용자 페이지 (User Side)

**1. 대시보드 (Dashboard)**
-   **나의 보안 점수**: 전체 사용자 및 동일 연령대 대비 나의 방어율 랭킹을 시각적으로 제공합니다.
-   **취약점 분석 리포트**: 온보딩 데이터를 바탕으로 내가 어떤 유형의 피싱에 취약한지 AI가 분석한 결과를 보여줍니다.
-   **최신 보안 뉴스**: 수집기가 가져온 최신 피싱 뉴스를 실시간으로 확인할 수 있습니다.

**2. 온보딩 (Onboarding)**
-   최초 로그인 시 진행되는 설문조사 페이지입니다. 사용자의 환경과 성향을 파악하여 맞춤형 훈련을 설계하는 데 사용됩니다.

**3. 취약점 상세 분석 (Vulnerability Analysis)**
-   대시보드의 요약 정보를 넘어, AI가 분석한 상세한 취약점 리포트와 행동 지침을 제공합니다.

### 🛡️ 관리자 페이지 (Admin Side)

**1. 관리자 대시보드 (Admin Dashboard)**
-   전체 가입자 수, 진행된 시뮬레이션 횟수, 평균 방어율 등 서비스 전체 현황을 한눈에 볼 수 있습니다.
-   연령대별, 성별별 피싱 취약 통계를 그래프/수치로 제공합니다.

**2. 사용자 관리 (User Management)**
-   등록된 사용자 목록을 조회하고, 각 사용자의 보안 점수와 온보딩 완료 여부를 확인합니다.

**3. 시나리오 및 시뮬레이션 관리**
-   자동 생성되거나 등록된 피싱 시나리오를 관리합니다.
-   AI를 이용해 타겟 맞춤형 시나리오를 자동 생성합니다.

---

## 4. 기술 스택 (Serverless Architecture)

비용 효율 인프라 구성을 위해 Serverless 및 Free Tier를 적극 활용합니다.

-   **Frontend**: React, TailwindCSS, Vite (Hosting: **Netlify**)
-   **Backend**: Python FastAPI (Hosting: **Netlify Functions** - Serverless)
-   **Scheduler**: **GitHub Actions** (Cron Job)
-   **Database**: **Supabase** (PostgreSQL + pgvector)
-   **AI Model**: Google Gemini Pro (Free Tier)

---

## 5. 설치 및 실행 가이드 (Usage Guide)

### 전제 조건
-   **Python 3.12+**, **Node.js 18+**
-   **Supabase 계정** 및 프로젝트 생성
-   **Google Gemini API Key**
-   **Netlify 계정** (선택)

### 1단계: 환경 설정 및 설치

```bash
# 1. 저장소 클론 및 이동
git clone <repository-url>
cd KangTaeGong

# 2. Python 가상환경 생성 및 활성화
python -m venv taegong-venv
source taegong-venv/bin/activate  # Mac/Linux
# taegong-venv\Scripts\activate   # Windows

# 3. Backend 의존성 설치
pip install -r src/backend/requirements.txt

# 4. Frontend 의존성 설치
cd src/frontend
npm install
cd ../..
```

### 2단계: 환경 변수(.env) 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 정보를 입력하세요.

```env
# Database (Supabase)
DATABASE_URL=postgresql+asyncpg://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# AI Model
GEMINI_API_KEY=your_gemini_api_key

# Email (SMTP)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
```

### 3단계: 애플리케이션 실행 (Local Development)

개발 환경에서는 Backend(Uvicorn)와 Frontend(Vite)를 각각 실행합니다.

**Terminal 1 (Backend)**
```bash
# 가상환경 활성화 상태에서
cd src/backend

# 데이터베이스 시딩 (최초 1회)
python -m app.db.init_db

# 서버 실행
uvicorn app.main:app --reload --port 8002
```
-   Backend Server: `http://localhost:8002`

**Terminal 2 (Frontend)**
```bash
cd src/frontend
npm run dev
```
-   Web Client: `http://localhost:5173`

### 4단계: 배포 (Deployment)

**Netlify 배포**
1. GitHub 저장소를 Netlify에 연결합니다.
2. Build command: `pip install -r src/backend/requirements.txt`
3. Publish directory: `.` (Backend Functions 배포를 위해 루트 지정)
4. Environment Variables 등록: `.env`에 있는 모든 변수를 Netlify 대시보드에 등록합니다.

**스케줄러 설정 (GitHub Actions)**
1. GitHub 저장소의 `Settings` > `Secrets and variables` > `Actions`로 이동합니다.
2. `DATABASE_URL`, `SMTP_*`, `GEMINI_API_KEY` 비밀값을 등록합니다.
3. `.github/workflows/process_schedules.yml`이 자동으로 주기적 훈련을 실행합니다.

---

## 6. 사용 방법 (User Manual)

### 일반 사용자 (User)
1.  **회원가입(Sign Up)** 페이지에서 계정을 생성합니다.
2.  로그인 후, **온보딩 설문**을 완료합니다.
3.  **대시보드**에서 자신의 랭킹과 보안 뉴스를 확인합니다.
4.  (시뮬레이션 발송 시) 이메일 등으로 도착한 훈련 메시지를 확인하고 절차에 따릅니다.

### 관리자 (Admin)
1.  `/admin` 경로로 접속하거나 관리자 계정으로 로그인합니다.
2.  **사용자 탭**에서 가입된 사용자 현황을 모니터링합니다.
3.  **시나리오 생성** 탭에서 AI를 이용해 훈련 시나리오를 만들고 스케줄을 등록합니다.
4.  **통계 탭**에서 훈련 결과와 취약점 통계를 분석합니다.

---

## 7. 프로젝트 구조

```text
/
├── .github/workflows/  # GitHub Actions (Scheduler)
├── netlify/functions/  # Netlify Serverless Entrypoint
├── netlify.toml        # Netlify Deploy Config
├── docs/               # 기획 및 설계 문서
├── src/
│   ├── backend/        # FastAPI 서버 (Serverless Compatible)
│   │   ├── app/        # API, DB Models, Logic
│   │   └── scripts/    # Migration, Scheduler Scripts
│   ├── frontend/       # React 앱
│   └── collector/      # 위협 정보 수집 Scripts
├── taegong-venv/       # Python 가상환경
├── requirements.txt    # 의존성 목록
└── README.md           # 프로젝트 문서
```

---

## 8. 개발 로드맵

현재 **Phase 5: Integration & Deployment** 단계 완료.

-   [x] 핵심 기능 구현 (Collector, Backend, Frontend)
-   [x] MVP 레벨 연동 (User Flow, Admin Dashboard)
-   [x] Serverless 전환 (Netlify Functions + Supabase)
-   [x] 스케줄러 자동화 (GitHub Actions)
-   [ ] 시나리오 고도화 및 실제 배포 운영
