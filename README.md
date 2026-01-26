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
- Python 3.10+
- Node.js & npm
- Supabase 계정 및 프로젝트 설정

### 1단계: 환경 설정
1. 저장소 클론:
   ```bash
   git clone <repository-url>
   cd KangTaeGong
   ```
2. 가상환경 생성 및 활성화:
   ```bash
   python -m venv taegong-venv
   source taegong-venv/bin/activate  # Mac/Linux
   taegong-venv\Scripts\activate     # Windows
   ```
3. 의존성 설치:
   ```bash
   pip install -r requirements.txt
   ```

### 2단계: 환경 변수 설정
최상위 디렉토리에 `.env` 파일을 생성하고 Supabase 연결 정보를 입력합니다.
```ini
DATABASE_URL=your_supabase_connection_string
OPENAI_API_KEY=your_openai_api_key
```

### 3단계: 실행 (모듈별)
- **Collector (수집기)**:
  ```bash
  python src/collector/collector.py
  ```
- **Backend (API 서버)**:
  ```bash
  cd src/backend
  uvicorn main:app --reload
  ```
- **Frontend (웹 클라이언트)**:
  ```bash
  cd src/frontend
  npm install
  npm run dev
  ```

---

## 6. 개발 로드맵 및 진행 상황

이 프로젝트는 단계별(Phase) 접근 방식을 따릅니다.

### Phase 1: Foundation & DB (✅ 완료)
- [x] 프로젝트 디렉토리 구조 설계
- [x] Supabase DB 스키마 설계 및 적용 (`docs/01_DATA_MODEL.md` 참고)

### Phase 2: Threat Collector (🚧 진행 중)
- [ ] 수집기 환경 설정 (`src/collector`)
- [ ] RSS/Web 크롤러 구현
- [ ] GPT 활용 위협 데이터 분석 파이프라인 구축
- [ ] Supabase 데이터 적재 연동

### Phase 3: Backend API (📅 예정)
- [ ] FastAPI 기본 골격 구성
- [ ] 대시보드 API (사용자 정보/점수 조회)
- [ ] 시뮬레이션 트리거 및 이메일 발송 구현

### Phase 4: Frontend Web (📅 예정)
- [ ] Vite + React 프로젝트 초기화
- [ ] 사용자 설문 및 대시보드 UI 구현
- [ ] 백엔드 API 연동

상세한 개발 계획은 `docs/03_ROADMAP.md` 문서를 참고하십시오.
