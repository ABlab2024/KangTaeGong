# Supabase + Netlify 서버리스 시작하기 (초보자 가이드)

이 문서는 별도의 백엔드 서버(FastAPI) 없이 **Supabase**와 **Netlify**만 사용하여 서비스를 운영하는 방법을 단계별로 설명합니다.

---

## 1. Supabase 설정 (데이터베이스 & 인증)

### [1단계] 프로젝트 생성
1. [Supabase](https://supabase.com/)에 로그인하고 **New Project**를 만듭니다.
2. **Database Password**는 안전하게 따로 기록해 두세요.

### [2단계] 테이블 생성 (SQL Editor 사용)
Supabase 대시보드의 **SQL Editor**에 다음 쿼리를 복사하여 실행하세요. 프론트엔드 코드와 호환되는 테이블 구조입니다.

```sql
-- 1. 사용자 프로필 테이블
create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  age integer,
  occupation text,
  location text,
  sns_homepage text,
  recent_ai_link text,
  content_preferences jsonb default '[]'::jsonb,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id)
);

-- 2. 콘텐츠 카테고리 테이블
create table public.content_categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  icon text,
  category_group text,
  display_order integer default 0
);

-- 3. 위협 사례(피싱 사례) 테이블
create table public.threat_cases (
  id uuid primary key default gen_random_uuid(),
  source_url text,
  raw_text text,
  analysis_json jsonb,
  collected_at timestamp with time zone default now()
);

-- 4. 시뮬레이션 로그 테이블
create table public.simulation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  threat_id uuid references public.threat_cases(id) on delete set null,
  event_type text not null, -- SENT, OPENED, CLICKED, SUBMITTED
  created_at timestamp with time zone default now()
);

-- RLS(보안 정책) 설정: 유저는 자신의 데이터만 보고 쓸 수 있게 합니다.
alter table public.user_profiles enable row level security;
alter table public.simulation_logs enable row level security;

create policy "유저는 자신의 프로필만 관리 가능" on public.user_profiles
  for all using (auth.uid() = user_id);

create policy "유저는 자신의 시뮬레이션 로그만 관리 가능" on public.simulation_logs
  for all using (auth.uid() = user_id);

create policy "모든 유저가 카테고리 조회 가능" on public.content_categories
  for select using (true);

create policy "모든 유저가 위협 사례 조회 가능" on public.threat_cases
  for select using (true);
```

---

## 2. 로컬 환경 설정 (VS Code)

### [1단계] 환경 변수 파일 작성
`src/frontend/.env` 파일을 만들고 Supabase 대시보드 (**Settings > API**)의 값을 넣습니다.
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### [2단계] 라이브러리 설치
`src/frontend` 디렉토리에서 실행: `npm install @supabase/supabase-js` (이미 수행됨)

---

## 3. Netlify 배포 설정

1. Netlify **Site configuration > Environment variables**에 위 `.env`의 두 값을 똑같이 등록합니다.
2. GitHub에 `push`하면 배포가 자동으로 진행됩니다.

---

## 4. AI 분석 기능 (OpenAI/Gemini 키 설정)

피싱 위협 분석이나 자동 답변 생성 등 AI 기능이 필요한 경우, 다음 경로에 API 키를 등록해야 합니다.

### [방법 A] 프론트엔드 직접 연동 (간단한 테스트)
*   `.env` 파일에 `VITE_OPENAI_API_KEY`를 추가합니다.
*   **주의**: 이 방식은 브라우저에서 키가 노출될 위험이 있으므로 데모용으로만 권장됩니다.

### [방법 B] Netlify Functions 활용 (보안 권장)
*   백엔드 서버 없이 보안이 필요한 작업을 할 때 유용합니다.
*   Netlify **Site configuration > Environment variables**에 `OPENAI_API_KEY`를 등록하세요.

---

## 5. Troubleshooting (문제 해결)
- **로그인 시 404 에러**: Netlify에 `_redirects` 파일이 정상적으로 배포되었는지 확인하세요.
- **데이터가 안 보임**: Supabase SQL Editor에서 위 쿼리를 실행했는지, RLS 정책이 적용되었는지 확인하세요.
