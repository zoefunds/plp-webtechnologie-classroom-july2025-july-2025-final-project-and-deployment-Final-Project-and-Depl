from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from app.database import Base

class NotificationType(Enum):
    COURSE_UPDATE = "course_update"
    EVENT_REMINDER = "event_reminder"
    FORUM_REPLY = "forum_reply"
    ASSESSMENT_GRADE = "assessment_grade"
    SYSTEM_ALERT = "system_alert"

class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    type = Column(SQLEnum(NotificationType))
    title = Column(String(200))
    message = Column(Text)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class NotificationService:
    def __init__(self, db_session):
        self.db = db_session

    async def send_notification(self, user_id, type, title, message):
        notification = Notification(
            user_id=user_id,
            type=type,
            title=title,
            message=message
        )
        self.db.add(notification)
        await self.db.commit()
        
        # Send real-time notification if user is online
        await self.send_realtime_notification(user_id, notification)
        
        # Send email notification based on user preferences
        await self.send_email_notification(user_id, notification)

    async def mark_as_read(self, notification_id, user_id):
        notification = await self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.read = True
            await self.db.commit()