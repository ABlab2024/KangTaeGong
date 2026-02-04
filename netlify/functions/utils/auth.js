import jwt from 'jsonwebtoken';
import { supabase } from './supabase.js';

// Supabase JWT secret (from Supabase Dashboard > Settings > API)
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

/**
 * CORS headers for all responses
 */
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    };
}

/**
 * Create an error response
 */
export function errorResponse(statusCode, message) {
    return jsonResponse(statusCode, { detail: message });
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export function handleOptions() {
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: '',
    };
}

/**
 * Extract Supabase user ID from Authorization header
 * Uses Supabase's getUser() for proper verification
 * @param {object} headers - Request headers
 * @returns {Promise<{userId: string, email: string}|null>} User info or null
 */
export async function getSupabaseUser(headers) {
    const authHeader = headers.authorization || headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.substring(7);

    try {
        // Verify with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Supabase auth error:', error);
            return null;
        }

        return {
            supabaseUserId: user.id,
            email: user.email,
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Get or create app user from Supabase auth user
 * Syncs Supabase Auth user with our users table
 * @param {string} supabaseUserId - Supabase Auth user ID
 * @param {string} email - User email
 * @returns {Promise<object|null>} App user record
 */
export async function getOrCreateAppUser(supabaseUserId, email) {
    // First, try to find by supabase_user_id
    let { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('supabase_user_id', supabaseUserId)
        .single();

    if (!user) {
        // Try to find by email (for existing users before migration)
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (existingUser) {
            // Link existing user to Supabase auth
            const { data: updatedUser } = await supabase
                .from('users')
                .update({ supabase_user_id: supabaseUserId })
                .eq('id', existingUser.id)
                .select()
                .single();
            user = updatedUser || existingUser;
        } else {
            // Create new user
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                    email,
                    supabase_user_id: supabaseUserId,
                    hashed_password: null,
                    preferences: [],
                    security_score: 0,
                })
                .select()
                .single();

            if (insertError) {
                console.error('Failed to create user:', insertError);
                return null;
            }
            user = newUser;
        }
    }

    return user;
}

/**
 * Middleware to get authenticated user
 * Combines Supabase Auth verification with app user lookup
 * @param {object} headers - Request headers
 * @returns {Promise<object|null>} App user or null
 */
export async function getAuthenticatedUser(headers) {
    const supabaseUser = await getSupabaseUser(headers);
    if (!supabaseUser) {
        return null;
    }

    return await getOrCreateAppUser(supabaseUser.supabaseUserId, supabaseUser.email);
}

// Admin credentials (still needed for admin-specific functions)
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
