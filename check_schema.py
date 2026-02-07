import asyncio
import sys
import os
sys.path.insert(0, '/mnt/c/GodKim/codes/Projects/KangTaeGong/src/backend')
os.chdir('/mnt/c/GodKim/codes/Projects/KangTaeGong')

from app.db.session import AsyncSessionLocal
from sqlalchemy import text

async def check_schema():
    async with AsyncSessionLocal() as session:
        result = await session.execute(text('''
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'simulation_logs' 
            ORDER BY ordinal_position
        '''))
        for row in result.fetchall():
            print(f'{row[0]}: {row[1]}')

asyncio.run(check_schema())
