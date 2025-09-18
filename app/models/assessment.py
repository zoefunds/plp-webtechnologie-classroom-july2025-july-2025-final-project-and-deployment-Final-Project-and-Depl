class Assessment(Base):
    __tablename__ = 'assessments'

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'))
    title = Column(String(200), nullable=False)
    description = Column(Text)
    passing_score = Column(Integer)
    
    questions = relationship("AssessmentQuestion", back_populates="assessment")
    attempts = relationship("AssessmentAttempt", back_populates="assessment")

class AssessmentQuestion(Base):
    __tablename__ = 'assessment_questions'

    id = Column(Integer, primary_key=True)
    assessment_id = Column(Integer, ForeignKey('assessments.id'))
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50))  # multiple_choice, true_false, etc.
    correct_answer = Column(String(500))
    options = Column(JSON)  # For multiple choice questions

class AssessmentAttempt(Base):
    __tablename__ = 'assessment_attempts'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    assessment_id = Column(Integer, ForeignKey('assessments.id'))
    score = Column(Float)
    completed = Column(Boolean, default=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)