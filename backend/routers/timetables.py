from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
import auth
from algorithm import TimetableSolver, Course as AlgoCourse, Room as AlgoRoom, Faculty as AlgoFaculty
from datetime import datetime
import json

# Default shift configuration (matches frontend period names, no lunch)
DEFAULT_SHIFT_CONFIG = {
    "name": "Timetable",  # Changed from "Default" to "Timetable"
    "periods": ['9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00', '14:00-15:00', '15:00-16:00'],
}

router = APIRouter(prefix="/timetables", tags=["Timetables"])

@router.post("/generate", response_model=schemas.Timetable)
def generate_timetable(
    request: schemas.GenerateRequest,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    # Use default shift configuration (no frontend selection)
    shift_config = DEFAULT_SHIFT_CONFIG
    shift = "default"  # stored in DB

    course_ids = request.course_ids
    db_courses = db.query(models.Course).filter(models.Course.id.in_(course_ids)).all()
    if len(db_courses) != len(course_ids):
        raise HTTPException(status_code=400, detail="Some courses not found")

    db_rooms = db.query(models.Classroom).all()
    if not db_rooms:
        raise HTTPException(status_code=400, detail="No rooms available")

    algo_courses = []
    faculties_dict = {}
    for c in db_courses:
        if c.faculty_id is None:
            raise HTTPException(status_code=400, detail=f"Course {c.id} has no faculty assigned")

        fac = db.query(models.Faculty).filter(models.Faculty.id == c.faculty_id).first()
        if not fac:
            raise HTTPException(status_code=400, detail=f"Faculty not found for course {c.id}")

        # Parse faculty preferences
        prefs = fac.preferences or {}
        faculty_prefs = {}
        if isinstance(prefs, dict):
            for key, weight in prefs.items():
                try:
                    day, period = map(int, key.split('-'))
                    faculty_prefs[(day, period)] = float(weight)
                except (ValueError, AttributeError):
                    continue

        faculties_dict[fac.id] = AlgoFaculty(id=fac.id, preferences=faculty_prefs)

        # Find student groups that take this course
        groups = db.query(models.StudentGroup).filter(
            models.StudentGroup.enrolled_courses.contains(f'[{c.id}]')
        ).all()
        group_ids = [g.id for g in groups]

        duration = c.duration if c.duration else 1
        algo_courses.append(AlgoCourse(
            id=c.id,
            faculty_id=c.faculty_id,
            student_group_ids=group_ids,
            duration=duration
        ))

    algo_rooms = [AlgoRoom(id=r.id) for r in db_rooms]
    algo_faculties = list(faculties_dict.values())

    # Debug prints (optional GA parameters are logged but not used yet)
    print("\n" + "="*60)
    print("GENERATE TIMETABLE REQUEST")
    print("="*60)
    print(f"Course IDs: {course_ids}")
    print(f"GA Parameters (for future use): pop={request.population_size}, gen={request.generations}, mr={request.mutation_rate}, cr={request.crossover_rate}")
    print(f"Algo courses: {[(c.id, c.duration, c.faculty_id, c.student_group_ids) for c in algo_courses]}")
    print(f"Algo rooms: {[r.id for r in algo_rooms]}")
    print(f"Algo faculties: {[f.id for f in algo_faculties]}")
    print("="*60)

    # Run the solver (backtracking, ignores GA parameters for now)
    solver = TimetableSolver(algo_courses, algo_rooms, algo_faculties, days=5, shift_config=shift_config)
    success = solver.solve()
    if not success:
        print("❌ SOLVER FAILED TO FIND A SOLUTION")
        raise HTTPException(status_code=400, detail="Could not generate a valid timetable. Try adding more rooms or time slots.")

    solution = solver.get_solution()
    fitness = solver.calculate_fitness()

    print("✅ SOLUTION FOUND")
    print(f"Solution: {solution}")
    print(f"Fitness: {fitness}")
    print("="*60 + "\n")

    # ✅ FIXED: Use a clean timetable name (no "Default" prefix)
    new_timetable = models.Timetable(
        name=f"Timetable - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        generation_date=datetime.now(),
        fitness_score=fitness,
        is_published=False,
        timetable_data=json.dumps(solution),
        conflict_report=None,
        shift=shift
    )
    db.add(new_timetable)
    db.commit()
    db.refresh(new_timetable)

    return new_timetable


# -------------------- OTHER ENDPOINTS (unchanged) --------------------
@router.get("/", response_model=List[schemas.Timetable])
def read_timetables(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    timetables = db.query(models.Timetable).order_by(models.Timetable.generation_date.desc()).offset(skip).limit(limit).all()
    return timetables

@router.post("/{timetable_id}/publish", response_model=schemas.Timetable)
def publish_timetable(
    timetable_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    tt = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")
    if tt.is_published:
        raise HTTPException(status_code=400, detail="Timetable already published")
    tt.is_published = True
    db.commit()
    db.refresh(tt)
    return tt

@router.delete("/{timetable_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timetable(
    timetable_id: int,
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    tt = db.query(models.Timetable).filter(models.Timetable.id == timetable_id).first()
    if not tt:
        raise HTTPException(status_code=404, detail="Timetable not found")
    db.delete(tt)
    db.commit()
    return None
@router.get("/faculty/me", response_model=List[schemas.TimetableAssignment])
def get_my_faculty_timetable(
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.get_current_active_user)
):
    if current_user.role != 'faculty':
        raise HTTPException(status_code=403, detail="Only faculty can access this endpoint")

    faculty = db.query(models.Faculty).filter(models.Faculty.email == current_user.email).first()
    if not faculty:
        raise HTTPException(status_code=404, detail="Faculty record not found for this user")

    published = db.query(models.Timetable).filter(models.Timetable.is_published == True).order_by(models.Timetable.generation_date.desc()).first()
    if not published:
        return []  # ✅ Return empty list, not 404

    try:
        all_assignments = json.loads(published.timetable_data)
    except:
        raise HTTPException(status_code=500, detail="Invalid timetable data")

    course_ids = [c.id for c in db.query(models.Course).filter(models.Course.faculty_id == faculty.id).all()]
    filtered = [a for a in all_assignments if a.get('course_id') in course_ids]
    return filtered


@router.get("/student/me", response_model=List[schemas.TimetableAssignment])
def get_my_student_timetable(
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.get_current_active_user)
):
    if current_user.role != 'student':
        raise HTTPException(status_code=403, detail="Only students can access this endpoint")
    if not current_user.student_group_id:
        raise HTTPException(status_code=400, detail="User is not assigned to any student group")

    published = db.query(models.Timetable).filter(models.Timetable.is_published == True).order_by(models.Timetable.generation_date.desc()).first()
    if not published:
        return []  # ✅ Return empty list, not 404

    try:
        all_assignments = json.loads(published.timetable_data)
    except Exception:
        raise HTTPException(status_code=500, detail="Invalid timetable data")

    group = db.query(models.StudentGroup).filter(models.StudentGroup.id == current_user.student_group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Student group not found")
    enrolled_course_ids = group.enrolled_courses or []

    filtered = [a for a in all_assignments if a.get('course_id') in enrolled_course_ids]
    return filtered