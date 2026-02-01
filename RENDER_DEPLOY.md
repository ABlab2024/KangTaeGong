# 🚀 Render Backend 배포 가이드 (KangTaeGong API)

FastAPI 백엔드를 **Render Free Tier**에 배포하는 방법입니다.

---

## 📋 사전 준비

- [Render 계정](https://render.com) (GitHub 연동 권장)
- [Supabase 계정](https://supabase.com) (PostgreSQL 데이터베이스)
- GitHub 저장소에 코드 푸시 완료

---

## 🔧 Step 1: Supabase 데이터베이스 설정

> 이미 Supabase 프로젝트가 있다면 이 단계를 건너뛰세요.

1. [Supabase Dashboard](https://app.supabase.com) 접속
2. **New Project** 생성
3. **Settings** → **Database** → **Connection string** 복사
   - `URI` 탭에서 복사
   - 형식: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

---

## 🌐 Step 2: Render에 Backend 배포

### 방법 1: Blueprint 자동 배포 (render.yaml)

1. GitHub에 코드 푸시 (render.yaml 포함)
2. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
3. GitHub 저장소 연결
4. Render가 `render.yaml`을 감지하고 자동 설정

### 방법 2: 수동 배포

1. [Render Dashboard](https://dashboard.render.com) 접속
2. **New** → **Web Service** 클릭
3. GitHub 저장소 연결
4. 다음과 같이 설정:

| 항목 | 값 |
|------|-----|
| **Name** | `kangtaegong-api` |
| **Root Directory** | `src/backend` |
| **Runtime** | Python |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | Free |

5. **Create Web Service** 클릭

---

## ⚙️ Step 3: 환경 변수 설정 (Render)

Render 대시보드에서 **Environment** 탭으로 이동 후 다음 변수들을 추가:

| 변수명 | 값 | 필수 |
|--------|-----|------|
| `DATABASE_URL` | Supabase Connection String | ✅ |
| `SECRET_KEY` | 랜덤 문자열 (32자 이상) | ✅ |
| `GEMINI_API_KEY` | Google AI API Key | ✅ |
| `SMTP_SERVER` | `smtp.gmail.com` | ✅ |
| `SMTP_PORT` | `587` | ✅ |
| `SMTP_USERNAME` | Gmail 주소 | ✅ |
| `SMTP_PASSWORD` | Gmail 앱 비밀번호 | ✅ |
| `EMAIL_FROM` | 발신 이메일 주소 | ✅ |
| `ADMIN_EMAIL` | 관리자 이메일 | ✅ |
| `ADMIN_PASSWORD` | 관리자 비밀번호 | ✅ |

> 💡 **SECRET_KEY 생성**: 터미널에서 `openssl rand -hex 32` 실행

---

## 🔗 Step 4: Vercel Frontend 연결

Backend 배포 완료 후, Render에서 제공하는 URL을 복사합니다.
- 형식: `https://kangtaegong-api.onrender.com`

### Vercel 환경 변수 설정

1. [Vercel Dashboard](https://vercel.com/dashboard) → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:

| 변수명 | 값 |
|--------|-----|
| `VITE_API_URL` | `https://kangtaegong-api.onrender.com/api/v1` |

4. **Redeploy** 버튼 클릭

---

## ✅ Step 5: 배포 확인

### Backend 확인
```bash
# Health Check
curl https://kangtaegong-api.onrender.com/health

# API Docs
open https://kangtaegong-api.onrender.com/docs
```

### Frontend 확인
1. `https://kang-tae-gong.vercel.app` 접속
2. 로그인/회원가입 테스트
3. 온보딩 플로우 테스트

---

## ⚠️ 주의사항

### Render Free Tier 제한
- **15분 비활동 시 슬립**: 첫 요청 시 30초~1분 지연
- **750시간/월 한도**: 지속적인 트래픽 시 일시 중단 가능

### 권장 사항
- 중요 데모 전 Backend URL을 미리 호출하여 "웜업"
- 프로덕션 환경에서는 유료 플랜 고려

---

## 🔍 문제 해결

### "Application Error" 발생
1. Render Logs 확인 (Dashboard → Logs)
2. 환경 변수 누락 확인
3. DATABASE_URL 형식 확인 (`postgresql://...`)

### CORS 에러
`main.py`에서 Render URL이 CORS에 허용되어 있는지 확인

### 슬립 후 느린 응답
정상 동작입니다. Free Tier 특성상 첫 요청 시 콜드 스타트가 발생합니다.
