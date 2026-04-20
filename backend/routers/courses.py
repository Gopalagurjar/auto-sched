from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import auth

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("/", response_model=List[schemas.Course])
def read_courses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.get_current_active_user)  # ✅ any authenticated user
):
    courses = db.query(models.Course).offset(skip).limit(limit).all()
    return courses

@router.get("/{course_id}", response_model=schemas.Course)
def read_course(
    course_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.get_current_active_user)  # ✅ any authenticated user
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("/", response_model=schemas.Course, status_code=201)
def create_course(
    course: schemas.CourseCreate,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)  # ❗ admin only
):
    existing = db.query(models.Course).filter(models.Course.course_code == course.course_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")
    db_course = models.Course(**course.model_dump())
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.put("/{course_id}", response_model=schemas.Course)
def update_course(
    course_id: int,
    course_update: schemas.CourseUpdate,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)  # ❗ admin only
):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    if course_update.course_code != db_course.course_code:
        existing = db.query(models.Course).filter(models.Course.course_code == course_update.course_code).first()
        if existing:
            raise HTTPException(status_code=400, detail="Course code already exists")
    for key, value in course_update.model_dump().items():
        setattr(db_course, key, value)
    db.commit()
    db.refresh(db_course)
    return db_course

@router.delete("/{course_id}", status_code=204)
def delete_course(
    course_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)  # ❗ admin only
):
    db_course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not db_course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(db_course)
    db.commit()
    return None