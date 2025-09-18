from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.course import Course, CourseEnrollment, CourseProgress
from app.schemas.course import (
    CourseCreate,
    CourseResponse,
    CourseFilter,
    EnrollmentCreate,
    ProgressUpdate
)
from app.auth.dependencies import get_current_user

router = APIRouter()

@router.get("/courses", response_model=List[CourseResponse])
async def list_courses(
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Course)

    # Apply filters
    if category:
        query = query.filter(Course.category == category)
    if level:
        query = query.filter(Course.level == level)
    if search:
        query = query.filter(
            Course.title.ilike(f"%{search}%") |
            Course.description.ilike(f"%{search}%")
        )

    # Apply sorting
    if sort_by == "popular":
        query = query.order_by(Course.enrolled_count.desc())
    elif sort_by == "newest":
        query = query.order_by(Course.created_at.desc())
    elif sort_by == "rating":
        query = query.order_by(Course.average_rating.desc())

    # Get user progress for enrolled courses
    courses = query.offset(skip).limit(limit).all()
    for course in courses:
        progress = db.query(CourseProgress).filter(
            CourseProgress.course_id == course.id,
            CourseProgress.user_id == current_user.id
        ).first()
        if progress:
            course.user_progress = progress.progress_percentage

    return courses

@router.post("/courses/filter")
async def filter_courses(
    filters: CourseFilter,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Course)

    if filters.categories:
        query = query.filter(Course.category.in_(filters.categories))
    if filters.level:
        query = query.filter(Course.level == filters.level)
    if filters.duration:
        # Implement duration filtering logic based on your duration format
        pass

    return query.all()

@router.post("/courses/enroll")
async def enroll_in_course(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Check if already enrolled
    existing_enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == enrollment.course_id,
        CourseEnrollment.user_id == current_user.id
    ).first()

    if existing_enrollment:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    # Check if course exists and is available
    course = db.query(Course).filter(Course.id == enrollment.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course.is_premium and not current_user.is_premium:
        raise HTTPException(status_code=403, detail="Premium subscription required")

    # Create enrollment
    new_enrollment = CourseEnrollment(
        course_id=enrollment.course_id,
        user_id=current_user.id,
        enrolled_at=datetime.utcnow()
    )
    db.add(new_enrollment)

    # Initialize progress
    progress = CourseProgress(
        course_id=enrollment.course_id,
        user_id=current_user.id,
        progress_percentage=0,
        last_accessed=datetime.utcnow()
    )
    db.add(progress)

    # Update course enrollment count
    course.enrolled_count += 1

    db.commit()
    return {"success": True}

@router.get("/users/{user_id}/progress")
async def get_user_progress(
    user_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this progress")

    progress = db.query(CourseProgress).filter(
        CourseProgress.user_id == user_id
    ).all()

    return {
        "overallProgress": calculate_overall_progress(progress),
        "courses": [
            {
                "id": p.course_id,
                "progress": p.progress_percentage,
                "lastAccessed": p.last_accessed
            } for p in progress
        ]
    }

@router.put("/courses/{course_id}/progress")
async def update_course_progress(
    course_id: int,
    progress_update: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    progress = db.query(CourseProgress).filter(
        CourseProgress.course_id == course_id,
        CourseProgress.user_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(status_code=404, detail="Course progress not found")

    progress.progress_percentage = progress_update.progress_percentage
    progress.last_accessed = datetime.utcnow()

    if progress.progress_percentage == 100:
        # Handle course completion
        handle_course_completion(db, current_user.id, course_id)

    db.commit()
    return {"success": True}

def calculate_overall_progress(progress_records):
    if not progress_records:
        return 0
    total_progress = sum(p.progress_percentage for p in progress_records)
    return round(total_progress / len(progress_records), 2)

def handle_course_completion(db, user_id, course_id):
    # Add completion record
    completion = CourseCompletion(
        user_id=user_id,
        course_id=course_id,
        completed_at=datetime.utcnow()
    )
    db.add(completion)

    # Issue certificate if available
    course = db.query(Course).filter(Course.id == course_id).first()
    if course.has_certificate:
        certificate = Certificate(
            user_id=user_id,
            course_id=course_id,
            issued_at=datetime.utcnow()
        )
        db.add(certificate)

    # Update user achievements
    update_user_achievements(db, user_id, course_id)