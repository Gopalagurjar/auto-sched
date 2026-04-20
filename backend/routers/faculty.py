from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import auth

router = APIRouter(prefix="/faculty", tags=["Faculty"])

# Admin endpoints that are static (no path parameters) should come first
@router.get("/", response_model=List[schemas.Faculty])
def read_faculty(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    faculty = db.query(models.Faculty).offset(skip).limit(limit).all()
    return faculty

# Faculty self‑service endpoints – these are static and must come before the dynamic {faculty_id}
@router.get("/my-info", response_model=schemas.Faculty)
def get_my_faculty_info(
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.get_current_active_user)
):
    print("=" * 60)
    print(f"🔍 GET /faculty/my-info called by user: {current_user.username}, role: {current_user.role}, email: {current_user.email}")
    if current_user.role not in ['faculty', 'admin']:
        print(f"❌ Role {current_user.role} not allowed")
        raise HTTPException(status_code=403, detail="Not allowed")
    faculty = db.query(models.Faculty).filter(models.Faculty.email == current_user.email).first()
    print(f"🔍 Faculty query result: {faculty.id if faculty else 'None'}")
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty record not found")
    print(f"✅ Faculty record found: {faculty.id}, returning data")
    return faculty

@router.put("/me/preferences", response_model=schemas.Faculty)
def update_my_preferences(
    preferences: dict,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.get_current_active_user)
):
    print("=" * 60)
    print(f"🔍 PUT /faculty/me/preferences called by: {current_user.username}, role: {current_user.role}")
    if current_user.role not in ['faculty', 'admin']:
        print(f"❌ Role {current_user.role} not allowed")
        raise HTTPException(status_code=403, detail="Only faculty can access this endpoint")
    faculty = db.query(models.Faculty).filter(models.Faculty.email == current_user.email).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty record not found")
    faculty.preferences = preferences
    db.commit()
    db.refresh(faculty)
    print(f"✅ Preferences updated for faculty {faculty.id}")
    return faculty

# Dynamic routes – must come after all static routes
@router.get("/{faculty_id}", response_model=schemas.Faculty)
def read_faculty_by_id(
    faculty_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    fac = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not fac:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return fac

@router.post("/", response_model=schemas.Faculty, status_code=201)
def create_faculty(
    faculty: schemas.FacultyCreate,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    existing = db.query(models.Faculty).filter(models.Faculty.faculty_id == faculty.faculty_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Faculty ID already exists")
    db_faculty = models.Faculty(**faculty.model_dump())
    db.add(db_faculty)
    db.commit()
    db.refresh(db_faculty)
    return db_faculty

@router.put("/{faculty_id}", response_model=schemas.Faculty)
def update_faculty(
    faculty_id: int,
    faculty_update: schemas.FacultyUpdate,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    db_faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not db_faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    if faculty_update.faculty_id != db_faculty.faculty_id:
        existing = db.query(models.Faculty).filter(models.Faculty.faculty_id == faculty_update.faculty_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Faculty ID already exists")
    for key, value in faculty_update.model_dump().items():
        setattr(db_faculty, key, value)
    db.commit()
    db.refresh(db_faculty)
    return db_faculty

@router.delete("/{faculty_id}", status_code=204)
def delete_faculty(
    faculty_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    db_faculty = db.query(models.Faculty).filter(models.Faculty.id == faculty_id).first()
    if not db_faculty:
        raise HTTPException(status_code=404, detail="Faculty not found")
    db.delete(db_faculty)
    db.commit()
    return None