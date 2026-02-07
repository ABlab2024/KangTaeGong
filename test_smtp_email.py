"""
SMTP Email Test Script for KangTaeGong
Tests email delivery using a scenario from local SQLite DB.
"""
import asyncio
import sqlite3
import uuid
import sys
import os

# Add backend path to import modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'backend'))

from dotenv import load_dotenv
load_dotenv()

from app.services.email_service import EmailService


async def test_smtp_email():
    """Test SMTP email delivery with a scenario from local DB."""
    
    print("=" * 60)
    print("🎣 KangTaeGong SMTP Email Test")
    print("=" * 60)
    
    # 1. Connect to local SQLite DB
    print("\n📂 Step 1: Loading scenario from SQLite DB...")
    conn = sqlite3.connect('kangtaegong.db')
    cursor = conn.cursor()
    
    # Get a scenario
    cursor.execute("""
        SELECT id, name, subject, body_template, sender_name, dummy_page_url 
        FROM phishing_scenarios 
        WHERE is_active = 1 
        LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()
    
    if not row:
        print("❌ No active scenarios found in database!")
        return False
    
    scenario_id, name, subject, body_template, sender_name, dummy_page_url = row
    print(f"   ✓ Found scenario: {name}")
    print(f"   ✓ Subject: {subject}")
    print(f"   ✓ Sender: {sender_name}")
    
    # 2. Initialize EmailService
    print("\n📧 Step 2: Initializing Email Service...")
    email_service = EmailService()
    
    print(f"   SMTP Server: {email_service.server}")
    print(f"   SMTP Port: {email_service.port}")
    print(f"   From Email: {email_service.from_email}")
    print(f"   Credentials: {'✓ Configured' if email_service.username and email_service.password else '❌ Missing'}")
    
    if not email_service.username or not email_service.password:
        print("\n❌ SMTP credentials not configured! Check .env file.")
        return False
    
    # 3. Test Email Recipient
    test_recipient = os.getenv("ADMIN_EMAIL", "ablabs2024@gmail.com")
    simulation_id = str(uuid.uuid4())
    
    print(f"\n📤 Step 3: Sending test email...")
    print(f"   To: {test_recipient}")
    print(f"   Simulation ID: {simulation_id}")
    
    # Send the email
    success = await email_service.send_phishing_email(
        to_email=test_recipient,
        subject=f"[테스트] {subject}",
        body_html=body_template,
        sender_name=sender_name,
        simulation_id=simulation_id,
        dummy_page_url=dummy_page_url or "https://example.com/test"
    )
    
    print("\n" + "=" * 60)
    if success:
        print("✅ EMAIL SENT SUCCESSFULLY!")
        print(f"   Please check your inbox at: {test_recipient}")
        print("=" * 60)
        return True
    else:
        print("❌ EMAIL SENDING FAILED!")
        print("   Check SMTP credentials and server logs.")
        print("=" * 60)
        return False


if __name__ == "__main__":
    result = asyncio.run(test_smtp_email())
    sys.exit(0 if result else 1)
