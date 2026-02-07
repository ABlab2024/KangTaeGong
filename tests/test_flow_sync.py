import multiprocessing
import uvicorn
import time
import requests
import sys
from app.main import app

PORT = 8002
BASE_URL = f"http://127.0.0.1:{PORT}/api/v1"

def run_server():
    uvicorn.run(app, host="0.0.0.0", port=PORT)

def test_backend_flow():
    with requests.Session() as client:
        print("1. Health Check...")
        try:
            resp = client.get(f"http://127.0.0.1:{PORT}/", timeout=10)
            print(f"Health: {resp.status_code} - {resp.json()}")
            assert resp.status_code == 200
        except Exception as e:
            print(f"Health Check Failed: {e}")
            raise

        print("\n2. Signup...")
        email = f"test_{int(time.time())}@example.com"
        password = "strongpassword123"
        payload = {"email": email, "password": password, "preferences": ["security", "news"]}
        resp = client.post(f"{BASE_URL}/signup", json=payload, timeout=10)
        print(f"Signup: {resp.status_code}")
        # 201 created or 400 if exists. Since timestamp is unique, should be 201.
        if resp.status_code != 201:
            print(f"Signup Error: {resp.text}")
        assert resp.status_code == 201
        user_id = resp.json()["id"]
        print(f"Created User ID: {user_id}")

        print("\n3. Login...")
        login_data = {"username": email, "password": password}
        resp = client.post(f"{BASE_URL}/login/access-token", data=login_data, timeout=10)
        print(f"Login: {resp.status_code}")
        if resp.status_code != 200:
             print(f"Login Error: {resp.text}")
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        print(f"Got Token: {token[:10]}...")

        print("\n4. Get Profile (Me)...")
        headers = {"Authorization": f"Bearer {token}"}
        resp = client.get(f"{BASE_URL}/me", headers=headers, timeout=10)
        print(f"Profile: {resp.status_code} - {resp.json()['email']}")
        assert resp.status_code == 200
        assert resp.json()["email"] == email

        print("\n5. Check Threats...")
        resp = client.get(f"{BASE_URL}/threats", headers=headers, timeout=10)
        print(f"Threats: {resp.status_code} - Count: {len(resp.json())}")
        assert resp.status_code == 200

if __name__ == "__main__":
    # Start server in process
    p = multiprocessing.Process(target=run_server)
    p.start()
    
    # Wait for startup
    print("Waiting for server to start...")
    time.sleep(10)
    
    try:
        test_backend_flow()
        print("\nSUCCESS: All backend tests passed.")
    except Exception as e:
        print(f"\nFAILURE: {e}")
    finally:
        p.terminate()
        p.join()
