# Netlify 배포 가이드 (KangTaeGong Frontend)

이 문서는 `src/frontend`에 위치한 React(Vite) 프로젝트를 Netlify에 배포하고, API 프록시를 설정하는 방법을 설명합니다.

## 1. 사전 준비
*   **GitHub 저장소**: 코드가 GitHub에 업로드되어 있어야 합니다.
*   **백엔드 주소**: Render 등에 배포된 API 서버의 URL이 필요합니다. (예: `https://kangtaegong-backend.onrender.com`)

## 2. Netlify 배포 단계

### 단계 1: Netlify 로그인 및 저장소 연결
1. [Netlify](https://www.netlify.com/)에 로그인합니다.
2. **Add new site** > **Import an existing project**를 클릭합니다.
3. **GitHub**를 선택하고 `KangTaeGong` 프로젝트가 포함된 저장소를 선택합니다.

### 단계 2: 빌드 설정 및 사이트 구성
저장소를 선택하면 설정 화면이 나타납니다. 다음과 같이 입력합니다.

*   **Base directory**: `src/frontend`
*   **Build command**: `npm run build`
*   **Publish directory**: `src/frontend/dist` (Vite 기본값인 `dist`가 `src/frontend` 내부에 생성되므로 중요합니다)

### 단계 3: 배포 실행
1. 아래의 **Deploy [Site Name]** 버튼을 클릭합니다.
2. 빌드가 성공하면 사이트 URL이 생성됩니다.

---

## 3. 핵심 설정: API 및 라우팅 (`_redirects` 파일)

프론트엔드 코드 내 `client.js`에서 `/api/v1` 경로를 사용하고 있으므로, Netlify에서 이 요청을 백엔드로 전달(Proxy)해줘야 합니다.

`src/frontend/public/_redirects` 파일이 다음과 같이 작성되어 있는지 확인하세요. (이미 생성해두었습니다)

```text
# API 프록시 설정 (백엔드 주소로 변경 필요)
/api/*  https://your-backend-url.onrender.com/api/:splat  200

# SPA 라우팅 설정
/*      /index.html                                     200
```

**주의**: `https://your-backend-url.onrender.com` 부분을 실제 Render 배포 주소로 수정하여 다시 `git push` 하셔야 API 통신이 정상적으로 작동합니다.

## 4. 브랜치 배포 (Branch Deployment)

Netlify는 특정 브랜치만 배포하거나, 여러 브랜치를 동시에 배포하는 기능을 제공합니다.

### 프로덕션 브랜치 (Production Branch)
*   기본적으로 `main` 브랜치가 연결되어 있으며, 이 브랜치에 `push`하면 메인 도메인에 즉시 반영됩니다.

### 특정 브랜치 배포 설정
1.  Netlify 대시보드에서 **Site configuration** > **Build & deploy** > **Branches**로 이동합니다.
2.  **Branch deploys** 섹션에서 설정을 변경할 수 있습니다:
    *   **All**: 모든 브랜치를 배포합니다.
    *   **Individual branches**: 특정 브랜치(예: `dev`, `feature-auth`)만 선택해서 배포합니다.
3.  배포된 브랜치는 `https://branch-name--site-name.netlify.app` 형태의 고유 URL을 갖게 됩니다.

### Pull Request 프리뷰 (Deploy Previews)
*   GitHub에서 PR을 생성하면 Netlify가 자동으로 해당 변경 사항을 빌드하여 별도의 프리뷰 URL을 제공합니다. 코드를 합치기 전에 미리 확인하기에 매우 유용합니다.

## 5. 유의 사항
... (중략)
