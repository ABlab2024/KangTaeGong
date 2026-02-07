
import asyncio
import httpx
import os
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

async def test_scenario_generation():
    base_url = "http://localhost:8002/api/v1"
    
    # login first
    # Assuming there is an admin user. If not, this might fail.
    # We'll try to find an admin or just rely on a known one?
    # For now let's try to just hit the endpoint if we have a token or bypass auth for testing?
    # Use the logic from admin.js login
    
    # Actually, I need to know a valid admin credential.
    # If I can't login, I can't test.
    # Let's assume there is a seed script or I can create one.
    
    print("Testing Scenario Generation API...")
    
    # We can try to use dependency override or just mock the user if running closely.
    # But since this is an external script hitting the API, we need real creds.
    
    # Let's try to create a scenario directly using the service instead of full API if API testing is hard without auth.
    # But API testing is better.
    
    # Check if we can create a simulation directly via service?
    # No, let's use the service test I used before.
    
    from app.services.gemini_service import gemini_service
    from app.db.session import AsyncSessionLocal
    from app.models.threat_case import ThreatCase
    from sqlalchemy import select
    import random

    print("1. Testing Manual Generation (Service Layer)...")
    prompt = "넷플릭스 구독 만료 알림 스미싱 문자"
    result_manual = await gemini_service.generate_scenario_from_text(prompt, "sms")
    if result_manual:
        print(f"Manual Success: {result_manual.get('name')}")
    else:
        print("Manual Failed")
        
    print("\n2. Testing Auto Generation (Service + DB Layer)...")
    async with AsyncSessionLocal() as db:
        # Get random threat
        result = await db.execute(select(ThreatCase).limit(5))
        threats = result.scalars().all()
        
        if threats:
            threat = random.choice(threats)
            print(f"Selected Threat: {threat.raw_text[:30]}...")
            context = f"기반 뉴스: {threat.raw_text}"
            
            result_auto = await gemini_service.generate_scenario_from_text(context, "email")
            if result_auto:
                print(f"Auto Success: {result_auto.get('name')}")
            else:
                print("Auto Failed")
        else:
            print("No threats found in DB. Did you run seed_threats.py?")

if __name__ == "__main__":
    asyncio.run(test_scenario_generation())
