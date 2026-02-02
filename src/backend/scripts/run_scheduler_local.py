"""로컬 개발용 스케줄러 실행 스크립트.
5분마다 스케줄을 확인하고 처리합니다.
"""
import asyncio
import sys
import os
import time
from datetime import datetime

# 프로젝트 루트 및 백엔드 루트 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__)) # src/backend/scripts
backend_root = os.path.dirname(current_dir) # src/backend
project_root = os.path.dirname(os.path.dirname(backend_root)) # KangTaeGong

sys.path.insert(0, project_root)
sys.path.insert(0, backend_root)

from app.services.scheduler import process_pending_schedules

async def run_loop():
    print(f"🚀 Local Scheduler Started at {datetime.now().isoformat()}")
    print("Press Ctrl+C to stop.")
    
    while True:
        try:
            await process_pending_schedules()
        except Exception as e:
            print(f"❌ Error in scheduler loop: {e}")
        
        # 5분 대기
        print("Waiting 5 minutes...")
        await asyncio.sleep(300)

if __name__ == "__main__":
    try:
        asyncio.run(run_loop())
    except KeyboardInterrupt:
        print("\n👋 Scheduler stopped.")
