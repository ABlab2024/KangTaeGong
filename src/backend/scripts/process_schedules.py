"""GitHub Actions에서 호출할 스케줄 처리 스크립트"""
import asyncio
import sys
import os

# 프로젝트 루트를 sys.path에 추가하여 모듈 import 가능하게 함
current_dir = os.path.dirname(os.path.abspath(__file__)) # src/backend/scripts
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir))) # KangTaeGong root
sys.path.insert(0, project_root)

# backend root도 추가
backend_root = os.path.dirname(current_dir) # src/backend
sys.path.insert(0, backend_root)

from app.services.scheduler import process_pending_schedules

if __name__ == "__main__":
    print("🚀 Starting schedule processing via GitHub Actions/Script...")
    asyncio.run(process_pending_schedules())
    print("✅ Schedule processing complete.")
