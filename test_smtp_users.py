"""
SMTP Email Test Script for KangTaeGong
Tests email delivery to all users in local SQLite DB.
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


async def test_smtp_to_users():
    """Test SMTP email delivery to all users in local DB."""
    
    print("=" * 60)
    print("🎣 KangTaeGong SMTP Email Test - All Users")
    print("=" * 60)
    
    # 1. Connect to the backend's SQLite DB
    db_path = os.path.join(os.path.dirname(__file__), 'src', 'backend', 'kangtaegong.db')
    print(f"\n📂 Step 1: Loading data from {db_path}...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all users
    cursor.execute("SELECT id, email, age_group, gender FROM users")
    users = cursor.fetchall()
    
    if not users:
        print("❌ No users found in database!")
        conn.close()
        return False
    
    print(f"   ✓ Found {len(users)} users:")
    for user in users:
        print(f"     - {user[1]} ({user[2]}, {user[3]})")
    
    # Get a scenario
    cursor.execute("""
        SELECT id, name, subject, body_template, sender_name, dummy_page_url 
        FROM phishing_scenarios 
        WHERE is_active = 1 
        LIMIT 1
    """)
    scenario = cursor.fetchone()
    conn.close()
    
    if not scenario:
        print("❌ No active scenarios found in database!")
        return False
    
    scenario_id, name, subject, body_template, sender_name, dummy_page_url = scenario
    print(f"\n📋 Step 2: Using scenario...")
    print(f"   ✓ Name: {name}")
    print(f"   ✓ Subject: {subject}")
    
    # 2. Initialize EmailService
    print("\n📧 Step 3: Initializing Email Service...")
    email_service = EmailService()
    
    print(f"   SMTP Server: {email_service.server}")
    print(f"   From Email: {email_service.from_email}")
    
    if not email_service.username or not email_service.password:
        print("\n❌ SMTP credentials not configured!")
        return False
    
    # 3. Send emails to all users
    print(f"\n📤 Step 4: Sending emails to {len(users)} users...")
    results = []
    
    for user_id, email, age_group, gender in users:
        simulation_id = str(uuid.uuid4())
        print(f"\n   → Sending to: {email}")
        
        success = await email_service.send_phishing_email(
            to_email=email,
            subject=f"[테스트] {subject}",
            body_html=body_template,
            sender_name=sender_name,
            simulation_id=simulation_id,
            dummy_page_url=dummy_page_url or "https://example.com/test"
        )
        
        results.append((email, success))
        if success:
            print(f"     ✅ Sent successfully")
        else:
            print(f"     ❌ Failed to send")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    success_count = sum(1 for _, s in results if s)
    fail_count = len(results) - success_count
    
    print(f"   ✅ Sent: {success_count}")
    print(f"   ❌ Failed: {fail_count}")
    
    for email, success in results:
        status = "✅" if success else "❌"
        print(f"   {status} {email}")
    
    print("=" * 60)
    
    return fail_count == 0


if __name__ == "__main__":
    result = asyncio.run(test_smtp_to_users())
    sys.exit(0 if result else 1)
