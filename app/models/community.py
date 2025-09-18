from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database import Base

class ForumTopic(Base):
    __tablename__ = 'forum_topics'

    id = Column(Integer, primary_key=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    author_id = Column(Integer, ForeignKey('users.id'))
    
    author = relationship("User", back_populates="topics")
    replies = relationship("TopicReply", back_populates="topic")

class TopicReply(Base):
    __tablename__ = 'topic_replies'

    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    topic_id = Column(Integer, ForeignKey('forum_topics.id'))
    author_id = Column(Integer, ForeignKey('users.id'))

    topic = relationship("ForumTopic", back_populates="replies")
    author = relationship("User", back_populates="replies")