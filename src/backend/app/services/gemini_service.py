"""
Gemini Service for KangTaeGong MVP.
Provides LLM-powered preference augmentation, vulnerability analysis, and scenario generation.
Uses the new google-genai SDK.
"""
import logging
from typing import List, Optional
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger(__name__)


# Initialize Gemini client
client = genai.Client(api_key=settings.GEMINI_API_KEY)
MODEL_ID = "gemini-2.5-flash"


from json_repair import repair_json

class GeminiService:
    def __init__(self):
        self.client = client
        self.model = MODEL_ID

    async def augment_preferences(
        self,
        user_preferences: List[str],
        age_group: str,
        occupation: str,
        iteration: int
    ) -> List[str]:
        # ... (keep existing implementation)
        """사용자 취향을 분석하여 관련 취향을 추천합니다."""
        prompt = f"""
당신은 피싱/스캠 예방 훈련 시스템의 AI 어시스턴트입니다.
사용자의 현재 취향 정보를 바탕으로 관련된 새로운 관심사를 3개 추천해주세요.

사용자 정보:
- 연령대: {age_group}
- 직업: {occupation}
- 현재 선택한 취향: {', '.join(user_preferences)}
- 증강 반복 횟수: {iteration}/10

규칙:
1. 이미 선택된 취향과 중복되지 않는 새로운 관심사만 추천
2. 해당 연령대와 직업에서 실제로 관심을 가질 만한 현실적인 취향
3. 피싱/스캠 시나리오에 활용될 수 있는 관심사 포함 (예: 재테크, 쇼핑, 택배 등)
4. 응답은 쉼표로 구분된 3개의 취향만 출력 (예: "여행, 재테크, 건강")

추천할 3개의 새로운 취향:
"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.8,
                    max_output_tokens=100
                )
            )
            result_text = response.text.strip()
            # Parse comma-separated preferences
            new_prefs = [p.strip() for p in result_text.split(',') if p.strip()]
            return new_prefs[:3]
        except Exception as e:
            logger.error(f"Gemini augment error: {e}")
            return []

    async def analyze_vulnerability(
        self,
        user_preferences: List[str],
        augmented_preferences: List[str],
        age_group: str,
        occupation: str,
        location: str
    ) -> str:
        # ... (keep existing implementation)
        """사용자 프로필을 분석하여 피싱/스캠 취약점을 분석합니다."""
        all_prefs = user_preferences + augmented_preferences
        prompt = f"""
당신은 사이버 보안 전문가입니다. 아래 사용자의 프로필을 분석하여 피싱/스캠에 취약할 수 있는 포인트를 상세히 분석해주세요.

## 사용자 프로필
- 연령대: {age_group}
- 직업: {occupation}
- 거주지: {location}
- 관심 분야: {', '.join(all_prefs)}

## 분석 요청사항
1. **취약 유형 분석**: 이 사용자가 특히 취약할 수 있는 피싱/스캠 유형 3가지
2. **위험 시나리오**: 각 유형별로 실제로 당할 수 있는 구체적인 시나리오
3. **주의사항**: 이 사용자가 특별히 주의해야 할 점
4. **예방 팁**: 맞춤형 예방 방법 3가지

마크다운 형식으로 상세하게 작성해주세요.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=1500
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini vulnerability analysis error: {e}")
            return "취약점 분석을 수행할 수 없습니다. 나중에 다시 시도해주세요."

    async def generate_phishing_scenario(
        self,
        user_preferences: List[str],
        scenario_type: str = "email",
        source_url: Optional[str] = None
    ) -> dict:
        """사용자 취향 기반 피싱 시나리오를 생성합니다."""
        source_context = f"\n참고할 실제 피해 사례 URL: {source_url}" if source_url else ""
        prompt = f"""
당신은 피싱 예방 훈련용 시나리오 작성자입니다.
아래 정보를 바탕으로 교육용 피싱 {scenario_type} 시나리오를 생성해주세요.

## 타겟 사용자 관심사
{', '.join(user_preferences)}
{source_context}

## 요청사항
훈련용 피싱 이메일을 작성해주세요. 다음 JSON 형식으로 응답:
{{
    "name": "시나리오 이름",
    "description": "시나리오 설명",
    "difficulty": "easy/medium/hard 중 하나",
    "subject": "이메일 제목",
    "sender_name": "발신자 이름",
    "body": "이메일 본문 (HTML 형식, {{link}} 자리표시자 포함)",
    "red_flags": ["의심 포인트1", "의심 포인트2", "의심 포인트3"]
}}

주의: 이것은 100% 교육 목적이며, 실제 피해를 발생시키지 않습니다.
반드시 JSON 형식만 출력하세요. 마크다운이나 다른 설명은 생략하세요.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.9,
                    max_output_tokens=2000,
                    response_mime_type="application/json",
                    safety_settings=[
                        types.SafetySetting(
                            category="HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_HARASSMENT",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_HATE_SPEECH",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold="BLOCK_NONE"
                        ),
                    ]
                )
            )
            
            # Log the raw response for debugging
            raw_text = response.text if response.text else ""
            logger.info(f"Gemini phishing scenario response length: {len(raw_text)}")
            
            if not raw_text:
                logger.warning("Gemini returned empty response for phishing scenario.")
                return None
            
            # Use repair_json for robust parsing
            parsed_json = repair_json(raw_text, return_objects=True)
            
            # Validate required fields
            if not isinstance(parsed_json, dict):
                logger.error(f"Parsed JSON is not a dict: {type(parsed_json)}")
                return None
                
            required_fields = ["name", "subject", "body"]
            missing_fields = [f for f in required_fields if not parsed_json.get(f)]
            if missing_fields:
                logger.warning(f"Missing or empty required fields: {missing_fields}")
            
            return parsed_json
            
        except Exception as e:
            logger.error(f"Gemini scenario generation error: {e}")
            return None

    async def generate_scenario_from_text(
        self,
        context_text: str,
        scenario_type: str = "email"
    ) -> dict:
        """텍스트 컨텍스트(뉴스 또는 프롬프트)를 기반으로 시나리오를 생성합니다."""
        prompt = f"""
