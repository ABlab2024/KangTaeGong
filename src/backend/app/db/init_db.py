"""
Database initialization script for SQLite.
Creates all tables and seeds initial data.
"""
import asyncio
import json
from app.db.session import engine
from app.db.base import Base
from app.db.session import AsyncSessionLocal
from app.models.user_profile import ContentCategory

# data.md 기반 카테고리 데이터
CATEGORIES = [
    # 영화·드라마
    {"name": "이번주 신작", "icon": "🎬", "category_group": "영화·드라마", "display_order": 1},
    {"name": "숨은명작", "icon": "💎", "category_group": "영화·드라마", "display_order": 2},
    {"name": "장르픽", "icon": "🎭", "category_group": "영화·드라마", "display_order": 3},
    {"name": "정주행각", "icon": "📺", "category_group": "영화·드라마", "display_order": 4},
    
    # 아이돌·연예
    {"name": "신곡·컴백", "icon": "🎤", "category_group": "아이돌·연예", "display_order": 5},
    {"name": "화제성픽", "icon": "🔥", "category_group": "아이돌·연예", "display_order": 6},
    {"name": "덕질꿀팁", "icon": "💡", "category_group": "아이돌·연예", "display_order": 7},
    
    # 유머·밈
    {"name": "오늘의밈", "icon": "😂", "category_group": "유머·밈", "display_order": 8},
    {"name": "짤모음", "icon": "🤣", "category_group": "유머·밈", "display_order": 9},
    {"name": "밈해설", "icon": "📖", "category_group": "유머·밈", "display_order": 10},
    
    # 음악
    {"name": "신곡5선", "icon": "🎵", "category_group": "음악", "display_order": 11},
    {"name": "장르탐험", "icon": "🎸", "category_group": "음악", "display_order": 12},
    {"name": "작업플리", "icon": "🎧", "category_group": "음악", "display_order": 13},
    
    # 푸드·드링크
    {"name": "10분요리", "icon": "🍳", "category_group": "푸드·드링크", "display_order": 14},
    {"name": "카페신상", "icon": "☕", "category_group": "푸드·드링크", "display_order": 15},
    {"name": "맛집지도", "icon": "🗺️", "category_group": "푸드·드링크", "display_order": 16},
    
    # 패션·뷰티
    {"name": "코디레시", "icon": "👗", "category_group": "패션·뷰티", "display_order": 17},
    {"name": "스킨케어", "icon": "🧴", "category_group": "패션·뷰티", "display_order": 18},
    {"name": "향수추천", "icon": "🌸", "category_group": "패션·뷰티", "display_order": 19},
    
    # 여행
    {"name": "주말근교", "icon": "🚗", "category_group": "여행", "display_order": 20},
    {"name": "가성비여행", "icon": "✈️", "category_group": "여행", "display_order": 21},
    {"name": "혼자여행", "icon": "🎒", "category_group": "여행", "display_order": 22},
    
    # 테크·AI
    {"name": "툴추천", "icon": "🛠️", "category_group": "테크·AI", "display_order": 23},
    {"name": "AI브리핑", "icon": "🤖", "category_group": "테크·AI", "display_order": 24},
    {"name": "보안체크", "icon": "🔒", "category_group": "테크·AI", "display_order": 25},
    
    # 경제·재테크
    {"name": "돈습관", "icon": "💰", "category_group": "경제·재테크", "display_order": 26},
    {"name": "투자기초", "icon": "📈", "category_group": "경제·재테크", "display_order": 27},
    {"name": "절세팁", "icon": "🧾", "category_group": "경제·재테크", "display_order": 28},
    
    # 공공·행정 (피싱 취약)
    {"name": "정부지원금", "icon": "🏛️", "category_group": "공공·행정", "display_order": 29},
    {"name": "과태료·벌금", "icon": "⚠️", "category_group": "공공·행정", "display_order": 30},
    {"name": "공공기관문자", "icon": "📱", "category_group": "공공·행정", "display_order": 31},
    
    # 쇼핑·결제 (피싱 취약)
    {"name": "대형플랫폼 이용", "icon": "🛒", "category_group": "쇼핑·결제", "display_order": 32},
    {"name": "배송알림확인", "icon": "📦", "category_group": "쇼핑·결제", "display_order": 33},
    {"name": "할인·보상민감", "icon": "🎁", "category_group": "쇼핑·결제", "display_order": 34},
    
    # 구직·부업 (피싱 취약)
    {"name": "취업준비중", "icon": "💼", "category_group": "구직·부업", "display_order": 35},
    {"name": "부업관심", "icon": "💵", "category_group": "구직·부업", "display_order": 36},
    {"name": "단기고수익", "icon": "🚀", "category_group": "구직·부업", "display_order": 37},
    
    # 금융·보안 반응 (피싱 취약)
    {"name": "계좌문제불안", "icon": "😰", "category_group": "금융·보안 반응", "display_order": 38},
    {"name": "전문기관신뢰", "icon": "🏦", "category_group": "금융·보안 반응", "display_order": 39},
    {"name": "긴급대응형", "icon": "🚨", "category_group": "금융·보안 반응", "display_order": 40},
    
    # 중고거래 (피싱 취약)
    {"name": "중고거래활발", "icon": "🔄", "category_group": "중고거래", "display_order": 41},
    {"name": "안전거래신뢰", "icon": "🤝", "category_group": "중고거래", "display_order": 42},
]


async def init_db():
    """Initialize database tables"""
    async with engine.begin() as conn:
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created successfully")


async def seed_categories():
    """Seed content categories from data.md"""
    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        
        # Check if categories already exist
        result = await session.execute(select(ContentCategory).limit(1))
        if result.scalar_one_or_none():
            print("ℹ️ Categories already seeded, skipping...")
            return
        
        # Insert categories
        for cat_data in CATEGORIES:
            category = ContentCategory(**cat_data)
            session.add(category)
        
        await session.commit()
        print(f"✅ Seeded {len(CATEGORIES)} content categories")


async def main():
    """Main initialization function"""
    print("🚀 Initializing KangTaeGong MVP Database...")
    await init_db()
    await seed_categories()
    print("✅ Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())
