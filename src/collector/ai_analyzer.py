import os
import json
from typing import Dict, Any, Optional, List
from openai import OpenAI

# Initialize client (ensure OPENAI_API_KEY is in env)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Use a cost-effective model as requested (closest to "nano/mini" concept)
MODEL_NAME = "gpt-4o-mini" 

SYSTEM_PROMPT = """You are a Cyber Security Analyst.
Your task is to analyze the provided security news text and extract structued threat intelligence.

You must output a JSON object with the following fields:
- type: Classify the threat (e.g., 'Phishing', 'Smishing', 'Malware', 'Ransomware', 'Credential Harvesting', 'Other').
- keywords: A list of 3-5 technical keywords related to the threat.
- lure_text: The specific phrase or sentence used to trick the victim (if any). If not found, summarize the threat mechanism.
- embedding_text: A summary string suitable for vector embedding (e.g. "Phishing attack targeting Netflix users via email...").

If the text is not about a specific threat or is irrelevant, return: {"is_threat": false}.
Otherwise, return fields with "is_threat": true.
"""

def analyze_threat(text: str) -> Dict[str, Any]:
    if not text or len(text) < 50:
        return {"is_threat": False, "reason": "Text too short"}

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Analyze this text:\n{text[:2000]}"} # Truncate for cost/token limits
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        content = response.choices[0].message.content
        result = json.loads(content)
        return result
        
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        return {"is_threat": False, "error": str(e)}

def get_embedding(text: str) -> Optional[List[float]]:
    try:
        response = client.embeddings.create(
            input=text,
            model="text-embedding-3-small"
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding Error: {e}")
        return None
