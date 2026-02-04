-- Supabase SQL Editor에서 실행하세요.
-- auth.users에 새 유저가 가입하면 자동으로 public.users에도 레코드를 생성하는 트리거입니다.

-- 1. 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 연결 (이미 존재하면 삭제 후 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. (선택사항) 기존에 가입했지만 public.users에 없는 유저들 강제 동기화 (이메일 중복 제외)
INSERT INTO public.users (id, email)
SELECT id, email
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.email = au.email
)
ON CONFLICT (id) DO NOTHING;
