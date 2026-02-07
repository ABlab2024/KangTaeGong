# Backend Service

강태공(Phishing Prevention MVP)의 백엔드 서비스입니다.

## 🛠 기술 스택

- **Framework**: FastAPI
- **Database**: Supabase (PostgreSQL + pgvector)
- **Deploy**: Render (Free Tier)
- **Library**: Asyncpg, SQLAlchemy, Pydantic

## 📂 디렉토리 구조

```
src/backend/app/
├── api/        # API 라우터 (Endpoints)
├── core/       # 핵심 설정 (Config, Security)
├── db/         # 데이터베이스 연결 및 세션 관리
├── models/     # SQLAlchemy ORM 모델
├── schemas/    # Pydantic 데이터 스키마 (Request/Response)
└── main.py     # 애플리케이션 진입점 (Entry Point)
```

## 🚀 시작하기 (Getting Started)

모든 명령어를 `taegong-venv` 가상환경 내에서 실행해야 합니다.

### 1. 가상환경 활성화 (Windows)

```bash
..\..\..\taegong-venv\Scripts\activate
```

*(참고: 프로젝트 루트 기준 `taegong-venv` 위치에 따라 경로를 조정하세요)*

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 로컬 서버 실행

`src/backend` 디렉토리에서 아래 명령어를 실행합니다.

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

- 서버 주소: `http://localhost:8002`
- API 문서 (Swagger UI): `http://localhost:8002/docs`
