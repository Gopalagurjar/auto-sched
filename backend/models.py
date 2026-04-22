from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, Float, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)

    # ✅ FIXED ENUM
    role = Column(
        Enum('admin', 'faculty', 'student', name="user_role_enum"),
        nullable=False
    )

    full_name = Column(String(100), nullable=False)
    student_group_id = Column(Integer, ForeignKey("student_groups.id", ondelete="SET NULL"), nullable=True)

    student_group = relationship("StudentGroup", back_populates="users")
    password_reset_tokens = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    max_hours = Column(Integer, nullable=False)
    preferences = Column(JSON, nullable=True)

    courses = relationship("Course", back_populates="faculty", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    course_code = Column(String(20), unique=True, index=True, nullable=False)
    course_name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)
    lecture_hours = Column(Integer, nullable=False)
    tutorial_hours = Column(Integer, nullable=False)
    practical_hours = Column(Integer, nullable=False)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    duration = Column(Integer, default=1, nullable=False)

    faculty = relationship("Faculty", back_populates="courses")


class Classroom(Base):
    __tablename__ = "classrooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(20), unique=True, index=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    room_type = Column(String(50), nullable=False)
    equipment = Column(JSON, nullable=True)


class StudentGroup(Base):
    __tablename__ = "student_groups"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(String(20), unique=True, index=True, nullable=False)
    department = Column(String(50), nullable=False)
    semester = Column(Integer, nullable=False)
    enrolled_courses = Column(JSON, nullable=True)

    users = relationship("User", back_populates="student_group")


class Constraint(Base):
    __tablename__ = "constraints"

    id = Column(Integer, primary_key=True, index=True)

    # ✅ FIXED ENUM
    type = Column(
        Enum('hard', 'soft', name="constraint_type_enum"),
        nullable=False
    )

    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    penalty_weight = Column(Float, default=1.0)
    is_active = Column(Boolean, default=True)
    parameters = Column(JSON, nullable=True)


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    generation_date = Column(DateTime, server_default=func.now())
    fitness_score = Column(Float, nullable=True)
    is_published = Column(Boolean, default=False)
    timetable_data = Column(JSON, nullable=False)
    conflict_report = Column(JSON, nullable=True)
    shift = Column(String(10), nullable=True)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), ForeignKey("users.email", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(100), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="password_reset_tokens", foreign_keys=[email])
