import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

/**
 * Get the current session
 * @returns {Promise<Session|null>}
 */
export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

/**
 * Get the current access token
 * @returns {Promise<string|null>}
 */
export async function getAccessToken() {
    const session = await getSession();
    return session?.access_token || null;
}

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export async function isAuthenticated() {
    const session = await getSession();
    return !!session;
}

/**
 * Sign in with email (magic link)
 * @param {string} email - User email
 * @returns {Promise<{data, error}>}
 */
export async function signInWithEmail(email) {
    return await supabase.auth.signInWithOtp({
        email,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });
}

/**
 * Sign in with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data, error}>}
 */
export async function signInWithPassword(email, password) {
    return await supabase.auth.signInWithPassword({
        email,
        password,
    });
}

/**
 * Sign up with email and password
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data, error}>}
 */
export async function signUp(email, password) {
    return await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
    });
}

/**
 * Sign out
 * @returns {Promise<{error}>}
 */
export async function signOut() {
    return await supabase.auth.signOut();
}

/**
 * Listen for auth state changes
 * @param {Function} callback 
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    return () => subscription.unsubscribe();
}

export default supabase;
