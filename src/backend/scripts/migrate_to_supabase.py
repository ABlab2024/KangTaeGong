"""SQLite → Supabase 데이터 마이그레이션 스크립트"""
import asyncio
import sqlite3
import json
from datetime import datetime
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

SQLITE_PATH = "kangtaegong.db"
# .env에서 가져오거나 직접 입력
SUPABASE_DSN = os.getenv("DATABASE_URL")

async def migrate():
    if not os.path.exists(SQLITE_PATH):
        print(f"❌ SQLite file not found: {SQLITE_PATH}")
        return

    print(f"🚀 Starting migration from {SQLITE_PATH} to Supabase...")
    
    # SQLite 연결
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    
    # Supabase 연결
    if not SUPABASE_DSN:
        print("❌ DATABASE_URL is missing in .env")
        return

    # asyncpg requires "postgresql://" or "postgres://", but SQLAlchemy uses "postgresql+asyncpg://"
    formatted_dsn = SUPABASE_DSN.replace("postgresql+asyncpg://", "postgresql://")

    try:
        # Supabase Transaction Pooler (port 6543) does not support prepared statements
        pg_conn = await asyncpg.connect(
            formatted_dsn,
            statement_cache_size=0
        )
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return
    
    try:
        # 1. Users 마이그레이션
        print("Migrating Users...")
        cursor = sqlite_conn.execute("SELECT * FROM users")
        for row in cursor.fetchall():
            try:
                await pg_conn.execute("""
                    INSERT INTO users (id, email, hashed_password, age_group, gender, preferences, security_score, created_at)
                    VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb, $7, $8)
                    ON CONFLICT (id) DO NOTHING
                """, row['id'], row['email'], row['hashed_password'], 
                    row['age_group'], row['gender'], 
                    row['preferences'] or '[]', row['security_score'] or 0,
                    datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.utcnow())
            except Exception as e:
                print(f"Failed to migrate user {row['id']}: {e}")
        
        # 2. PhishingScenarios 마이그레이션
        print("Migrating Phishing Scenarios...")
        try:
            cursor = sqlite_conn.execute("SELECT * FROM phishing_scenarios")
            for row in cursor.fetchall():
                try:
                    await pg_conn.execute("""
                        INSERT INTO phishing_scenarios (id, name, description, scenario_type, difficulty, 
                            subject, body_template, sender_name, dummy_page_url, dummy_page_html,
                            source_url, is_llm_generated, is_active, created_at, updated_at)
                        VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                        ON CONFLICT (id) DO NOTHING
                    """, row['id'], row['name'], row['description'], row['scenario_type'],
                        row['difficulty'], row['subject'], row['body_template'], row['sender_name'],
                        row['dummy_page_url'], row['dummy_page_html'], row['source_url'],
                        bool(row['is_llm_generated']), bool(row['is_active']),
                        datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.utcnow(),
                        datetime.fromisoformat(row['updated_at']) if row['updated_at'] else datetime.utcnow())
                except Exception as e:
                    print(f"Failed to migrate scenario {row['id']}: {e}")
        except sqlite3.OperationalError:
            print("Table phishing_scenarios not found in SQLite, skipping.")

        # 3. UserProfiles 마이그레이션
        print("Migrating User Profiles...")
        try:
            cursor = sqlite_conn.execute("SELECT * FROM user_profiles")
            columns = [description[0] for description in cursor.description]
            for row in cursor.fetchall():
                try:
                    # sqlite3.Row doesn't strictly support .get(), so we handle it manually or verify columns
                    # New columns might not exist in SQLite
                    aug_prefs = row['augmented_preferences'] if 'augmented_preferences' in columns else '[]'
                    vuln_analysis = row['vulnerability_analysis'] if 'vulnerability_analysis' in columns else None
                    vuln_summary = row['vulnerability_summary'] if 'vulnerability_summary' in columns else None
                    aug_count = row['augmentation_count'] if 'augmentation_count' in columns else 0
                    
                    await pg_conn.execute("""
                        INSERT INTO user_profiles (id, user_id, age, occupation, location, 
                            sns_homepage, recent_ai_link, content_preferences, 
                            augmented_preferences, vulnerability_analysis, vulnerability_summary, 
                            onboarding_completed, augmentation_count, created_at, updated_at)
                        VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8::jsonb, 
                            $9::jsonb, $10, $11, $12, $13, $14, $15)
                        ON CONFLICT (id) DO NOTHING
                    """, row['id'], row['user_id'], row['age'], row['occupation'], row['location'],
                        row['sns_homepage'], row['recent_ai_link'], row['content_preferences'] or '[]',
                        aug_prefs, vuln_analysis, vuln_summary, bool(row['onboarding_completed']),
                        aug_count,
                        datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.utcnow(),
                        datetime.fromisoformat(row['updated_at']) if row['updated_at'] else datetime.utcnow())
                except Exception as e:
                    print(f"Failed to migrate profile {row['id']}: {e}")
        except sqlite3.OperationalError:
            print("Table user_profiles not found in SQLite, skipping.")

        print("✅ Migration completed!")
        
    finally:
        sqlite_conn.close()
        await pg_conn.close()

if __name__ == "__main__":
    asyncio.run(migrate())
