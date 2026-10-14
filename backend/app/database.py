from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import text
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    echo=False
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            
            # Create TimescaleDB hypertable if available
            try:
                await conn.execute(
                    text("SELECT create_hypertable('sensor_readings', 'time', if_not_exists => TRUE);")
                )
            except Exception:
                # TimescaleDB extension or table already configured
                pass

        # Auto-seed default users if not present
        try:
            from app.models.user import User
            from app.services.auth_service import get_password_hash
            from sqlalchemy.future import select
            
            async with AsyncSessionLocal() as session:
                admin_check = await session.execute(
                    select(User).filter((User.email == "admin") | (User.email == "admin@iaa.de"))
                )
                if not admin_check.scalars().first():
                    admin_user = User(
                        email="admin@iaa.de",
                        hashed_password=get_password_hash("admin123"),
                        full_name="Admin Administrator",
                        role="admin"
                    )
                    session.add(admin_user)

                user_check = await session.execute(
                    select(User).filter((User.email == "user") | (User.email == "user@iaa.de"))
                )
                if not user_check.scalars().first():
                    std_user = User(
                        email="user@iaa.de",
                        hashed_password=get_password_hash("user123"),
                        full_name="Operator User",
                        role="viewer"
                    )
                    session.add(std_user)
                    
                await session.commit()
                print("✅ Seeded default admin and user credentials into PostgreSQL.")
        except Exception as seed_err:
            print(f"User seed notice: {seed_err}")
    except Exception as e:
        print(f"Database connection notice: {e}")
