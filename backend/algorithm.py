import random
from typing import List, Dict, Optional, Tuple

DEBUG = True  # Set to False to silence debug prints

def debug_print(*args, **kwargs):
    if DEBUG:
        print(*args, **kwargs)

class Course:
    def __init__(self, id: int, faculty_id: int, student_group_ids: List[int] = None, duration: int = 1):
        self.id = id
        self.faculty_id = faculty_id
        self.student_group_ids = student_group_ids or []
        self.duration = duration

class Room:
    def __init__(self, id: int):
        self.id = id

class Faculty:
    def __init__(self, id: int, preferences: Dict[Tuple[int, int], float] = None):
        self.id = id
        self.preferences = preferences or {}

class TimetableSolver:
    """
    Backtracking solver that respects shift configurations with lunch breaks.
    """
    def __init__(self, courses: List[Course], rooms: List[Room], faculties: List[Faculty],
                 days=5, shift_config: dict = None):
        self.courses = courses
        self.rooms = rooms
        self.faculties = {f.id: f for f in faculties}
        self.days = days
        # Shift config defines the periods, including lunch markers
        self.shift_config = shift_config or {
            "periods": ["8:30-9:20", "9:20-10:10", "10:20-11:10", "11:10-12:00", "Lunch", "12:50-1:40", "1:40-2:20"]
        }
        # Actual teaching periods (excluding "Lunch")
        self.periods = [p for p in self.shift_config["periods"] if p != "Lunch"]
        self.period_count = len(self.periods)
        self.assignment = {}
        self.faculty_occupied = {}
        self.room_occupied = {}
        self.group_occupied = {}
        self.depth = 0

        # Precompute mapping from solver period index to full period index
        full_periods = self.shift_config["periods"]
        self.full_period_index = []
        for full_idx, p in enumerate(full_periods):
            if p != "Lunch":
                self.full_period_index.append(full_idx)

        # Find the index of "Lunch" in the full period list (if any)
        self.lunch_index = full_periods.index("Lunch") if "Lunch" in full_periods else -1

    def _crosses_lunch(self, start_solver_period: int, duration: int) -> bool:
        """Return True if the block of teaching periods crosses the lunch break."""
        if self.lunch_index == -1:
            return False
        # Get the full period indices of the first and last teaching period in the block
        start_full = self.full_period_index[start_solver_period]
        end_full = self.full_period_index[start_solver_period + duration - 1]
        # Crossing occurs if lunch lies strictly between start and end
        return start_full < self.lunch_index < end_full

    def is_valid(self, course: Course, day: int, period: int, room_id: int) -> bool:
        """
        Check if the course can be placed at (day, period) with given duration.
        Also ensures the block does not cross the lunch break.
        """
        if period + course.duration > self.period_count:
            return False

        # Prevent crossing the lunch break
        if self._crosses_lunch(period, course.duration):
            return False

        for p in range(period, period + course.duration):
            if self.faculty_occupied.get((course.faculty_id, day, p), False):
                return False
            if self.room_occupied.get((room_id, day, p), False):
                return False
            for g in course.student_group_ids:
                if self.group_occupied.get((g, day, p), False):
                    return False
        return True

    def assign(self, course: Course, day: int, period: int, room_id: int):
        assignments = []
        for p in range(period, period + course.duration):
            self.faculty_occupied[(course.faculty_id, day, p)] = True
            self.room_occupied[(room_id, day, p)] = True
            for g in course.student_group_ids:
                self.group_occupied[(g, day, p)] = True
            assignments.append((day, p, room_id))
        self.assignment[course.id] = assignments

    def unassign(self, course: Course):
        for (day, p, room_id) in self.assignment[course.id]:
            self.faculty_occupied[(course.faculty_id, day, p)] = False
            self.room_occupied[(room_id, day, p)] = False
            for g in course.student_group_ids:
                self.group_occupied[(g, day, p)] = False
        del self.assignment[course.id]

    def preference_score(self, course: Course, day: int, period: int) -> float:
        faculty = self.faculties.get(course.faculty_id)
        if not faculty:
            return 0.0
        total = 0.0
        for p in range(period, period + course.duration):
            if p >= self.period_count:
                return -float('inf')
            total += faculty.preferences.get((day, p), 0.0)
        return total

    def backtrack(self, index: int = 0) -> bool:
        indent = "  " * self.depth
        self.depth += 1
        if index >= len(self.courses):
            debug_print(f"{indent}✓ All courses placed successfully!")
            self.depth -= 1
            return True
        course = self.courses[index]
        debug_print(f"\n{indent}--- Trying course {course.id} (duration {course.duration}) ---")

        day_load = [0] * self.days
        for cid, assigns in self.assignment.items():
            if assigns:
                day_load[assigns[0][0]] += 1
        debug_print(f"{indent}Current day loads: {day_load}")

        slots = []
        for day in range(self.days):
            for period in range(self.period_count - course.duration + 1):
                slots.append((day, period))

        rooms = list(self.rooms)
        random.shuffle(rooms)

        options = []
        for (day, period) in slots:
            for room in rooms:
                if self.is_valid(course, day, period, room.id):
                    score = self.preference_score(course, day, period)
                    period_occupancy = sum(
                        1 for assigns in self.assignment.values()
                        for d, p, _ in assigns
                        if d == day and p == period
                    )
                    options.append((score, day_load[day], period_occupancy, day, period, room.id))
                    debug_print(f"{indent}  Valid option: day {day} (load {day_load[day]}), period {period}, room {room.id}, score {score}")

        if not options:
            debug_print(f"{indent}  ❌ No valid options – backtracking")
            self.depth -= 1
            return False

        # Sort options by load, period occupancy, then score descending
        options.sort(key=lambda x: (x[1], x[2], -x[0]))
        debug_print(f"{indent}  Sorted options (load, periodOcc, score, day, period, room):")
        for opt in options:
            debug_print(f"{indent}    load {opt[1]}, periodOcc {opt[2]}, score {opt[0]}, day {opt[3]}, period {opt[4]}, room {opt[5]}")

        # Group options by (load, periodOcc, score) to randomize within equal tiers
        tiered_options = {}
        for opt in options:
            key = (opt[1], opt[2], opt[0])  # (load, periodOcc, score)
            if key not in tiered_options:
                tiered_options[key] = []
            tiered_options[key].append(opt)

        # Process tiers in sorted order, but shuffle within each tier
        ordered_keys = sorted(tiered_options.keys())
        for key in ordered_keys:
            tier = tiered_options[key]
            random.shuffle(tier)
            for opt in tier:
                score, load, period_occ, day, period, room_id = opt
                debug_print(f"{indent}  Trying (from shuffled tier): day {day} (load {load}), period {period}, room {room_id}")
                self.assign(course, day, period, room_id)
                if self.backtrack(index + 1):
                    self.depth -= 1
                    return True
                self.unassign(course)
                debug_print(f"{indent}  Backtracking from day {day}, period {period}, room {room_id}")
        debug_print(f"{indent}  All options exhausted – backtracking")
        self.depth -= 1
        return False

    def solve(self) -> bool:
        self.courses.sort(key=lambda c: -c.duration)
        debug_print("=" * 60)
        debug_print("Starting solver...")
        debug_print(f"Courses: {[(c.id, c.duration) for c in self.courses]}")
        debug_print(f"Rooms: {[r.id for r in self.rooms]}")
        debug_print(f"Shift periods: {self.periods}")
        success = self.backtrack()
        if success:
            debug_print("✅ Solution found!")
        else:
            debug_print("❌ No solution found.")
        debug_print("=" * 60)
        return success

    def get_solution(self) -> List[Dict]:
        result = []
        for course_id, assigns in self.assignment.items():
            for (day, period, room_id) in assigns:
                result.append({"course_id": course_id, "day": day, "period": period, "room_id": room_id})
        debug_print("SOLUTION ASSIGNMENTS:", result)
        return result

    def calculate_fitness(self) -> float:
        total = 0.0
        for course_id, assigns in self.assignment.items():
            course = next((c for c in self.courses if c.id == course_id), None)
            if not course:
                continue
            faculty = self.faculties.get(course.faculty_id)
            if not faculty:
                continue
            for (day, period, _) in assigns:
                total += faculty.preferences.get((day, period), 0.0)
        return total