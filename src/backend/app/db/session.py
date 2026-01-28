from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# SQLite와 PostgreSQL 모두 지원
if settings.DATABASE_URL.startswith("sqlite"):
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
        connect_args={"check_same_thread": False}  # SQLite requires this
    )
else:
    # PostgreSQL (legacy support)
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True,
        connect_args={
            "prepared_statement_cache_size": 0,
            "statement_cache_size": 0
        }
    )

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
