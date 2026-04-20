import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import models
import auth
from database import get_db
import io

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("/courses")
def upload_courses(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(auth.require_admin)
):
    return _process_file(file, db, "courses")

@router.post("/faculty")
def upload_faculty(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(auth.require_admin)
):
    return _process_file(file, db, "faculty")

@router.post("/classrooms")
def upload_classrooms(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(auth.require_admin)
):
    return _process_file(file, db, "classrooms")

@router.post("/groups")
def upload_groups(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(auth.require_admin)
):
    return _process_file(file, db, "groups")

def _process_file(file: UploadFile, db: Session, entity: str):
    # Read Excel file
    try:
        contents = file.file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file format: {str(e)}")
    finally:
        file.file.close()

    if df.empty:
        raise HTTPException(status_code=400, detail="File is empty")

    # Convert DataFrame to list of dicts
    records = df.to_dict(orient='records')
    imported = 0
    errors = []

    # Process based on entity
    if entity == "courses":
        for rec in records:
            try:
                # Basic validation
                required = ['course_code', 'course_name', 'department', 'semester']
                for field in required:
                    if pd.isna(rec.get(field)):
                        errors.append(f"Missing {field} in row: {rec}")
                        continue
                # Convert types
                rec['semester'] = int(rec['semester'])
                rec['lecture_hours'] = int(rec.get('lecture_hours', 0))
                rec['tutorial_hours'] = int(rec.get('tutorial_hours', 0))
                rec['practical_hours'] = int(rec.get('practical_hours', 0))
                rec['duration'] = rec['lecture_hours'] + rec['tutorial_hours'] + rec['practical_hours']
                rec['faculty_id'] = rec.get('faculty_id') if not pd.isna(rec.get('faculty_id')) else None
                # Check if course already exists
                existing = db.query(models.Course).filter(models.Course.course_code == rec['course_code']).first()
                if existing:
                    # Update or skip? We'll skip for safety
                    errors.append(f"Course code {rec['course_code']} already exists")
                    continue
                db_course = models.Course(**rec)
                db.add(db_course)
                imported += 1
            except Exception as e:
                errors.append(f"Error in row {rec}: {str(e)}")
        db.commit()

    elif entity == "faculty":
        for rec in records:
            try:
                required = ['faculty_id', 'name', 'email', 'department']
                for field in required:
                    if pd.isna(rec.get(field)):
                        errors.append(f"Missing {field} in row: {rec}")
                        continue
                rec['max_hours'] = int(rec.get('max_hours', 20))
                rec['preferences'] = rec.get('preferences') if not pd.isna(rec.get('preferences')) else None
                existing = db.query(models.Faculty).filter(models.Faculty.faculty_id == rec['faculty_id']).first()
                if existing:
                    errors.append(f"Faculty ID {rec['faculty_id']} already exists")
                    continue
                db_faculty = models.Faculty(**rec)
                db.add(db_faculty)
                imported += 1
            except Exception as e:
                errors.append(f"Error in row {rec}: {str(e)}")
        db.commit()

    elif entity == "classrooms":
        for rec in records:
            try:
                required = ['room_number', 'capacity', 'room_type']
                for field in required:
                    if pd.isna(rec.get(field)):
                        errors.append(f"Missing {field} in row: {rec}")
                        continue
                rec['capacity'] = int(rec['capacity'])
                rec['equipment'] = rec.get('equipment') if not pd.isna(rec.get('equipment')) else None
                existing = db.query(models.Classroom).filter(models.Classroom.room_number == rec['room_number']).first()
                if existing:
                    errors.append(f"Room number {rec['room_number']} already exists")
                    continue
                db_classroom = models.Classroom(**rec)
                db.add(db_classroom)
                imported += 1
            except Exception as e:
                errors.append(f"Error in row {rec}: {str(e)}")
        db.commit()

    elif entity == "groups":
        for rec in records:
            try:
                required = ['group_id', 'department', 'semester']
                for field in required:
                    if pd.isna(rec.get(field)):
                        errors.append(f"Missing {field} in row: {rec}")
                        continue
                rec['semester'] = int(rec['semester'])
                # enrolled_courses can be a JSON string or list
                ec = rec.get('enrolled_courses')
                if ec and not pd.isna(ec):
                    # if it's a string like "[1,2,3]" parse it
                    if isinstance(ec, str):
                        import json
                        try:
                            rec['enrolled_courses'] = json.loads(ec)
                        except:
                            rec['enrolled_courses'] = []
                    else:
                        rec['enrolled_courses'] = ec
                else:
                    rec['enrolled_courses'] = []
                existing = db.query(models.StudentGroup).filter(models.StudentGroup.group_id == rec['group_id']).first()
                if existing:
                    errors.append(f"Group ID {rec['group_id']} already exists")
                    continue
                db_group = models.StudentGroup(**rec)
                db.add(db_group)
                imported += 1
            except Exception as e:
                errors.append(f"Error in row {rec}: {str(e)}")
        db.commit()

    return {
        "imported": imported,
        "errors": errors
    }