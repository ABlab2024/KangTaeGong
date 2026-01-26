# [검토 보고서] 개발 명세서 대비 구현 현황 분석

**일시**: 2026-01-26
**대상**: 현재 코드베이스 (`src/`) vs `docs/개발_명세서.md`

## 1. 요약 (Executive Summary)
현재 코드베이스는 **초기 스켈레톤(Skeleton) 단계**입니다. 백엔드와 수집기의 기본 구조는 잡혀있으나, 핵심 기능(실제 데이터 수집, 메일 발송, 프론트엔드)이 미구현 상태이거나 Mock 데이터로 대체되어 있습니다. MVP 런칭을 위해서는 상세 구현이 시급합니다.

| 영역 | 진행률 | 상태 요약 |
| :--- | :---: | :--- |
| **Backend (FastAPI)** | 20% | 기본 프로젝트 구조 및 `Threats` 조회 API 존재. `Users`, `Logs` 미구현. |
| **Database (Supabase)** | 30% | `ThreatCase` 모델(pgvector 포함) 정의됨. `Users`, `Logs` 테이블 스키마 부재. |
| **Collector (AI)** | 10% | 실행 가능한 단일 파이썬 스크립트 존재하나, **Mock 데이터**만 생성함. 실제 GPT-4.1-nano 연동 및 크롤링 로직 없음. |
| **Frontend (Web)** | 0% | 디렉토리만 존재하고 비어있음. |
| **Simulation (Email)** | 0% | 이메일 발송 로직 전무. |

---

## 2. 상세 상세 분석

### 2.1 Backend (`src/backend`)
*   **구현됨**:
    *   FastAPI 기본 설정 (`app/main.py`)
    *   비동기 DB 세션 설정 (`app/db`)
    *   `ThreatCase` SQLAlchemy 모델 (`app/models/threat_case.py`) - `pgvector` 컬럼 포함 확인됨.
    *   위협 사례 조회 엔드포인트 (`GET /api/v1/threats`)
*   **미구현 (누락됨)**:
    *   **사용자 관리**: `Users` 모델 및 회원가입/로그인 API 없음.
    *   **로그 관리**: 훈련 발송 및 클릭 로그를 저장할 `Logs` 모델 없음.
    *   **인증 미들웨어**: JWT 기반 인증 로직 부재.

### 2.2 Database (`Supabase`)
*   명세서 상 3개 테이블이 필요하나 현재 1개(`threat_cases`)만 모델링 됨.
    *   `Users`: ID, 이메일, 암호화된 비밀번호, 취향 태그, 보안 점수 (누락)
    *   `Threats`: 수집된 피싱 사례 (구현됨)
    *   `Logs`: 훈련 발송 및 클릭 로그 (누락)

### 2.3 Collector (`src/collector`)
*   `collector.py` 파일이 존재하며 Supabase 연결은 설정되어 있음.
*   **치명적 결핍**:
    *   실제 웹 크롤링/RSS 파싱 로직이 없음 (`generate_mock_threats` 함수로 더미 데이터만 생성).
    *   `GPT-4.1-nano` 등을 이용한 AI 분석/요약 로직이 전혀 없음.
    *   단순히 하드코딩된 예제 데이터를 DB에 넣는 기능만 수행함.

### 2.4 Frontend (`src/frontend`)
*   디렉토리가 완전히 비어있습니다.
*   React/Vite 프로젝트 초기화가 필요합니다.

### 2.5 Simulation & Messaging
*   이메일 발송(`smtplib` or API) 관련 코드가 전무함.
*   피싱 시뮬레이션 시나리오 생성 로직 없음.

---

## 3. 향후 권장 작업 순서 (Action Plan)

1.  **DB 스키마 보완**: `Users`, `Logs` 테이블 모델링 (Backend).
2.  **Collector 고도화**: 실제 보안 뉴스 RSS 피드 연동 및 LLM(OpenAI/Ollama 등)을 이용한 요약 파이프라인 구축.
3.  **Frontend 구축**: Vite + React + TailwindCSS 로 기본 뼈대 생성 및 랜딩/대시보드 페이지 구현.
4.  **Backend API 확장**: 사용자 가입/로그인 및 대시보드 데이터 제공 API 구현.
5.  **메일링 시스템 구현**: SMTP 연동하여 이메일 발송 테스트.
