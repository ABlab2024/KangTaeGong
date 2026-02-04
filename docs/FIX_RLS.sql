-- 0. 기존 정책 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile details" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile details" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.user_profiles;

-- 1. users 테이블 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- users 정책: 누구나 읽기 가능 (public 프로필)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- users 정책: 본인만 수정 가능
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- users 정책: 본인만 생성 가능 (Trigger 실패 시 대비)
CREATE POLICY "Users can insert own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. user_profiles 테이블 RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- user_profiles 정책: 본인만 읽기 가능
CREATE POLICY "Users can view own profile details" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = user_id);

-- user_profiles 정책: 본인만 입력 가능
CREATE POLICY "Users can insert own profile details" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- user_profiles 정책: 본인만 수정 가능
CREATE POLICY "Users can update own profile details" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = user_id);
