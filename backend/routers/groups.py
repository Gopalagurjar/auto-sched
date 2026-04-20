from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import auth

router = APIRouter(prefix="/groups", tags=["Student Groups"])


@router.get("/", response_model=List[schemas.StudentGroup])
def read_groups(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.require_admin)
):
    groups = db.query(models.StudentGroup).offset(skip).limit(limit).all()
    return groups


@router.get("/{group_id}", response_model=schemas.StudentGroup)
def read_group(
    group_id: int,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.require_admin)
):
    db_group = db.query(models.StudentGroup).filter(
        models.StudentGroup.id == group_id
    ).first()

    if not db_group:
        raise HTTPException(status_code=404, detail="Student group not found")

    return db_group


@router.post("/", response_model=schemas.StudentGroup, status_code=201)
def create_group(
    group: schemas.StudentGroupCreate,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.require_admin)
):
    existing = db.query(models.StudentGroup).filter(
        models.StudentGroup.group_id == group.group_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Group ID already exists")

    db_group = models.StudentGroup(**group.model_dump())
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group


@router.put("/{group_id}", response_model=schemas.StudentGroup)
def update_group(
    group_id: int,
    group_update: schemas.StudentGroupUpdate,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.require_admin)
):
    db_group = db.query(models.StudentGroup).filter(
        models.StudentGroup.id == group_id
    ).first()

    if not db_group:
        raise HTTPException(status_code=404, detail="Student group not found")

    if group_update.group_id != db_group.group_id:
        existing = db.query(models.StudentGroup).filter(
            models.StudentGroup.group_id == group_update.group_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Group ID already exists")

    for key, value in group_update.model_dump().items():
        setattr(db_group, key, value)

    db.commit()
    db.refresh(db_group)
    return db_group


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int,
    db: Session = Depends(auth.get_db),
    current_user=Depends(auth.require_admin)
):
    db_group = db.query(models.StudentGroup).filter(
        models.StudentGroup.id == group_id
    ).first()

    if not db_group:
        raise HTTPException(status_code=404, detail="Student group not found")

    db.delete(db_group)
    db.commit()
    return None