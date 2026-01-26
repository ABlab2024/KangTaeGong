import asyncio
import sys
import os

# Add src/backend to sys.path
sys.path.append(os.path.join(os.getcwd(), "src", "backend"))

from app.db.session import AsyncSessionLocal
from app.models.threat_case import ThreatCase
from sqlalchemy import select, text

async def main():
    print("Connecting to database...")
    async with AsyncSessionLocal() as session:
        try:
            # Check simple connection
            await session.execute(text("SELECT 1"))
            print("Database connection successful.")
            
            # Check model mapping (select raw to see if table exists)
            print("Checking threat_cases table...")
            result = await session.execute(select(ThreatCase).limit(1))
            threats = result.scalars().all()
            print(f"Successfully queried threat_cases. Found {len(threats)} rows.")
            
        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
