/**
 * User API client (Netlify Functions)
 */
import client from './client';

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
    const response = await client.get('/users?action=me');
    return response.data;
};

/**
 * Update current user info
 */
export const updateCurrentUser = async (data) => {
    const response = await client.put('/users?action=update', data);
    return response.data;
};

/**
 * Get user ranking and defense stats
 */
export const getUserRanking = async () => {
    const response = await client.get('/users?action=ranking');
    return response.data;
};
