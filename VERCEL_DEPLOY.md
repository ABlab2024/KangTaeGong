# 🚀 Vercel 배포 가이드 (KangTaeGong Frontend)

이 문서는 KangTaeGong 프론트엔드를 **Vercel**에 배포하는 방법을 설명합니다.

---

## 📋 사전 준비 사항

### 필수 조건
- [Vercel 계정](https://vercel.com/signup) (GitHub 연동 권장)
- [GitHub 저장소](https://github.com) (코드 배포용)
- 배포된 Backend API URL (예: Render에서 호스팅된 FastAPI)

### 프로젝트 구조
```
KangTaeGong/
├── src/
│   ├── frontend/        # ← Vercel에 배포할 대상
│   └── backend/         # ← Render 등에 별도 배포
└── ...
```

---

## 🔧 Step 1: 환경 변수 설정

### 로컬 개발 환경 (.env.local)
`src/frontend/.env.local` 파일을 생성하세요:

```env
# 로컬 개발 시 빈 값으로 두면 Vite 프록시 사용
VITE_API_URL=
```

### 프로덕션 환경
Vercel 대시보드에서 환경 변수를 설정합니다 (아래 Step 3 참조).

---

## 🌐 Step 2: Vercel에 배포하기

### 방법 1: Vercel CLI 사용

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 프론트엔드 디렉토리로 이동
cd src/frontend

# 3. Vercel 로그인
vercel login

# 4. 프로젝트 배포
vercel

# 5. (선택) 프로덕션 배포
vercel --prod
```

### 방법 2: GitHub 연동 자동 배포 (추천)

1. **GitHub에 저장소 푸시**
   ```bash
   git add .
   git commit -m "chore: vercel deployment setup"
   git push origin main
   ```

2. **Vercel 대시보드에서 프로젝트 생성**
   - [Vercel Dashboard](https://vercel.com/dashboard) 접속
   - "Add New..." → "Project" 클릭
   - GitHub 저장소 선택

3. **프로젝트 설정**
   | 항목 | 값 |
   |------|-----|
   | **Framework Preset** | Vite |
   | **Root Directory** | `src/frontend` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

4. **Deploy** 버튼 클릭

---

## ⚙️ Step 3: 환경 변수 설정 (Vercel)

1. Vercel 대시보드에서 프로젝트 선택
2. **Settings** → **Environment Variables** 이동
3. 다음 환경 변수 추가:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `VITE_API_URL` | `https://kangtaegong.onrender.com/api/v1` | Production, Preview |

> ⚠️ **중요**: Backend URL이 정확한지 확인하세요. `/api/v1`까지 포함해야 합니다.

4. **Redeploy** 버튼을 클릭하여 환경 변수 적용

---

## 🔍 Step 4: 배포 확인

### 체크리스트
- [ ] 페이지 로딩 정상 (`https://your-app.vercel.app`)
- [ ] 로그인/회원가입 API 호출 성공
- [ ] 라우팅 정상 (새로고침 시 404 미발생)
- [ ] 온보딩 플로우 정상 동작

### 문제 해결

#### 404 에러 (새로고침 시)
`vercel.json`이 프론트엔드 루트에 있는지 확인:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### CORS 에러
Backend의 `main.py`에서 Vercel 도메인이 허용되어 있는지 확인:
```python
allow_origin_regex=r"https://.*\.vercel\.app"
```

#### API 호출 실패
1. Vercel 환경 변수 `VITE_API_URL`이 올바른지 확인
2. Backend가 정상 실행 중인지 확인
3. 브라우저 개발자 도구의 Network 탭에서 요청 URL 확인

---

## 📁 생성/수정된 파일

| 파일 | 설명 |
|------|------|
| `src/frontend/vercel.json` | Vercel 배포 설정 (SPA 리라이트) |
| `src/frontend/.env.example` | 환경 변수 템플릿 |
| `src/frontend/src/api/client.js` | 동적 API URL 지원 |
| `src/backend/app/main.py` | Vercel CORS 허용 |

---

## 🔗 유용한 링크

- [Vercel 공식 문서](https://vercel.com/docs)
- [Vite 배포 가이드](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Render 배포 (Backend)](https://render.com/docs/deploy-fastapi)
dd