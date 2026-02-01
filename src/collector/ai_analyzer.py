import os
import json
from typing import Dict, Any, Optional, List
from json_repair import repair_json
from dotenv import load_dotenv

load_dotenv()

# LLM Provider Selection (gemini or openai)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()

# ============== Gemini Setup (New SDK) ==============
if LLM_PROVIDER == "gemini":
    from google import genai
    
    # Create client with API key
    gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    GEMINI_MODEL = "gemini-2.5-flash"

# ============== OpenAI Setup ==============
if LLM_PROVIDER == "openai":
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    OPENAI_MODEL = "gpt-4.1-mini"

SYSTEM_PROMPT = """<role>
당신은 고도로 숙련된 사이버 보안 분석가(Cyber Security Analyst)이자 위협 인텔리전스 전문가입니다. 비정형 보안 뉴스 및 보고서에서 핵심 위협 데이터를 식별하고 이를 기계 학습 및 DB 저장에 적합한 구조화된 데이터로 변환하는 데 특화되어 있습니다.
</role>

<context>
- 입력 데이터: 전 세계 보안 뉴스 기사, 취약점 공고, 보안 블로그 포스트 등.
- 목표: 제공된 텍스트에서 실제 보안 위협 요소를 판별하고, 지정된 스키마에 따라 위협 인텔리전스를 추출합니다.
- 지식 컷오프: 2025년 8월까지의 최신 보안 트렌드(Gemini 2.5 Flash 기준)를 반영하여 분석합니다.
</context>

<task>
다음 단계에 따라 보안 뉴스를 분석하십시오.
1. [판별]: 제공된 텍스트가 구체적인 사이버 보안 위협(공격 사례, 취약점, 악성 코드 배포 등)을 다루고 있는지 확인합니다.
2. [분류]: 위협의 유형을 'Phishing', 'Smishing', 'Malware', 'Ransomware', 'Credential Harvesting', 'Other' 중 하나로 분류합니다.
3. [추출]: 공격에 사용된 기술적 키워드(3~5개)와 피해자를 유혹하는 구문(Lure Text)을 추출합니다.
4. [요약]: 벡터 임베딩에 적합하도록 위협의 메커니즘을 1~2문장으로 기술합니다.
5. [검증]: 출력이 유효한 JSON 형식인지, 제약 조건을 위반하지 않았는지 최종 확인합니다.
</task>

<constraints>
- **형식 준수**: 오직 JSON 객체만 반환하십시오. 마크다운 백틱(```json ... ```)이나 서술형 텍스트를 절대 포함하지 마십시오.
- **위협 아님(False Positive)**: 텍스트가 특정 보안 위협과 관련 없거나 모호한 경우, 반드시 `{"is_threat": false}` 하나만 반환하십시오.
- **키워드**: 기술적 용어(예: CVE 번호, 프로토콜, 특정 라이브러리 명칭 등)를 우선적으로 포함하십시오.
- **언어**: embedding_text와 keywords는 글로벌 가독성을 위해 영어로 작성하는 것을 권장하나, 원문의 맥락에 따라 유연하게 대응하십시오.
</constraints>

<output_format>
{
  "is_threat": boolean,
  "type": "string",
  "keywords": ["string", "string", "string"],
  "lure_text": "string",
  "embedding_text": "string"
}
</output_format>"""


def analyze_threat(text: str) -> Dict[str, Any]:
    """Analyze threat text using configured LLM provider."""
    if not text or len(text) < 50:
        return {"is_threat": False, "reason": "Text too short"}

    try:
        if LLM_PROVIDER == "gemini":
            return _analyze_with_gemini(text)
        else:
            return _analyze_with_openai(text)
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        return {"is_threat": False, "error": str(e)}


def _analyze_with_gemini(text: str) -> Dict[str, Any]:
    """Analyze using Google Gemini (New SDK)."""
    prompt = f"{SYSTEM_PROMPT}\n\nAnalyze this text:\n{text[:2000]}"
    
    response = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "temperature": 0.1
        }
    )
    jsn_resp = repair_json(response.text)
    result = json.loads(jsn_resp)
    return result


def _analyze_with_openai(text: str) -> Dict[str, Any]:
    """Analyze using OpenAI."""
    response = openai_client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Analyze this text:\n{text[:2000]}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.1
    )
    jsn_resp = repair_json(response.choices[0].message.content)
    result = json.loads(jsn_resp)
    return result


def get_embedding(text: str) -> Optional[List[float]]:
    """Get embedding vector using configured provider."""
    try:
        if LLM_PROVIDER == "gemini":
            return _embedding_with_gemini(text)
        else:
            return _embedding_with_openai(text)
    except Exception as e:
        print(f"Embedding Error: {e}")
        return None


def _embedding_with_gemini(text: str) -> Optional[List[float]]:
    """Get embedding using Gemini (768 dimensions, New SDK)."""
    response = gemini_client.models.embed_content(
        model="text-embedding-004",
        contents=text
    )
    return response.embeddings[0].values


def _embedding_with_openai(text: str) -> Optional[List[float]]:
    """Get embedding using OpenAI."""
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding
