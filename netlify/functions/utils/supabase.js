import { createClient } from '@supabase/supabase-js';

// Supabase client for server-side operations (with service role key)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
}

export const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

export const getSupabaseClient = () => supabase;

/**
 * Extract action from request - supports both query params and path-based routing
 * Examples:
 *   - ?action=submit -> 'submit'
 *   - /api/v1/survey/submit -> 'submit'
 *   - /.netlify/functions/survey/submit -> 'submit'
 * @param {object} event - Netlify function event
 * @param {string} functionName - Name of the function (e.g., 'survey', 'auth')
 * @returns {string|null} The action name or null
 */
export function extractAction(event, functionName) {
    const params = new URLSearchParams(event.queryStringParameters || {});
    let action = params.get('action');

    // If no action in query params, extract from path
    if (!action && event.path) {
        const pathParts = event.path.split('/').filter(p => p);
        // Find the function name and get the next segment as action
        const funcIndex = pathParts.findIndex(p => p === functionName);
        if (funcIndex !== -1 && pathParts.length > funcIndex + 1) {
            action = pathParts[funcIndex + 1];
        }
    }

    return action;
}

