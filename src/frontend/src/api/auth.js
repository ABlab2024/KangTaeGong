import client from './client';
import { supabase, signInWithEmail, signInWithPassword, signUp, signOut, getSession } from '../lib/supabase';

export const authApi = {
    /**
     * 이메일 로그인 (Magic Link 방식)
     * Supabase Auth를 사용하여 로그인 링크를 이메일로 전송
     */
    loginWithMagicLink: async (email) => {
        const { data, error } = await signInWithEmail(email);
        if (error) throw error;
        return { message: 'Login link sent to your email', data };
    },

    /**
     * 이메일/비밀번호 로그인
     */
    loginWithEmail: async (email, ageGroup = null, gender = null) => {
        // First, try to sign in with email as password (for existing users)
        // or use a default password for simple login
        const { data: authData, error: authError } = await signInWithPassword(email, email);

        if (authError) {
            // If login fails, try to sign up
            const { data: signUpData, error: signUpError } = await signUp(email, email);
            if (signUpError) {
                // If both fail, use magic link
                const { error: magicError } = await signInWithEmail(email);
                if (magicError) throw magicError;
                return {
                    message: 'Login link sent to your email',
                    needs_email_confirmation: true,
                };
            }
        }

        // Sync with our app's user table
        const session = await getSession();
        if (session) {
            try {
                const response = await client.post('/auth?action=sync-user', {
                    age_group: ageGroup,
                    gender: gender,
                });
                return response.data;
            } catch (e) {
                console.error('Failed to sync user:', e);
                // Return basic info even if sync fails
                return {
                    email,
                    onboarding_completed: false,
                    redirect_to: '/onboarding',
                };
            }
        }

        return authData;
    },

    /**
     * 관리자 로그인
     */
    adminLogin: async (email, password) => {
        const response = await client.post('/admin?action=login', {
            email,
            password,
        });
        return response.data;
    },

    /**
     * 회원가입
     */
    register: async (email, password, fullName) => {
        const { data, error } = await signUp(email, password);
        if (error) throw error;
        return data;
    },

    /**
     * 로그아웃
     */
    logout: async () => {
        const { error } = await signOut();
        if (error) throw error;
        localStorage.removeItem('access_token');
        return { success: true };
    },

    /**
     * 현재 사용자 정보 조회
     */
    getMe: async () => {
        const response = await client.get('/users?action=me');
        return response.data;
    },

    /**
     * 세션 확인
     */
    getSession: async () => {
        return await getSession();
    },

    /**
     * 인증 상태 변경 리스너
     */
    onAuthStateChange: (callback) => {
        return supabase.auth.onAuthStateChange(callback);
    },
};
