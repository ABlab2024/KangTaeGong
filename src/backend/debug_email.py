import sys
import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Define paths
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parents[1]  # src/backend -> src -> KangTaeGong

# Load .env manually to verify
dotenv_path = ROOT_DIR / ".env"
loaded = load_dotenv(dotenv_path)

print(f"--- Debugging Email Configuration ---")
print(f"Project Root: {ROOT_DIR}")
print(f"Looking for .env at: {dotenv_path}")
print(f".env file exists: {dotenv_path.exists()}")
print(f"dotenv loaded: {loaded}")

# Add content of .env if it exists (masked)
if dotenv_path.exists():
    with open(dotenv_path, "r", encoding="utf-8") as f:
        print("Content of .env (keys only):")
        for line in f:
            if "=" in line and not line.startswith("#"):
                key = line.split("=")[0].strip()
                print(f"  - {key}")
else:
    print("Warning: .env file is missing!")

# Append src/backend to sys.path to import app modules
sys.path.append(str(BASE_DIR))

try:
    from app.services.email_service import send_phishing_email, SMTP_USER, SMTP_PASSWORD, TEMPLATE_DIR, SENDER_EMAIL
    
    print(f"\n--- Service Configuration ---")
    print(f"SMTP_USER: {'***' if SMTP_USER else 'NOT SET'}")
    print(f"SMTP_PASSWORD: {'***' if SMTP_PASSWORD else 'NOT SET'}")
    print(f"SENDER_EMAIL: {SENDER_EMAIL}")
    print(f"Template Dir: {TEMPLATE_DIR}")
    print(f"Template Dir Exists: {TEMPLATE_DIR.exists()}")
    
    if TEMPLATE_DIR.exists():
        templates = [f.name for f in TEMPLATE_DIR.glob('*.html')]
        print(f"Available Templates: {templates}")

    print(f"\n--- Sending Test ---")
    if not SMTP_USER or not SMTP_PASSWORD:
        print("Skipping send test because credentials are missing.")
    else:
        print("Attempting to send email...")
        # We won't actually send to a real address to avoid spam, but calling the function to see it try to authenticate
        # It will likely fail login if creds are wrong, or connect failure.
        result = asyncio.run(send_phishing_email("test@example.com", "Debug Test", "This is a test"))
        print(f"Send Result: {result}")

except ImportError as e:
    print(f"Import Error: {e}")
    # Print sys.path to debug
    print(f"sys.path: {sys.path}")
except Exception as e:
    print(f"Runtime Error: {e}")