당신은 피싱 예방 훈련용 시나리오 작성자입니다.
아래 제공된 컨텍스트(뉴스 기사 또는 사용자 요청)를 바탕으로 실제와 유사한 피싱 {scenario_type} 시나리오를 생성해주세요.

## 컨텍스트
{context_text}

## 요청사항
훈련용 피싱 이메일을 작성해주세요. 다음 JSON 형식으로 응답:
{{
    "name": "시나리오 이름",
    "description": "시나리오 설명 (어떤 기사/요청을 기반으로 했는지 포함)",
    "difficulty": "medium",
    "subject": "이메일 제목",
    "sender_name": "발신자 이름",
    "body": "이메일 본문 (HTML 형식, {{link}} 자리표시자 포함)",
    "red_flags": ["의심 포인트1", "의심 포인트2", "의심 포인트3"]
}}

주의: 이것은 100% 교육 목적이며, 실제 피해를 발생시키지 않습니다.
반드시 JSON 형식만 출력하세요. 마크다운이나 다른 설명은 생략하세요.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.9,
                    max_output_tokens=2000,
                    response_mime_type="application/json",
                    safety_settings=[
                        types.SafetySetting(
                            category="HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_HARASSMENT",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_HATE_SPEECH",
                            threshold="BLOCK_NONE"
                        ),
                        types.SafetySetting(
                            category="HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold="BLOCK_NONE"
                        ),
                    ]
                )
            )
            
            # Log the raw response for debugging
            raw_text = response.text if response.text else ""
            logger.info(f"Gemini raw response length: {len(raw_text)}")
            
            if not raw_text:
                logger.warning("Gemini returned empty response. May be blocked by safety filters.")
                # Check if blocked by safety
                if hasattr(response, 'candidates') and response.candidates:
                    for candidate in response.candidates:
                        if hasattr(candidate, 'finish_reason'):
                            logger.warning(f"Finish reason: {candidate.finish_reason}")
                return None
            
            # Use repair_json for robust parsing
            parsed_json = repair_json(raw_text, return_objects=True)
            
            # Validate required fields
            if not isinstance(parsed_json, dict):
                logger.error(f"Parsed JSON is not a dict: {type(parsed_json)}")
                return None
                
            required_fields = ["name", "subject", "body"]
            missing_fields = [f for f in required_fields if not parsed_json.get(f)]
            if missing_fields:
                logger.warning(f"Missing or empty required fields: {missing_fields}")
                logger.debug(f"Parsed JSON keys: {parsed_json.keys()}")
            
            return parsed_json

        except Exception as e:
            logger.error(f"Gemini text scenario generation error: {e}")
            return None

    async def generate_dummy_page_html(
        self,
        scenario_type: str,
        target_preferences: List[str]
    ) -> str:
        """피싱 훈련용 더미 페이지 HTML을 생성합니다."""
        prompt = f"""
피싱 예방 훈련용 더미 웹페이지 HTML을 생성해주세요.

시나리오 유형: {scenario_type}
타겟 관심사: {', '.join(target_preferences)}

요구사항:
1. 실제 피싱 페이지처럼 보이는 로그인/입력 폼
2. 반응형 디자인
3. 폼 제출 시 /api/v1/track/submit/{{simulation_id}} 로 POST 요청
4. 교육 목적임을 나타내는 숨겨진 주석

HTML 코드만 출력하세요.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.8,
                    max_output_tokens=3000
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini dummy page generation error: {e}")
            return "<html><body><h1>훈련 페이지 생성 실패</h1></body></html>"


# Singleton instance
gemini_service = GeminiService()
