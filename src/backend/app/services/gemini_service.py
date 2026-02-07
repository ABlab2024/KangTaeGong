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
        """사용자 프로필을 분석하여 피싱/스캠 취약점을 분석합니다."""
        all_prefs = user_preferences + augmented_preferences
        prefs_list = '\n'.join([f"- {pref}" for pref in all_prefs]) if all_prefs else "- (관심사 없음)"
        
        prompt = f"""당신은 피싱/스캠 예방 전문 사이버 보안 분석가입니다. 
아래 사용자의 프로필과 관심사를 분석하여, **각 관심사가 어떤 피싱/스캠 공격에 취약해질 수 있는지** 구체적으로 분석해주세요.

## 사용자 프로필
- **연령대**: {age_group}
- **직업**: {occupation}
- **거주지**: {location}

## 사용자가 선택한 관심사
{prefs_list}

---

## 분석 요청사항

### 1. 관심사별 피싱/스캠 취약점 분석
각 관심사를 기반으로 사용자가 노출될 수 있는 피싱/스캠 유형을 분석해주세요. 예를 들어:
- "쇼핑" 관심 → 가짜 쇼핑몰, 배송 피싱, 결제 사기
- "재테크" 관심 → 투자 사기, 가짜 주식/코인 앱, 고수익 미끼
- "게임" 관심 → 게임 아이템 사기, 계정 탈취, 무료 아이템 피싱
- "취업" 관심 → 가짜 채용공고, 이력서 개인정보 탈취

### 2. 사용자에게 가장 위험한 피싱 시나리오 TOP 3
이 사용자가 실제로 속기 쉬운 구체적인 피싱 시나리오를 3가지 제시해주세요.
각 시나리오에는 다음을 포함:
- 받을 수 있는 메시지/이메일 예시 (한두 문장)
- 왜 이 사용자가 속기 쉬운지 설명
- 빨간 신호(Red Flag)가 무엇인지

### 3. 맞춤형 예방 수칙
이 사용자가 특히 주의해야 할 점과 실천 가능한 예방 방법 3-5가지를 제시해주세요.

---

마크다운 형식으로 읽기 쉽게 작성해주세요. 이모지를 적절히 활용하고, 중요한 부분은 **굵게** 표시해주세요.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7,
                    max_output_tokens=4000
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini vulnerability analysis error: {e}")
            return "취약점 분석을 수행할 수 없습니다. 나중에 다시 시도해주세요."

    async def summarize_vulnerability_analysis(
        self,
        full_analysis: str,
        user_preferences: List[str]
    ) -> str:
        """상세 취약점 분석을 3-4문장의 핵심 요약으로 변환합니다."""
        prefs_text = ', '.join(user_preferences) if user_preferences else "일반"
        
        prompt = f"""당신은 사이버 보안 전문가입니다. 아래의 상세 취약점 분석을 사용자가 대시보드에서 한 눈에 파악할 수 있도록 **핵심만 담은 3-4문장 요약**으로 작성해주세요.

## 사용자 관심사
{prefs_text}

## 상세 분석
{full_analysis}

---

## 요약 작성 규칙
1. **첫 문장**: 이 사용자가 가장 취약한 피싱/스캠 유형 2-3개를 명확히 언급
2. **두 번째 문장**: 왜 취약한지 관심사와 연결하여 설명
3. **세 번째 문장**: 가장 주의해야 할 구체적인 공격 패턴 설명
4. **네 번째 문장 (선택)**: 핵심 예방 수칙

## 출력 형식
- 이모지 사용 금지
- 마크다운 형식 사용 금지
- 순수 텍스트로 3-4문장 출력
- 각 문장을 완전하게 작성 (중간에 자르지 않음)
"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.5,
                    max_output_tokens=500
                )
            )
            summary = response.text.strip()
            return summary
        except Exception as e:
            logger.error(f"Gemini vulnerability summary error: {e}")
            return None

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
    "body": "이메일 본문 (HTML 형식, 아래 placeholder 사용)",
    "red_flags": ["의심 포인트1", "의심 포인트2", "의심 포인트3"]
}}

## 본문 작성 시 사용 가능한 Placeholder (개인화용)
- {{name}}: 수신자 이름
- {{location}}: 수신자 거주지역
- {{occupation}}: 수신자 직업
- {{preferences}}: 수신자 관심사
- {{link}}: 피싱 링크 (필수 포함)

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
    "body": "이메일 본문 (HTML 형식, 아래 placeholder 사용)",
    "red_flags": ["의심 포인트1", "의심 포인트2", "의심 포인트3"]
}}

## 본문 작성 시 사용 가능한 Placeholder (개인화용)
- {{name}}: 수신자 이름
- {{location}}: 수신자 거주지역
- {{occupation}}: 수신자 직업
- {{preferences}}: 수신자 관심사
- {{link}}: 피싱 링크 (필수 포함)

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
        prompt = f"""피싱 예방 훈련용 더미 웹페이지 HTML을 생성해주세요.

시나리오: {scenario_type}
컨텍스트: {', '.join(target_preferences)}

요구사항:
1. 실제 유명 서비스의 로그인 페이지처럼 보이는 전문적인 디자인
2. 로그인 폼 포함 (이메일/아이디, 비밀번호 필드)
3. 반응형 디자인 (모바일 호환)
4. 세련된 CSS 스타일 (그라데이션, 그림자, 깔끔한 버튼)
5. 폼에 action="javascript:void(0)" method="POST" 속성 포함
6. 모든 CSS는 인라인 또는 <style> 태그 내부에
7. 외부 리소스(이미지, 폰트 등) 사용 금지 - 순수 HTML/CSS만

중요: 
- HTML 코드만 출력하세요. 마크다운 코드블록(```)이나 설명 없이 순수 HTML만 출력하세요.
- <!DOCTYPE html>로 시작하는 완전한 HTML 문서를 출력하세요.
- JavaScript 트래킹 코드는 서버에서 자동 삽입되므로 포함하지 마세요.
"""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.8,
                    max_output_tokens=4000,
                    safety_settings=[
                        types.SafetySetting(
                            category="HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold="BLOCK_NONE"
                        ),
                    ]
                )
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini dummy page generation error: {e}")
            return "<html><body><h1>훈련 페이지 생성 실패</h1></body></html>"


# Singleton instance
gemini_service = GeminiService()
