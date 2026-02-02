# 훈련 스케줄링 및 GitHub Actions 설정 가이드

이 문서는 KangTaeGong 프로젝트에서 훈련 스케줄이 생성되고 실행되는 과정과 GitHub Actions 설정 방법에 대해 설명합니다.

## 1. 전체 프로세스 개요

KangTaeGong은 서버리스 아키텍처(Render/Netlify)를 사용하므로, 백그라운드 작업을 위해 상시 실행되는 서버 대신 **GitHub Actions**를 활용하여 주기적으로 스케줄을 처리합니다.

### 작동 흐름
1. **스케줄 생성**: 관리자가 Admin 페이지에서 훈련 스케줄을 생성하면 `training_schedules` 테이블에 데이터가 저장됩니다. (상태: `is_sent = False`)
2. **주기적 실행**: GitHub Actions가 5분마다 (`cron: '*/5 * * * *'`) 워크플로우를 트리거합니다.
3. **스크립트 실행**: 워크플로우가 `src/backend/scripts/process_schedules.py` 스크립트를 실행합니다.
4. **발송 처리**:
   - DB에서 `scheduled_date`가 현재 시간(UTC)보다 과거이고, 아직 발송되지 않은(`is_sent = False`) 스케줄을 조회합니다.
   - 대상 사용자에게 이메일을 발송합니다.
   - 발송 성공 시 `is_sent = True`로 업데이트합니다.

---

## 2. GitHub Actions 설정 방법

이 기능이 정상적으로 작동하려면 GitHub Repository에 **환경 변수(Secrets)**가 설정되어 있어야 합니다.

### 2.1. 필요한 Secrets 목록
GitHub 저장소의 `Settings` > `Secrets and variables` > `Actions` > `New repository secret`에서 아래 값들을 추가해야 합니다.

| Secret Name | 설명 | 예시 값 |
|---|---|---|
| `DATABASE_URL` | Supabase 데이터베이스 연결 정보 (transaction pooler 권장) | `postgresql://postgres.[ref]:[pass]@aws-0-us-west-1.pooler.supabase.com:6543/postgres` |
| `SMTP_SERVER` | 이메일 발송 서버 (Gmail 등) | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP 포트 | `587` |
| `SMTP_USERNAME` | 발송 계정 이메일 | `example@gmail.com` |
| `SMTP_PASSWORD` | 앱 비밀번호 (일반 비밀번호 아님) | `abcd efgh ijkl mnop` |
| `EMAIL_FROM` | 발신자 주소 | `example@gmail.com` |
| `GEMINI_API_KEY` | (선택) 시나리오 생성 등에 필요 | `AIzaSy...` |

### 2.2. 워크플로우 파일 확인
설정 파일 위치: `.github/workflows/process_schedules.yml`

```yaml
name: Process Training Schedules

on:
  schedule:
    - cron: '*/5 * * * *'  # 5분마다 실행 (UTC 기준)
  workflow_dispatch:  # GitHub UI에서 수동 실행 버튼 활성화

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        # 백엔드 의존성 설치
        run: pip install -r src/backend/requirements.txt
      - name: Process schedules
        env:
          # Secrets를 환경 변수로 주입
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          SMTP_SERVER: ${{ secrets.SMTP_SERVER }}
          SMTP_PORT: ${{ secrets.SMTP_PORT }}
          SMTP_USERNAME: ${{ secrets.SMTP_USERNAME }}
          SMTP_PASSWORD: ${{ secrets.SMTP_PASSWORD }}
          EMAIL_FROM: ${{ secrets.EMAIL_FROM }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
        # 스케줄 처리 스크립트 실행
        run: python -m src.backend.scripts.process_schedules
```

---

## 3. 로컬 환경 테스트 방법

로컬 개발 환경에서는 GitHub Actions가 동작하지 않으므로, 스크립트를 직접 실행하여 테스트해야 합니다.

### 3.1. 1회 즉시 실행
```bash
# 가상환경 활성화 상태에서
python src/backend/scripts/process_schedules.py
```

### 3.2. 반복 실행 (개발용 스케줄러)
5분마다 반복 실행되는 로컬 스케줄러를 띄워두려면 아래 명령어를 사용합니다.
```bash
# 가상환경 활성화 상태에서
python src/backend/scripts/run_scheduler_local.py
```

---

## 4. 문제 해결 (Troubleshooting)

**Q. 스케줄 시간이 지났는데 메일이 안 와요.**
1. **GitHub Actions 탭 확인**: 해당 워크플로우가 실행되었는지, 실패(Red)했는지 확인하세요.
2. **DB 시간대 확인**: 코드는 **UTC**를 기준으로 합니다. 한국 시간(KST)으로 15:00에 예약했다면, UTC로는 06:00입니다. DB에 저장된 시간이 맞는지 확인하세요.
3. **Secrets 확인**: DB 연결 URL이나 SMTP 비밀번호가 만료되거나 변경되지 않았는지 확인하세요.
