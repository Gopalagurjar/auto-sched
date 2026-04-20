from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import auth

router = APIRouter(prefix="/constraints", tags=["Constraints"])


# Get all constraints
@router.get("/", response_model=List[schemas.Constraint])
def read_constraints(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    constraints = db.query(models.Constraint).offset(skip).limit(limit).all()
    return constraints


# Get constraint by ID
@router.get("/{constraint_id}", response_model=schemas.Constraint)
def read_constraint(
    constraint_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    constraint = db.query(models.Constraint).filter(
        models.Constraint.id == constraint_id
    ).first()

    if not constraint:
        raise HTTPException(status_code=404, detail="Constraint not found")

    return constraint


# Create constraint
@router.post("/", response_model=schemas.Constraint, status_code=201)
def create_constraint(
    constraint: schemas.ConstraintCreate,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    db_constraint = models.Constraint(**constraint.model_dump())

    db.add(db_constraint)
    db.commit()
    db.refresh(db_constraint)

    return db_constraint


# Update constraint
@router.put("/{constraint_id}", response_model=schemas.Constraint)
def update_constraint(
    constraint_id: int,
    constraint_update: schemas.ConstraintUpdate,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    db_constraint = db.query(models.Constraint).filter(
        models.Constraint.id == constraint_id
    ).first()

    if not db_constraint:
        raise HTTPException(status_code=404, detail="Constraint not found")

    for key, value in constraint_update.model_dump().items():
        setattr(db_constraint, key, value)

    db.commit()
    db.refresh(db_constraint)

    return db_constraint


# Delete constraint
@router.delete("/{constraint_id}", status_code=204)
def delete_constraint(
    constraint_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    db_constraint = db.query(models.Constraint).filter(
        models.Constraint.id == constraint_id
    ).first()

    if not db_constraint:
        raise HTTPException(status_code=404, detail="Constraint not found")

    db.delete(db_constraint)
    db.commit()

    return None