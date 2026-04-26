from fastapi import APIRouter, Depends
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
    try:
        latest = db.query(models.Timetable).filter(
            models.Timetable.is_published == True
        ).order_by(models.Timetable.generation_date.desc()).first()

        if not latest:
            return [{"name": d, "count": 0} for d in ['Mon','Tue','Wed','Thu','Fri']]

        try:
            assignments = json.loads(latest.timetable_data)
        except:
            return [{"name": d, "count": 0} for d in ['Mon','Tue','Wed','Thu','Fri']]

        days = [0] * 5
        for a in assignments:
            day = a.get('day', 0)
            if 0 <= day < 5:
                days[day] += 1

        return [{"name": day, "count": days[i]} for i, day in enumerate(['Mon','Tue','Wed','Thu','Fri'])]

    except Exception as e:
        print(f"room-utilization error: {e}")
        return [{"name": d, "count": 0} for d in ['Mon','Tue','Wed','Thu','Fri']]


@router.get("/faculty-load")
def get_faculty_load(
    db: Session = Depends(auth.get_db),
    current_user = Depends(auth.require_admin)
):
    try:
        latest = db.query(models.Timetable).filter(
            models.Timetable.is_published == True
        ).order_by(models.Timetable.generation_date.desc()).first()

        if not latest:
            return []

        try:
            assignments = json.loads(latest.timetable_data)
        except:
            return []

        courses = {c.id: c.faculty_id for c in db.query(models.Course).all()}
        faculty_load = {}
        for a in assignments:
            fac_id = courses.get(a.get('course_id'))
            if fac_id:
                faculty_load[fac_id] = faculty_load.get(fac_id, 0) + 1

        faculty_names = {f.id: f.name for f in db.query(models.Faculty).all()}
        return [
            {"name": faculty_names.get(fid, f"Faculty {fid}"), "load": count}
            for fid, count in faculty_load.items()
        ]

    except Exception as e:
        print(f"faculty-load error: {e}")
        return []
