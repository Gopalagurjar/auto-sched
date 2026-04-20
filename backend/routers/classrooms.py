from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import auth

router = APIRouter(prefix="/classrooms", tags=["Classrooms"])

@router.get("/", response_model=List[schemas.Classroom])
def read_classrooms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.get_current_active_user)  # ✅ any authenticated user
):
    items = db.query(models.Classroom).offset(skip).limit(limit).all()
    return items

@router.get("/{classroom_id}", response_model=schemas.Classroom)
def read_classroom(
    classroom_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.get_current_active_user)  # ✅ any authenticated user
):
    item = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return item

@router.post("/", response_model=schemas.Classroom, status_code=201)
def create_classroom(
    classroom: schemas.ClassroomCreate,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)  # ❗ admin only
):
    existing = db.query(models.Classroom).filter(models.Classroom.room_number == classroom.room_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Room number already exists")
    db_item = models.Classroom(**classroom.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{classroom_id}", response_model=schemas.Classroom)
def update_classroom(
    classroom_id: int,
    classroom_update: schemas.ClassroomUpdate,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)  # ❗ admin only
):
    db_item = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Classroom not found")
    if classroom_update.room_number != db_item.room_number:
        existing = db.query(models.Classroom).filter(models.Classroom.room_number == classroom_update.room_number).first()
        if existing:
            raise HTTPException(status_code=400, detail="Room number already exists")
    for key, value in classroom_update.model_dump().items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{classroom_id}", status_code=204)
def delete_classroom(
    classroom_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)  # ❗ admin only
):
    db_item = db.query(models.Classroom).filter(models.Classroom.id == classroom_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Classroom not found")
    db.delete(db_item)
    db.commit()
    return None