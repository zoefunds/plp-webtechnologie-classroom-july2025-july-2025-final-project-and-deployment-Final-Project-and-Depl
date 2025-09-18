from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from app.database import Base

class UserConsent(Base):
    __tablename__ = 'user_consents'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    consent_type = Column(String(50))  # e.g., 'data_collection', 'marketing'
    granted = Column(Boolean, default=False)
    granted_at = Column(DateTime)
    revoked_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45))
    user_agent = Column(String(200))

class ConsentManager:
    def __init__(self, db_session):
        self.db = db_session

    async def record_consent(self, user_id: int, consent_type: str, granted: bool,
                           ip_address: str, user_agent: str):
        consent = UserConsent(
            user_id=user_id,
            consent_type=consent_type,
            granted=granted,
            granted_at=datetime.utcnow() if granted else None,
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.add(consent)
        await self.db.commit()

    async def revoke_consent(self, user_id: int, consent_type: str):
        consent = await self.db.query(UserConsent).filter(
            UserConsent.user_id == user_id,
            UserConsent.consent_type == consent_type,
            UserConsent.revoked_at.is_(None)
        ).first()
        
        if consent:
            consent.revoked_at = datetime.utcnow()
            await self.db.commit()