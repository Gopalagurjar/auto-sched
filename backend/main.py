from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import (
    auth, courses, faculty, classrooms,
    groups, constraints, timetables,
    analytics, upload
)

app = FastAPI(title="AutoSched API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
