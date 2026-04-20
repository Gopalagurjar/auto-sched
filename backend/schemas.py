from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str

    class Config:
        from_attributes = True

# Token schema
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: Optional[str] = None
    faculty_id: Optional[int] = None
    student_group_id: Optional[int] = None

class TokenData(BaseModel):
    username: Optional[str] = None

# Course schemas
class CourseBase(BaseModel):
    course_code: str
    course_name: str
    department: str
    semester: int
    lecture_hours: int
    tutorial_hours: int
    practical_hours: int
    faculty_id: Optional[int] = None

class CourseCreate(CourseBase):
    pass

class CourseUpdate(CourseBase):
    pass

class Course(CourseBase):
    id: int

    class Config:
        from_attributes = True

# Faculty schemas
class FacultyBase(BaseModel):
    faculty_id: str
    name: str
    email: EmailStr
    department: str
    max_hours: int
    preferences: Optional[Any] = None

class FacultyCreate(FacultyBase):
    pass

class FacultyUpdate(FacultyBase):
    pass

class Faculty(FacultyBase):
    id: int

    class Config:
        from_attributes = True

# Classroom schemas
class ClassroomBase(BaseModel):
    room_number: str
    capacity: int
    room_type: str
    equipment: Optional[Any] = None

class ClassroomCreate(ClassroomBase):
    pass

class ClassroomUpdate(ClassroomBase):
    pass

class Classroom(ClassroomBase):
    id: int

    class Config:
        from_attributes = True

# StudentGroup schemas
class StudentGroupBase(BaseModel):
    group_id: str
    department: str
    semester: int
    enrolled_courses: Optional[Any] = None

class StudentGroupCreate(StudentGroupBase):
    pass

class StudentGroupUpdate(StudentGroupBase):
    pass

class StudentGroup(StudentGroupBase):
    id: int

    class Config:
        from_attributes = True

# Constraint schemas
class ConstraintBase(BaseModel):
    type: str
    name: str
    description: Optional[str] = None
    penalty_weight: float = 1.0
    is_active: bool = True
    parameters: Optional[Any] = None

class ConstraintCreate(ConstraintBase):
    pass

class ConstraintUpdate(ConstraintBase):
    pass

class Constraint(ConstraintBase):
    id: int

    class Config:
        from_attributes = True

# Timetable schemas
class TimetableBase(BaseModel):
    name: str
    fitness_score: Optional[float] = None
    is_published: bool = False
    timetable_data: Any
    conflict_report: Optional[Any] = None

class TimetableCreate(TimetableBase):
    pass

class Timetable(TimetableBase):
    id: int
    generation_date: str

    class Config:
        from_attributes = True

# ✅ REQUEST SCHEMA FOR GENERATION – matches frontend exactly
class GenerateRequest(BaseModel):
    course_ids: List[int]
    population_size: Optional[int] = 100
    generations: Optional[int] = 200
    mutation_rate: Optional[float] = 0.1
    crossover_rate: Optional[float] = 0.8

    class Config:
        extra = "ignore"   # Ignores any unexpected fields (safety)

# TimetableAssignment for faculty/student views
class TimetableAssignment(BaseModel):
    course_id: int
    day: int
    period: int
    room_id: int

    class Config:
        from_attributes = True