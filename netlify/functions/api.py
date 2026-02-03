import sys
import os

# 현재 파일(api.py) 위치: /opt/build/repo/netlify/functions/api.py (예시)
# 목표: /opt/build/repo/src/backend를 sys.path에 추가해야 'app' 패키지를 import 가능

# 1. 현재 디렉토리 (netlify/functions)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 2. 프로젝트 루트 (netlify/functions/../../)
project_root = os.path.dirname(os.path.dirname(current_dir))

# 3. 백엔드 소스 경로 (src/backend)
backend_path = os.path.join(project_root, "src", "backend")

# 시스템 경로에 추가
if backend_path not in sys.path:
    sys.path.append(backend_path)

# 이제 src/backend/app 폴더를 'app' 모듈로 불러올 수 있음
from app.main import handler
