# 🎣 KangTaeGong Frontend Review

이 문서는 `src/frontend` 디렉토리의 구현 내용, UI/UX 디자인, 기술 스택 및 실행 방법을 상세하게 설명합니다.

## 🛠 기술 스택 (Tech Stack)

이 프로젝트는 최신 모던 웹 기술을 사용하여 구축되었습니다.

### Core Framework & Build Tool
- **React 19**: 최신 사용자 인터페이스 라이브러리.
- **Vite 7**: 빠르고 가벼운 번들러 및 개발 서버 (HMR 지원).

### Styling & Design
- **TailwindCSS 3**: 유틸리티 퍼스트 CSS 프레임워크.
- **PostCSS & Autoprefixer**: CSS 전처리 및 벤더 프리픽스 자동화.
- **Framer Motion**: 부드러운 애니메이션 및 인터랙션 구현.
- **Lucide React**: 깔끔하고 일관된 아이콘 세트.
- **clsx & tailwind-merge**: 조건부 클래스 결합 및 충돌 해결 유틸리티.

### State Management & Data Fetching
- **TanStack Query (React Query) v5**: 서버 상태 관리, 캐싱, 동기화 및 에러 핸들링.
- **React Router DOM v7**: 클라이언트 사이드 라우팅 (`/`, `/login`, `/dashboard` 등).
- **Axios**: HTTP 클라이언트.

---

## 🎨 UI/UX 디자인 및 구현 방식

프로젝트는 **"Cyberpunk / Future Tech"** 컨셉의 다크 모드 테마를 채택하고 있으며, 사용자에게 몰입감 있는 경험을 제공합니다.

### 1. 디자인 테마 (Theme)
`tailwind.config.js` 및 `index.css`에 정의된 디자인 시스템은 다음과 같습니다.
- **색상 팔레트**:
  - **Void (`#0a0a0f`)**: 깊은 검정색 배경.
  - **Surface (`#12121a`)**: 카드 및 패널을 위한 약간 밝은 검정색.
  - **Neon Accents**: 사이버펑크 느낌의 강렬한 네온 컬러.
    - Cyan (`#00f3ff`), Pink (`#ff003c`), Purple (`#bc13fe`), Green (`#0aff60`)
- **폰트**:
  - **Display**: `Outfit` (제목, 헤드라인용)
  - **Body**: `Inter` (가독성 높은 본문용)

### 2. 시각적 효과 (Visual Effects)
- **Glassmorphism**: `.glass-panel` 클래스를 통해 반투명한 배경과 블러 효과(`backdrop-blur-xl`)를 적용하여 깊이감을 줌.
- **Neon Glows**: 텍스트(`neon-text`)와 테두리(`neon-border`)에 그림자 효과를 사용하여 발광하는 느낌 구현.
- **Background**: `index.css`의 `body` 스타일에 Radial Gradient를 적용하여 은은한 네온 빛이 퍼지는 배경 연출.

### 3. 인터랙션 및 애니메이션
- **Animations**: `pulse-slow`(천천히 깜빡임), `float`(둥둥 떠다니는 효과) 등의 커스텀 애니메이션 정의.
- **Transitions**: Framer Motion을 사용하여 페이지 전환이나 요소 등장 시 부드러운 움직임 제공.

---

## 📂 프로젝트 구조 (Project Structure)

```
src/frontend/src
├── api/          # 백엔드 API 통신 로직
├── assets/       # 이미지, 폰트 등 정적 리소스
├── components/   # 재사용 가능한 UI 컴포넌트 (Button, Input, Layout 등)
├── hooks/        # 커스텀 React Hooks
├── lib/          # 유틸리티 함수 (예: utils.js - cn 함수 등)
├── pages/        # 라우트별 페이지 컴포넌트
│   ├── Landing.jsx   # 메인 랜딩 페이지
│   ├── Login.jsx     # 로그인 페이지
│   ├── Signup.jsx    # 회원가입 페이지
│   └── Dashboard.jsx # 사용자 대시보드
├── App.jsx       # 메인 앱 컴포넌트 (라우팅 및 Provider 설정)
├── main.jsx      # 앱 진입점 (Entry Point)
└── index.css     # 전역 스타일 및 Tailwind 디렉티브
```

### 주요 파일 설명
- **`App.jsx`**: `QueryClientProvider`로 앱을 감싸 서버 상태 관리를 설정하고, `BrowserRouter`를 통해 페이지 라우팅을 정의합니다.
- **`index.css`**: Tailwind 기본 설정(`@tailwind base/components/utilities`)과 커스텀 레이어(`@layer base`, `@layer components`)를 통해 테마 스타일과 스크롤바 커스터마이징이 포함되어 있습니다.

---

## 🚀 실행 방법 (How to Run)

터미널에서 `src/frontend` 디렉토리로 이동한 후 아래 명령어를 실행하십시오.

### 1. 패키지 설치
```bash
npm install
# 또는
yarn install
```

### 2. 개발 서버 실행
```bash
npm run dev
```
- 실행 후 터미널에 표시되는 로컬 주소(예: `http://localhost:5173`)로 접속하여 확인합니다.

### 3. 프로덕션 빌드
```bash
npm run build
```
- `dist/` 폴더에 최적화된 정적 파일이 생성됩니다.

### 4. 린트(Lint) 검사
```bash
npm run lint
```
- 코드 스타일 및 잠재적 오류를 검사합니다.
