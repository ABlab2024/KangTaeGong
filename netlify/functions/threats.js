import { supabase } from './utils/supabase.js';
import { jsonResponse, errorResponse, handleOptions } from './utils/auth.js';

export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleOptions();
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const skip = parseInt(params.get('skip') || '0');
    const limit = parseInt(params.get('limit') || '10');

    try {
        const { data: threats, error, count } = await supabase
            .from('threat_cases')
            .select('*', { count: 'exact' })
            .order('collected_at', { ascending: false })
            .range(skip, skip + limit - 1);

        if (error) {
            return errorResponse(500, 'Failed to fetch threats');
        }

        return jsonResponse(200, {
            threats: threats || [],
            total: count || 0,
            skip,
            limit,
        });
    } catch (error) {
        console.error('Threats error:', error);
        return errorResponse(500, 'Internal server error');
    }
};
