# KangTaeGong (강태공) - 능동형 피싱 예방 및 위협 수집 플랫폼

본 프로젝트는 AI Agent를 활용하여 최신 피싱 위협 정보를 능동적으로 수집하고, 사용자 맞춤형 피싱 모의 훈련을 제공하는 웹 서비스입니다. 비용이 발생하지 않는 **Zero-Cost Architecture**를 기반으로 MVP(Minimum Viable Product)를 구축하는 것을 목표로 합니다.

## 1. 프로젝트 개요

- **비전**: 사용자 맞춤형 피싱 예방 훈련 제공 및 AI 기반 위협 인텔리전스 확보
- **핵심 가치**: 비용 0원으로 구축 가능한 고효율 보안 플랫폼 검증
- **타겟 사용자**: 디지털 환경에 익숙하지만 새로운 보안 위협에 노출된 20대 디지털 네이티브

---

## 2. 시스템 작동 플로우 (System Flow)

전체 시스템은 크게 **수집(Collector)**, **분석/관리(Backend)**, **사용자/관리자(Frontend)** 세 가지 축으로 작동합니다.

1.  **위협 정보 수집 (Threat Collection)**
    -   `Collector`가 보안 뉴스(RSS), 커뮤니티 등에서 최신 피싱 사례를 수집합니다.
    -   OpenAI GPT 모델이 수집된 비정형 데이터를 분석하여 피싱 유형, 위험도, 주요 키워드를 추출 및 구조화합니다.
    -   구조화된 데이터는 Supabase DB에 저장되어 시나리오 생성의 기초 데이터로 활용됩니다.

2.  **사용자 분석 (User Profiling)**
    -   사용자는 회원가입 후 **온보딩 설문(Onboarding Survey)**을 진행합니다.
    -   연령대, 성별, 관심사, 디지털 이용 습관 등을 분석하여 개인별 **보안 취약점**을 도출합니다.

3.  **모의 훈련 및 피드백 (Simulation & Feedback)**
    -   관리자(Admin)는 수집된 위협 정보와 사용자 프로필을 매칭하여 맞춤형 피싱 시뮬레이션(이메일 등)을 발송합니다.
    -   사용자의 반응(열람, 클릭, 정보 입력 등)은 실시간으로 추적(Tracking)됩니다.
    -   훈련 결과는 **대시보드**에 반영되어 사용자의 보안 점수(Defense Rate)와 랭킹이 갱신됩니다.

---

## 3. 주요 기능 및 페이지 설명

### 👤 사용자 페이지 (User Side)

**1. 대시보드 (Dashboard)**
-   **나의 보안 점수**: 전체 사용자 및 동일 연령대 대비 나의 방어율 랭킹을 시각적으로 제공합니다.
-   **취약점 분석 리포트**: 온보딩 데이터를 바탕으로 내가 어떤 유형의 피싱(예: 대출 사기, 사칭, 악성 앱 등)에 취약한지 AI가 분석한 결과를 보여줍니다.
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
-   자동 생성되거나 등록된 피싱 시나리오를 미리보기 할 수 있습니다. (난이도, 주제 등)
-   **전체 발송 기능**: 버튼 클릭 한 번으로 대상 사용자들에게 시뮬레이션 이메일을 일괄 발송할 수 있습니다.

---

## 4. 기술 스택 (Zero-Cost Strategy)

비용 효율 인프라 구성을 위해 Free Tier를 적극 활용합니다.

-   **Frontend**: React, TailwindCSS, Vite (Hosting: Vercel)
-   **Backend**: Python FastAPI (Hosting: Render Free Tier)
-   **Collector**: Python Scripts (BeautifulSoup, FeedParser)
-   **Database**: Supabase (PostgreSQL + pgvector)
-   **AI Model**: GPT-4.1.-nano / GPT-4o-mini (Cost-effective)

---

## 5. 설치 및 실행 가이드 (Usage Guide)

### 전제 조건
-   **Python 3.10+**, **Node.js 18+**, **Supabase 계정**, **OpenAI API Key**

### 1단계: 환경 설정 및 설치

```bash
# 1. 저장소 클론 및 이동
git clone <repository-url>
cd KangTaeGong

# 2. Python 가상환경 생성 및 활성화
python -m venv taegong-venv
source taegong-venv/bin/activate  # Mac/Linux
# taegong-venv\Scripts\activate   # Windows

# 3. Backend/Collector 의존성 설치
pip install -r requirements.txt

# 4. Frontend 의존성 설치
cd src/frontend
npm install
cd ../..
```

### 2단계: 환경 변수(.env) 설정

프로젝트 루트에 `.env` 파일을 생성하고 필요한 키 값을 입력하세요. (DB URL, OpenAI Key, SMTP 설정 등)

### 3단계: 애플리케이션 실행

개발 환경에서는 Backend와 Frontend를 각각 실행해야 합니다.

**Terminal 1 (Backend)**
```bash
# 가상환경 활성화 상태에서
cd src/backend
uvicorn app.main:app --reload --port 8002
```
-   Backend Server: `http://localhost:8002`
-   API Docs: `http://localhost:8002/docs`

**Terminal 2 (Frontend)**
```bash
cd src/frontend
npm run dev
```
-   Web Client: `http://localhost:5173`

---

## 6. 사용 방법 (User Manual)

### 일반 사용자 (User)
1.  브라우저에서 `http://localhost:5173`으로 접속합니다.
2.  **회원가입(Sign Up)** 페이지에서 계정을 생성합니다.
3.  로그인 후, **온보딩 설문**을 완료합니다.
4.  **대시보드**에서 자신의 랭킹과 보안 뉴스를 확인합니다.
5.  (시뮬레이션 발송 시) 이메일 등으로 도착한 훈련 메시지를 확인하고 절차에 따릅니다.

### 관리자 (Admin)
1.  브라우저에서 `http://localhost:5173/admin`으로 접속합니다.
2.  관리자 계정으로 로그인합니다. (DB나 환경변수에서 설정된 관리자 계정 사용)
3.  **사용자 탭**에서 가입된 사용자 현황을 모니터링합니다.
4.  **시뮬레이션 발송** 버튼을 눌러 훈련을 시작합니다.
5.  **통계 탭**에서 훈련 결과와 취약점 통계를 분석합니다.

---

## 7. 프로젝트 구조

```text
/
├── docs/               # 기획 및 설계 문서
├── src/
│   ├── backend/        # FastAPI 서버 (API, DB 모델, 로직)
│   ├── frontend/       # React 웹 어플리케이션 (Pages, Components)
│   └── collector/      # 위협 정보 수집 및 AI 분석 스크립트
├── taegong-venv/       # Python 가상환경
├── requirements.txt    # Backend 의존성
└── README.md           # 프로젝트 문서
```

---

## 8. 개발 로드맵

현재 **Phase 5: Integration & Deployment** 단계 진행 중입니다.
-   [x] 핵심 기능 구현 (Collector, Backend, Frontend)
-   [x] MVP 레벨 연동 (User Flow, Admin Dashboard)
-   [ ] GitHub Actions Cron Job 최적화
-   [ ] 클라우드 배포 (Render, Vercel)
