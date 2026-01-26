import asyncio
import httpx
import uvicorn
import time
import multiprocessing
from app.main import app

PORT = 8001
BASE_URL = f"http://127.0.0.1:{PORT}/api/v1"

def run_server():
    uvicorn.run(app, host="0.0.0.0", port=PORT)

async def test_backend_flow():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        print("1. Health Check...")
        # Main root is at /, let's check checking backend health often at / or similar
        # Actually root / returns "KangTaeGong API is running"
        resp = await client.get(f"http://127.0.0.1:{PORT}/") 
        print(f"Health: {resp.status_code} - {resp.json()}")
        assert resp.status_code == 200

        print("\n2. Signup...")
        email = f"test_{int(time.time())}@example.com"
        password = "strongpassword123"
        payload = {"email": email, "password": password, "preferences": ["security", "news"]}
        resp = await client.post("/signup", json=payload)
        print(f"Signup: {resp.status_code}")
        assert resp.status_code == 201
        user_id = resp.json()["id"]
        print(f"Created User ID: {user_id}")

        print("\n3. Login...")
        login_data = {"username": email, "password": password}
        resp = await client.post("/login/access-token", data=login_data)
        print(f"Login: {resp.status_code}")
        assert resp.status_code == 200
        token = resp.json()["access_token"]
        print(f"Got Token: {token[:10]}...")

        print("\n4. Get Profile (Me)...")
        headers = {"Authorization": f"Bearer {token}"}
        resp = await client.get("/me", headers=headers)
        print(f"Profile: {resp.status_code} - {resp.json()['email']}")
        assert resp.status_code == 200
        assert resp.json()["email"] == email

        print("\n5. Check Threats...")
        resp = await client.get("/threats", headers=headers)
        print(f"Threats: {resp.status_code} - Count: {len(resp.json())}")
        assert resp.status_code == 200

if __name__ == "__main__":
    # Start server in process
    p = multiprocessing.Process(target=run_server)
    p.start()
    
    # Wait for startup
    time.sleep(5)
    
    try:
        asyncio.run(test_backend_flow())
        print("\nSUCCESS: All backend tests passed.")
    except Exception as e:
        print(f"\nFAILURE: {e}")
    finally:
        p.terminate()
        p.join()
