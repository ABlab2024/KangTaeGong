import os
import json
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

load_dotenv()

# LLM Provider Selection (gemini or openai)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini").lower()

# ============== Gemini Setup ==============
if LLM_PROVIDER == "gemini":
    import google.generativeai as genai
    
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    
    # Use gemini-2.0-flash for cost efficiency
    gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# ============== OpenAI Setup ==============
if LLM_PROVIDER == "openai":
    from openai import OpenAI
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    OPENAI_MODEL = "gpt-4o-mini"

SYSTEM_PROMPT = """You are a Cyber Security Analyst.
Your task is to analyze the provided security news text and extract structured threat intelligence.

You must output a JSON object with the following fields:
- is_threat: boolean indicating if this is a security threat
- type: Classify the threat (e.g., 'Phishing', 'Smishing', 'Malware', 'Ransomware', 'Credential Harvesting', 'Other').
- keywords: A list of 3-5 technical keywords related to the threat.
- lure_text: The specific phrase or sentence used to trick the victim (if any). If not found, summarize the threat mechanism.
- embedding_text: A summary string suitable for vector embedding (e.g. "Phishing attack targeting Netflix users via email...").

If the text is not about a specific threat or is irrelevant, return: {"is_threat": false}.
Otherwise, return fields with "is_threat": true.

IMPORTANT: Return ONLY valid JSON, no markdown formatting."""


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
    """Analyze using Google Gemini."""
    prompt = f"{SYSTEM_PROMPT}\n\nAnalyze this text:\n{text[:2000]}"
    
    response = gemini_model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.1
        )
    )
    
    result = json.loads(response.text)
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
    
    content = response.choices[0].message.content
    result = json.loads(content)
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
    """Get embedding using Gemini."""
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text
    )
    return result['embedding']


def _embedding_with_openai(text: str) -> Optional[List[float]]:
    """Get embedding using OpenAI."""
    response = openai_client.embeddings.create(
        input=text,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding
