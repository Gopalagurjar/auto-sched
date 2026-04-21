from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
    auth, courses, faculty, classrooms,
    groups, constraints, timetables,
    analytics, upload
)

from database import engine, Base

app = FastAPI(title="AutoSched API", version="1.0.0")

# ✅ SAFE DB INIT (NO CRASH ON RENDER)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print("DB not ready:", e)

# ✅ CORS (PRODUCTION READY)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://your-frontend-url"   # 👈 replace this after deploy
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(faculty.router)
app.include_router(classrooms.router)
app.include_router(groups.router)
app.include_router(constraints.router)
app.include_router(timetables.router)
app.include_router(analytics.router)
app.include_router(upload.router)

@app.get("/")
def root():
    return {"message": "AutoSched API"}

@app.get("/health")
def health():
    return {"status": "ok"}
