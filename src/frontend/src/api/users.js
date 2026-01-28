/**
 * User API client
 */
import client from './client';

/**
 * Get current user info
 */
export const getCurrentUser = async () => {
    const response = await client.get('/users/me');
    return response.data;
};

/**
 * Get user ranking and defense stats
 */
export const getUserRanking = async () => {
    const response = await client.get('/users/ranking');
    return response.data;
};
