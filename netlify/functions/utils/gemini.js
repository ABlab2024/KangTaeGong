import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate content using Gemini AI
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string|null>} Generated text or null on error
 */
export async function generateContent(prompt) {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Gemini API error:', error);
        return null;
    }
}

/**
 * Analyze user vulnerability based on preferences and profile
 * @param {object} profile - User profile data
 * @returns {Promise<string|null>} Vulnerability analysis text
 */
export async function analyzeVulnerability(profile) {
    const { age, occupation, location, content_preferences } = profile;

    const prompt = `
당신은 피싱/스캠 보안 전문가입니다. 아래 사용자 프로필을 분석하여 피싱/스캠 취약점을 분석해주세요.

사용자 프로필:
- 나이: ${age || '미제공'}
- 직업: ${occupation || '미제공'}
- 위치: ${location || '미제공'}
- 관심 콘텐츠: ${content_preferences?.join(', ') || '미제공'}

분석 결과를 다음 형식으로 작성해주세요:
1. 주요 취약점 (3-5개)
2. 주의해야 할 피싱/스캠 유형
3. 맞춤형 보안 권장사항

마크다운 형식으로 작성해주세요.
`;

    return await generateContent(prompt);
}

/**
 * Generate a vulnerability summary from detailed analysis
 * @param {string} analysis - Full vulnerability analysis
 * @returns {Promise<string|null>} Short summary
 */
export async function generateVulnerabilitySummary(analysis) {
    const prompt = `
다음 피싱/스캠 취약점 분석을 1-2문장으로 요약해주세요. 핵심 취약점만 간단히 언급해주세요.

분석:
${analysis}

요약:
`;

    return await generateContent(prompt);
}

/**
 * Generate a phishing scenario based on user preferences
 * @param {string[]} preferences - User content preferences
 * @param {string} [sourceUrl] - Optional source URL for reference
 * @returns {Promise<object|null>} Generated scenario object
 */
export async function generatePhishingScenario(preferences, sourceUrl = null) {
    const prompt = `
당신은 피싱 훈련 시나리오를 생성하는 보안 전문가입니다.
사용자의 관심사를 기반으로 현실적인 피싱 이메일 시나리오를 생성해주세요.

사용자 관심사: ${preferences.join(', ')}
${sourceUrl ? `참고 URL: ${sourceUrl}` : ''}

다음 JSON 형식으로 응답해주세요:
{
    "name": "시나리오 이름",
    "description": "시나리오 설명",
    "scenario_type": "email",
    "difficulty": "medium",
    "subject": "이메일 제목",
    "body_template": "이메일 본문 (HTML)",
    "sender_name": "발신자 이름"
}

JSON만 응답해주세요.
`;

    const result = await generateContent(prompt);
    if (!result) return null;

    try {
        // Extract JSON from response
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (error) {
        console.error('Failed to parse scenario JSON:', error);
    }
    return null;
}

/**
 * Augment user preferences using AI
 * @param {string[]} currentPreferences - Current preferences
 * @param {number} iteration - Iteration count
 * @returns {Promise<string[]>} Augmented preferences
 */
export async function augmentPreferences(currentPreferences, iteration) {
    const prompt = `
사용자의 현재 관심사 목록입니다: ${currentPreferences.join(', ')}

이 관심사와 연관된 새로운 키워드 5개를 추천해주세요.
기존 키워드와 중복되지 않고, 피싱/스캠에 취약할 수 있는 관심사 영역을 고려해주세요.

형식: 키워드1, 키워드2, 키워드3, 키워드4, 키워드5
`;

    const result = await generateContent(prompt);
    if (!result) return [];

    return result.split(',').map(s => s.trim()).filter(s => s.length > 0);
}
