from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

event_attendees = Table('event_attendees', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('event_id', Integer, ForeignKey('events.id'))
)

class Event(Base):
    __tablename__ = 'events'

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    datetime = Column(DateTime, nullable=False)
    duration = Column(Integer)  # in minutes
    image_url = Column(String(500))
    max_attendees = Column(Integer)
    current_attendees = Column(Integer, default=0)
    speaker_id = Column(Integer, ForeignKey('users.id'))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    speaker = relationship("User", foreign_keys=[speaker_id])
    attendees = relationship("User", secondary=event_attendees, back_populates="events")
    
class EventRegistration(Base):
    __tablename__ = 'event_registrations'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    event_id = Column(Integer, ForeignKey('events.id'))
    registration_date = Column(DateTime, default=datetime.utcnow)
    attended = Column(Boolean, default=False)
    feedback_submitted = Column(Boolean, default=False)

    user = relationship("User", back_populates="event_registrations")
    event = relationship("Event", back_populates="registrations")