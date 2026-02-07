# 백엔드 시스템 설명서 (Backend Guide)

이 문서는 **'강태공(KangTaeGong)'** 프로젝트의 뒷단에서 작동하는 **백엔드 시스템**의 구조와 작동 원리를 설명합니다.
개발 지식이 없는 분들도 이해할 수 있도록 쉽게 작성되었습니다.

---

## 1. 시스템 전체 흐름도 (Workflow)

백엔드 시스템은 크게 **"정보를 수집하는 수집기(Collector)"**와 **"사용자와 소통하는 서버(Backend API)"** 두 부분으로 나뉩니다.

```mermaid
graph TD
    subgraph "1. 위협 정보 수집 (Collector)"
        A[보안 뉴스 사이트] -->|RSS 피드| B(수집기 RSS Fetcher)
        B -->|뉴스 본문| C{AI 분석기 (GPT)}
        C -->|피싱 여부 판단 & 요약| D[(구름 금고 - Supabase DB)]
    end

    subgraph "2. 사용자 서비스 (Backend API)"
        User[사용자] -->|회원가입 / 로그인| E(API 서버)
        E -->|인증 토큰 발급| User
        User -->|피싱 사례 조회 요청| E
        E -->|데이터 요청| D
        D -->|최신 피싱 정보 반환| E
        E -->|정보 전달| User
    end
```

---

## 2. 핵심 작동 원리

### ① 위협 수집기 (The Collector)
마치 부지런한 낚시꾼처럼 인터넷의 보안 정보를 24시간 감시합니다.
1.  **뉴스 수집**: KISA, Hacker News 등 신뢰할 수 있는 보안 사이트에서 새로운 뉴스가 올라오면 즉시 가져옵니다.
2.  **AI 분석**: 가져온 뉴스를 **인공지능(GPT-4)**에게 보여줍니다. AI는 다음과 같은 일을 합니다.
    *   "이게 정말 피싱 공격에 대한 내용인가?" 판단합니다.
    *   어떤 방식의 공격인지(예: 스미싱, 이메일 해킹) 유형을 분류합니다.
    *   핵심 키워드를 추출합니다.
3.  **저장**: AI가 분석한 깨끗한 정보를 데이터베이스(Supabase)에 저장합니다.

### ② API 서버 (The Server)
사용자(프론트엔드)의 요청을 처리하는 은행 창구와 같은 역할을 합니다.
1.  **보안관 (인증/보안)**:
    *   사용자가 회원가입할 때 비밀번호를 **암호화**하여 아무도 알아볼 수 없게 저장합니다.
    *   로그인하면 **'출입증(JWT 토큰)'**을 발급해 줍니다. 이 출입증이 있어야만 정보를 조회할 수 있습니다.
2.  **정보 제공**:
    *   사용자가 "최신 피싱 정보를 보여줘"라고 요청하면, 수집기가 저장해둔 데이터를 데이터베이스에서 꺼내줍니다.

---

## 3. 사용된 기술 (Tech Stack)

이 시스템을 만들기 위해 사용된 도구들입니다.

| 로고 | 이름 | 역할 | 비유 |
|:---:|:---:|:---|:---|
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) | **Python** | 프로그래밍 언어 | 건축가가 사용하는 설계 도구 |
| ![FastAPI](https://img.shields.io/badge/-FastAPI-009688?logo=fastapi&logoColor=white) | **FastAPI** | 웹 프레임워크 | 고속도로처럼 빠른 서버 골격 |
| ![Supabase](https://img.shields.io/badge/-Supabase-3ECF8E?logo=supabase&logoColor=white) | **Supabase** | 데이터베이스 | 정보를 안전하게 보관하는 클라우드 금고 |
| ![OpenAI](https://img.shields.io/badge/-OpenAI-412991?logo=openai&logoColor=white) | **GPT-4** | 인공지능 모델 | 정보를 읽고 분석하는 똑똑한 비서 |

---

## 4. 데이터 저장 구조

데이터베이스에는 다음과 같은 정보들이 표(Table) 형태로 저장됩니다.

1.  **Users (사용자)**: 아이디, 비밀번호(암호화됨), 취향 태그
2.  **Threat Cases (위협 사례)**: 수집된 뉴스 원문, AI 요약 정보, 출처 링크
3.  **Simulation Logs (훈련 기록)**: 사용자에게 언제 어떤 훈련 메일을 보냈는지 기록

---

## 5. 실행 방법 (개발자용 요약)

1.  가상 환경 활성화: `source taegong-venv/bin/activate`
2.  의존성 설치: `pip install -r src/backend/requirements.txt`
3.  백엔드 서버 실행: `uvicorn src.backend.app.main:app --reload`
4.  수집기 실행: `python src/collector/collector.py`
