/**
 * Simulation API client (Netlify Functions)
 */
import client from './client';

/**
 * Get available phishing scenarios
 */
export const getScenarios = async () => {
    const response = await client.get('/simulation?action=scenarios');
    return response.data;
};

/**
 * Send a phishing simulation email
 * @param {Object} params
 * @param {string} params.scenario - Scenario type (password_reset, payment_receipt, delivery_notice)
 * @param {string} [params.threat_id] - Optional threat case ID
 * @param {string} [params.custom_subject] - Optional custom subject
 * @param {string} [params.custom_message] - Optional custom message
 */
export const sendSimulation = async (params) => {
    const response = await client.post('/simulation?action=send', params);
    return response.data;
};

/**
 * Get user simulation statistics
 */
export const getSimulationStats = async () => {
    const response = await client.get('/simulation?action=stats');
    return response.data;
};

/**
 * Get threat intelligence feed
 * @param {number} [skip=0] - Number of items to skip
 * @param {number} [limit=10] - Number of items to fetch
 */
export const getThreats = async (skip = 0, limit = 10) => {
    const response = await client.get(`/threats?skip=${skip}&limit=${limit}`);
    return response.data;
};
