import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# ✅ Supabase PostgreSQL URL (SSL REQUIRED)
DATABASE_URL = "postgresql+psycopg2://postgres:Gopala%4020102004@db.yvqggktfexvndiquotlx.supabase.co:5432/postgres?sslmode=require"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"sslmode": "require"}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
