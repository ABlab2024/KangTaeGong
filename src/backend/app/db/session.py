from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# PostgreSQL (Supabase) 전용
# Supabase (PostgreSQL) 환경에서 PgBouncer 호환성을 위해 Prepared Statement 비활성화
engine_args = {
    "echo": False,
    "pool_pre_ping": True,
}

if "postgresql" in settings.DATABASE_URL:
    engine_args["connect_args"] = {"statement_cache_size": 0}

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_args
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
