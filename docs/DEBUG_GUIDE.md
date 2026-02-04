# 디버깅 가이드

서베이 제출 시 발생하는 401/500 에러 원인을 파악하기 위해 디버깅 엔드포인트를 추가했습니다.

## 헤더 확인 방법

1. 브라우저에서 아래 URL에 접속해 주세요:
   `https://kangtaegongmvp.netlify.app/api/v1/debug/headers`

2. JSON 응답이 보이면 내용을 복사해서 알려주세요.
   - 특히 `headers` 객체 안에 `authorization` 키가 있는지 확인이 필요합니다.
   
## 예상 원인
- Netlify Functions가 배포된 환경에서 `Authorization` 헤더가 제거되거나(`stripped`), 대소문자가 변경되어 전달될 수 있습니다.
- 이 정보를 확인하면 백엔드의 토큰 추출 로직을 환경에 맞게 수정할 수 있습니다.
