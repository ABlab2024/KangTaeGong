import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// axios 기반 client는 서버리스 전환을 위해 제거하거나 
// supabase로의 브릿지 역할을 하도록 남겨둘 수 있지만, 
// 직접 supabase를 사용하는 방식이 더 효율적입니다.
export default supabase;
