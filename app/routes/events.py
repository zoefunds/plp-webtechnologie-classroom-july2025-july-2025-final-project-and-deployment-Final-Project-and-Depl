from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.event import Event, EventRegistration
from app.schemas.event import EventCreate, EventUpdate, EventResponse
from app.auth.dependencies import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/events", response_model=List[EventResponse])
async def list_events(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    current_time = datetime.utcnow()
    events = db.query(Event)\
        .filter(Event.datetime > current_time)\
        .order_by(Event.datetime)\
        .offset(skip)\
        .limit(limit)\
        .all()
    return events

@router.post("/events/register")
async def register_for_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    if event.current_attendees >= event.max_attendees:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event is full"
        )

    existing_registration = db.query(EventRegistration)\
        .filter(
            EventRegistration.user_id == current_user.id,
            EventRegistration.event_id == event_id
        ).first()

    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this event"
        )

    registration = EventRegistration(
        user_id=current_user.id,
        event_id=event_id
    )
    
    event.current_attendees += 1
    
    db.add(registration)
    db.commit()
    
    return {"message": "Successfully registered for the event"}

@router.get("/events/{event_id}", response_model=EventResponse)
async def get_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return event