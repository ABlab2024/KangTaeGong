# Netlify 배포 가이드 (KangTaeGong Frontend)

이 문서는 `src/frontend`에 위치한 React(Vite) 프로젝트를 Netlify에 배포하고, 발생할 수 있는 주요 에러를 해결하는 방법을 설명합니다.

## 1. 빌드 및 배포 구성 (가장 중요)

Netlify 대시보드 **Site configuration > Build & deploy**에서 다음 설정을 확인하세요. 이 설정이 틀리면 사이트가 하얀 화면으로 나오거나 MIME 타입 에러가 발생합니다.

*   **Base directory**: `src/frontend`
*   **Build command**: `npm run build`
*   **Publish directory**: `src/frontend/dist` 
    *   *주의: 반드시 `dist` 폴더가 포함되어야 합니다. `src/frontend`만 쓰면 안 됩니다.*

## 2. 자주 발생하는 에러 해결

### ❌ MIME type "application/octet-stream" 에러
브라우저 콘솔에 `Failed to load module script... MIME type "application/octet-stream"` 에러가 뜬다면?
*   **원인**: Netlify가 빌드된 결과물(`dist`)이 아닌 원본 소스 코드(`src`)를 그대로 서비스하려 할 때 발생합니다.
*   **해결**: 
    1. Netlify 설정의 **Publish directory**가 정확히 `src/frontend/dist`로 되어 있는지 확인하세요.
    2. 로컬에서 `npm run build`가 정상적으로 완료되는지 확인하고 다시 `git push` 하세요.

### ❌ 404 Not Found (페이지 새로고침 시)
인증 페이지나 대시보드에서 새로고침하면 404가 뜨는 경우:
*   **해결**: `src/frontend/public/_redirects` 파일이 존재하고 아래 내용이 들어있는지 확인하세요.
    ```text
    /*  /index.html  200
    ```

---

## 3. 간편 로그인 기능 (Email-only)

MVP 데모의 원활한 진행을 위해 **비밀번호 없는 로그인**을 지원하도록 업데이트했습니다.

1.  로그인 화면에서 **이메일 주소만 입력**하고 [인증 시작]을 누릅니다.
2.  해당 이메일로 자동 가입 및 로그인이 진행됩니다.
3.  비밀번호를 외울 필요 없이 즉시 강태공 기능을 테스트해 볼 수 있습니다.

---

## 4. 환경 변수 (Environment Variables)

Netlify 대시보드 **Site configuration > Environment variables**에 다음 값을 반드시 등록해야 합니다.

*   `VITE_SUPABASE_URL`: 여러분의 Supabase 프로젝트 URL
*   `VITE_SUPABASE_ANON_KEY`: Supabase API 키 (anon/public)
*   `OPENAI_API_KEY`: AI 분석을 위한 GPT API 키

---

설정 변경 후 **[Deploys]** 메뉴에서 **Trigger deploy > Clear cache and deploy site**를 클릭하여 다시 배포해 보시기 바랍니다.
