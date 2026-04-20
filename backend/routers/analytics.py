from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import models
import auth

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/room-utilization")
def get_room_utilization(
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    # Get the latest published timetable
    latest = db.query(models.Timetable).filter(models.Timetable.is_published == True).order_by(models.Timetable.generation_date.desc()).first()
    if not latest:
        return [{"name": d, "count": 0} for d in ['Mon','Tue','Wed','Thu','Fri']]
    try:
        assignments = json.loads(latest.timetable_data)
    except:
        return []
    # Count assignments per day
    days = [0]*5
    for a in assignments:
        days[a['day']] += 1
    return [{"name": day, "count": days[i]} for i, day in enumerate(['Mon','Tue','Wed','Thu','Fri'])]

@router.get("/faculty-load")
def get_faculty_load(
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    # Get the latest published timetable
    latest = db.query(models.Timetable).filter(models.Timetable.is_published == True).order_by(models.Timetable.generation_date.desc()).first()
    if not latest:
        return []
    try:
        assignments = json.loads(latest.timetable_data)
    except:
        return []
    # Count assignments per faculty (by mapping course_id to faculty_id)
    # We need to fetch all courses
    courses = {c.id: c.faculty_id for c in db.query(models.Course).all()}
    faculty_load = {}
    for a in assignments:
        fac_id = courses.get(a['course_id'])
        if fac_id:
            faculty_load[fac_id] = faculty_load.get(fac_id, 0) + 1
    # Get faculty names
    faculty_names = {f.id: f.name for f in db.query(models.Faculty).all()}
    result = [{"name": faculty_names.get(fid, f"Faculty {fid}"), "load": count} for fid, count in faculty_load.items()]
    return result