import os
import json
import asyncio
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

# Load environment variables from the root .env file
load_dotenv()

# Supabase Configuration
# Note: Ensure SUPABASE_URL and SUPABASE_KEY are set in your .env file
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Fallback for DATABASE_URL if user used the .env.example literally
    # But supabase-py needs URL and Key, not Connection String.
    # We will warn the user if these are missing.
    print("Error: SUPABASE_URL and SUPABASE_KEY are required in .env file.")
    print("Please populate them from your Supabase project settings.")
    # For the sake of the script not crashing immediately if just checking imports:
    # exit(1)

def get_supabase_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError("Supabase credentials missing.")
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# Mock Data Generator
def generate_mock_threats() -> List[Dict[str, Any]]:
    return [
        {
            "source_url": "https://example.com/phishing-alert-001",
            "raw_text": "Warning: Your account will be suspended. Click here to verify.",
            "analysis_json": {
                "type": "Credential Harvesting",
                "keywords": ["account suspension", "verify", "urgent"],
                "lure_text": "Your account will be suspended."
            },
            # Dummy embedding for pgvector (assuming 1536 dim if using openai, or whatever the schema uses. 
            # If schema allows null or has specific dim, we might need to adjust.
            # For now, we'll try to omit it or pass a simplified list if allowed, 
            # but usually vector fields require specific dimensions.
            # Checking DATA_MODEL.md, it says "embedding (Vector)". 
            # We will try to insert without embedding first or use a placeholder if required.
            # "embedding": [0.0] * 1536 
        },
        {
            "source_url": "https://example.com/fake-login-netflix",
            "raw_text": "Netflix Payment Failed. Update your payment details immediately.",
            "analysis_json": {
                "type": "Payment Fraud",
                "keywords": ["netflix", "payment failed", "update details"],
                "lure_text": "Update your payment details"
            }
        },
        {
            "source_url": "https://example.com/delivery-scam",
            "raw_text": "CJ Logistics: Package delivery failed due to wrong address.",
            "analysis_json": {
                "type": "Smishing",
                "keywords": ["delivery", "CJ Logistics", "wrong address"],
                "lure_text": "Package delivery failed"
            }
        }
    ]

async def insert_threats(client: Client, threats: List[Dict[str, Any]]):
    print(f"Attempting to insert {len(threats)} mock threats...")
    
    for threat in threats:
        try:
            # We add 'collected_at' here or let DB handle it if default is now()
            current_time = datetime.utcnow().isoformat()
            data = {
                "source_url": threat["source_url"],
                "raw_text": threat["raw_text"],
                "analysis_json": threat["analysis_json"],
                "collected_at": current_time
                # "embedding": threat.get("embedding") # omitted for MVP mock
            }
            
            response = client.table("threat_cases").insert(data).execute()
            print(f"Successfully inserted: {threat['source_url']}")
        except Exception as e:
            print(f"Failed to insert {threat['source_url']}: {e}")

async def main():
    try:
        client = get_supabase_client()
        mock_threats = generate_mock_threats()
        await insert_threats(client, mock_threats)
        print("Mock data insertion complete.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
