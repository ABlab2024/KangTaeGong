import sys
import os

# 현재 파일(api.py) 위치: /opt/build/repo/netlify/functions/api.py
# Netlify Functions 환경에서 os.getcwd()는 보통 /var/task 또는 /opt/build/repo 입니다.

# 1. 현재 디렉토리 (netlify/functions)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 2. 프로젝트 루트 찾기
# 로컬 개발 환경과 배포 환경의 경로 구조가 다를 수 있으므로, 상위로 이동하며 'src'를 찾습니다.
# 하지만 Netlify 빌드 구조상 src/backend가 포함되어 있어야 합니다.

# 방법 A: 상대 경로 사용 (기존 방식)
# project_root = os.path.dirname(os.path.dirname(current_dir))

# 방법 B: 절대 경로 추정 (Netlify Lambda 환경)
# Lambda 환경에서는 소스 코드가 /var/task/src/backend/... 에 위치할 수도 있고, 
# 혹은 루트인 /var/task/ 에 풀려있을 수도 있습니다.

# 안전한 방식:
# 1. 현재 파일 기준 ../../src/backend 추가
path_via_relative = os.path.join(os.path.dirname(os.path.dirname(current_dir)), "src", "backend")

# 2. 혹은 바로 옆에 풀려있는 경우 (패키징 방식에 따라 다름)
# path_via_current = os.path.join(current_dir, "src", "backend")

if os.path.exists(path_via_relative):
    sys.path.append(path_via_relative)
else:
    # 혹시 모르니 현재 디렉토리 자체도 추가 (최상위 레벨 import 지원)
    sys.path.append(current_dir)
    # 또한 상위 디렉토리도 추가
    sys.path.append(os.path.dirname(current_dir))

# 디버깅: 경로 확인용 (로그에 찍힘)
# print(f"DEBUG: sys.path: {sys.path}")

try:
    from app.main import handler
except ImportError as e:
    # 만약 app을 못 찾으면, src/backend가 sys.path에 없는 것.
    # 최후의 수단: /var/task/src/backend 추가 시도
    if "/var/task/src/backend" not in sys.path:
        sys.path.append("/var/task/src/backend")
    
    try:
        from app.main import handler
    except ImportError:
        # 그래도 실패하면 에러 메시지를 명확히 뱉도록 함
        def handler(event, context):
            return {
                "statusCode": 500,
                "body": f"Import Error: {e} | Paths: {sys.path} | CWD: {os.getcwd()}"
            }
