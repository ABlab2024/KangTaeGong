import { supabase, extractAction } from './utils/supabase.js';
import { getAuthenticatedUser, jsonResponse, errorResponse, handleOptions } from './utils/auth.js';
import { analyzeVulnerability, generateVulnerabilitySummary, augmentPreferences } from './utils/gemini.js';

export const handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return handleOptions();
    }

    const params = new URLSearchParams(event.queryStringParameters || {});
    const action = extractAction(event, 'survey');

    try {
        switch (action) {
            case 'categories':
                return await getCategories();
            case 'submit':
                return await submitSurvey(event);
            case 'augment':
                return await handleAugment(event);
            case 'vulnerability':
                return await getVulnerability(event, params);
            case 'status':
                return await getOnboardingStatus(event);
            case 'profile':
                return await getProfile(event);
            default:
                return errorResponse(400, 'Invalid action');
        }
    } catch (error) {
        console.error('Survey error:', error);
        return errorResponse(500, `Internal server error: ${error.message}`);
    }
};

/**
 * Get content categories grouped
 */
async function getCategories() {
    const { data: categories, error } = await supabase
        .from('content_categories')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        return errorResponse(500, 'Failed to fetch categories');
    }

    // Group by category_group
    const grouped = {};
    for (const cat of categories || []) {
        const group = cat.category_group || '기타';
        if (!grouped[group]) {
            grouped[group] = [];
        }
        grouped[group].push({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            category_group: cat.category_group,
        });
    }

    const result = Object.entries(grouped).map(([group, cats]) => ({
        group,
        categories: cats,
    }));

    return jsonResponse(200, result);
}

/**
 * Submit onboarding survey
 */
async function submitSurvey(event) {
    const user = await getAuthenticatedUser(event.headers);
    if (!user) {
        return errorResponse(401, 'Not authenticated');
    }

    const body = JSON.parse(event.body || '{}');
    const { age, age_group, gender, occupation, location, sns_homepage, recent_ai_link, content_preferences } = body;

    // Update user with age_group and gender
    if (age_group || gender) {
        await supabase
            .from('users')
            .update({ age_group, gender })
            .eq('id', user.id);
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

    const profileData = {
        user_id: user.id,
        age,
        occupation,
        location,
        sns_homepage,
        recent_ai_link,
        content_preferences: content_preferences || [],
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
    };

    let profile;
    if (existingProfile) {
        const { data, error } = await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('id', existingProfile.id)
            .select()
            .single();

        if (error) {
            return errorResponse(500, 'Failed to update profile');
        }
        profile = data;
    } else {
        const { data, error } = await supabase
            .from('user_profiles')
            .insert(profileData)
            .select()
            .single();

        if (error) {
            return errorResponse(500, 'Failed to create profile');
        }
        profile = data;
    }

    // Generate vulnerability analysis in background (async)
    generateVulnerabilityAnalysis(user.id, profileData).catch(console.error);

    return jsonResponse(200, {
        message: 'Survey submitted successfully',
        profile_id: profile.id,
        redirect_to: '/dashboard',
    });
}

/**
 * Generate and save vulnerability analysis
 */
async function generateVulnerabilityAnalysis(userId, profileData) {
    const analysis = await analyzeVulnerability(profileData);
    if (!analysis) return;

    const summary = await generateVulnerabilitySummary(analysis);

    await supabase
        .from('user_profiles')
        .update({
            vulnerability_analysis: analysis,
            vulnerability_summary: summary,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);
}

/**
 * Augment preferences with AI
 */
async function handleAugment(event) {
    const user = await getAuthenticatedUser(event.headers);
    if (!user) {
        return errorResponse(401, 'Not authenticated');
    }

    const body = JSON.parse(event.body || '{}');
    const { current_preferences, iteration } = body;

    if (!current_preferences || !Array.isArray(current_preferences)) {
        return errorResponse(400, 'current_preferences is required');
    }

    const newPreferences = await augmentPreferences(current_preferences, iteration || 0);

    // Update profile with augmented preferences
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('augmented_preferences, augmentation_count')
        .eq('user_id', user.id)
        .single();

    const existingAugmented = profile?.augmented_preferences || [];
    const allAugmented = [...new Set([...existingAugmented, ...newPreferences])];
    const newCount = (profile?.augmentation_count || 0) + 1;

    await supabase
        .from('user_profiles')
        .update({
            augmented_preferences: allAugmented,
            augmentation_count: newCount,
            updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

    return jsonResponse(200, {
        new_preferences: newPreferences,
        iteration: newCount,
        is_final: newCount >= 10,
    });
}

/**
 * Get vulnerability analysis
 */
async function getVulnerability(event, params) {
    const user = await getAuthenticatedUser(event.headers);
    if (!user) {
        return errorResponse(401, 'Not authenticated');
    }

    const refresh = params.get('refresh') === 'true';

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        return errorResponse(404, 'Profile not found');
    }

    // Generate new analysis if refresh or none exists
    if (refresh || !profile.vulnerability_analysis) {
        const analysis = await analyzeVulnerability(profile);
        if (analysis) {
            const summary = await generateVulnerabilitySummary(analysis);

            await supabase
                .from('user_profiles')
                .update({
                    vulnerability_analysis: analysis,
                    vulnerability_summary: summary,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);

            return jsonResponse(200, {
                vulnerability_analysis: analysis,
                vulnerability_summary: summary,
                refreshed: true,
            });
        }
    }

    return jsonResponse(200, {
        vulnerability_analysis: profile.vulnerability_analysis,
        vulnerability_summary: profile.vulnerability_summary,
        refreshed: false,
    });
}

/**
 * Get onboarding status
 */
async function getOnboardingStatus(event) {
    const user = await getAuthenticatedUser(event.headers);
    if (!user) {
        return errorResponse(401, 'Not authenticated');
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    return jsonResponse(200, {
        completed: profile?.onboarding_completed || false,
        profile: profile || null,
    });
}

/**
 * Get user profile
 */
async function getProfile(event) {
    const user = await getAuthenticatedUser(event.headers);
    if (!user) {
        return errorResponse(401, 'Not authenticated');
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!profile) {
        return jsonResponse(200, null);
    }

    return jsonResponse(200, {
        id: profile.id,
        user_id: profile.user_id,
        age: profile.age,
        occupation: profile.occupation,
        location: profile.location,
        content_preferences: profile.content_preferences || [],
        augmented_preferences: profile.augmented_preferences || [],
        vulnerability_analysis: profile.vulnerability_analysis,
        onboarding_completed: profile.onboarding_completed,
        augmentation_count: profile.augmentation_count || 0,
    });
}
