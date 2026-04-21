from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# DATABASE CONNECTION
DATABASE_URL = "mysql+pymysql://root:password@localhost/autosched"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

# DB dependency (FastAPI use karega)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
