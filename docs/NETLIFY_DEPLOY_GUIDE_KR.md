# Netlify 배포 가이드 (KangTaeGong)

이 가이드는 `KangTaeGong` 프로젝트의 프론트엔드(`src/frontend`)를 Netlify에 배포하는 방법을 설명합니다.

## 방법 1: Netlify 웹사이트에서 GitHub 연동 (권장)

가장 간편하고 지속적인 배포(CI/CD)가 가능한 방법입니다.

1. **Netlify 로그인**: [Netlify](https://www.netlify.com/)에 접속하여 로그인합니다.
2. **새 사이트 추가**: 대시보드에서 `Add new site` > `Import from existing project`를 클릭합니다.
3. **Git 제공자 연결**: `GitHub`를 선택하고 권한을 승인합니다.
4. **저장소 선택**: `KangTaeGong` 저장소를 검색하여 선택합니다.
5. **배포 설정 (Build settings)**:
   - **Base directory**: `src/frontend`
     - (중요: 프로젝트가 monorepo 구조이므로 프론트엔드 폴더를 지정해야 합니다.)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
     - (`src/frontend` 기준 상대 경로입니다. 즉, `src/frontend/dist`가 됩니다.)
6. **환경 변수 설정 (Environment variables)**:
   - `Show advanced`를 클릭하고 `New variable`을 눌러 필요한 환경 변수를 추가합니다.
   - 예: `VITE_API_URL` 등 (백엔드 `Render` 주소).
7. **Deploy site**: 버튼을 눌러 배포를 시작합니다.

## 방법 2: `netlify.toml` 파일 설정 (Configuration as Code)

프로젝트 루트의 `netlify.toml` 파일을 사용하여 설정을 관리할 수 있습니다. 현재 루트에 있는 `netlify.toml`은 Python 백엔드용으로 보이므로, 프론트엔드 배포를 위해 아래와 같이 수정하는 것을 권장합니다.

**수정된 `netlify.toml` 예시:**

```toml
[build]
  # 프론트엔드 소스 위치
  base = "src/frontend"
  # 빌드 결과물이 나오는 위치 (base 기준 상대 경로)
  publish = "dist"
  # 빌드 명령어
  command = "npm run build"

# SPA(Single Page Application) 라우팅 처리를 위한 리다이렉트
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

이 파일을 수정하여 `test-jw2` 브랜치에 푸시하면, Netlify가 설정을 자동으로 인식합니다.

## 참고 사항

- **백엔드**: 현재 구조상 백엔드(`src/backend`)는 Netlify보다는 Render나 Railway 같은 서비스에 배포하는 것이 일반적입니다. (Netlify는 주로 정적 사이트 + 서버리스 함수용)
- **프록시**: 로컬 개발(`vite.config.js`)에 설정된 `/api` 프록시는 배포 환경에서 작동하지 않습니다. 배포 시에는 백엔드 URL을 환경 변수(`VITE_...`)로 주입하고, API 호출 코드가 이를 사용하도록 되어 있는지 확인해야 합니다.
