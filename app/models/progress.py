from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class CourseProgress(Base):
    __tablename__ = 'course_progress'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    course_id = Column(Integer, ForeignKey('courses.id'))
    progress_percentage = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="course_progress")
    course = relationship("Course", back_populates="progress")