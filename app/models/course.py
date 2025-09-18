from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Course(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    category = Column(String(100), nullable=False)
    level = Column(String(50), nullable=False)
    duration = Column(Integer)  # in minutes
    image_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    instructor_id = Column(Integer, ForeignKey('users.id'))

    # Relationships
    instructor = relationship("User", back_populates="courses")
    modules = relationship("Module", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")

class Module(Base):
    __tablename__ = 'modules'

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    order = Column(Integer, nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'))

    course = relationship("Course", back_populates="modules")
    lessons = relationship("Lesson", back_populates="module")

class Lesson(Base):
    __tablename__ = 'lessons'

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    content = Column(Text)
    type = Column(String(50))  # video, article, quiz, etc.
    duration = Column(Integer)  # in minutes
    order = Column(Integer, nullable=False)
    module_id = Column(Integer, ForeignKey('modules.id'))

    module = relationship("Module", back_populates="lessons")