-- Supabase SQL Editor에서 실행하여 RLS 정책을 설정하세요.

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

-- 3. (옵션) 기존 정책 삭제 후 재생성하려면 아래 주석 해제 후 실행
/*
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile details" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile details" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile details" ON public.user_profiles;
*/
