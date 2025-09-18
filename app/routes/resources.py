from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.resource import (
    Resource,
    ResourceDownload,
    ResourceView,
    HealthcareFacility,
    EmergencyContact
)
from app.schemas.resource import (
    ResourceResponse,
    ResourceCreate,
    FacilityResponse,
    EmergencyContactResponse,
    ResourceDownloadCreate,
    ResourceViewCreate
)
from app.auth.dependencies import get_current_user

router = APIRouter()

@router.get("/resources/facilities", response_model=List[FacilityResponse])
async def list_facilities(
    latitude: float = Query(None),
    longitude: float = Query(None),
    radius: float = Query(10.0),  # Default 10km radius
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(HealthcareFacility)
    
    if latitude and longitude:
        # Calculate facilities within radius using PostGIS
        query = query.filter(
            func.ST_DWithin(
                func.ST_SetSRID(
                    func.ST_MakePoint(HealthcareFacility.longitude, HealthcareFacility.latitude),
                    4326
                ),
                func.ST_SetSRID(
                    func.ST_MakePoint(longitude, latitude),
                    4326
                ),
                radius * 1000  # Convert km to meters
            )
        )
    
    facilities = query.all()
    return facilities

@router.get("/resources/emergency-contacts", response_model=List[EmergencyContactResponse])
async def get_emergency_contacts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    contacts = db.query(EmergencyContact).all()
    return contacts

@router.get("/resources/{resource_id}")
async def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@router.post("/resources/{resource_id}/download")
async def download_resource(
    resource_id: int,
    download: ResourceDownloadCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Record download
    download_record = ResourceDownload(
        resource_id=resource_id,
        user_id=current_user.id,
        downloaded_at=datetime.utcnow(),
        ip_address=download.ip_address
    )
    db.add(download_record)
    
    # Update download count
    resource.download_count += 1
    
    db.commit()
    
    # Return file
    return FileResponse(
        path=resource.file_path,
        filename=resource.filename,
        media_type=resource.content_type
    )

@router.post("/resources/track-view")
async def track_resource_view(
    view: ResourceViewCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    view_record = ResourceView(
        resource_id=view.resource_id,
        user_id=current_user.id,
        viewed_at=datetime.utcnow(),
        ip_address=view.ip_address
    )
    db.add(view_record)
    db.commit()
    return {"success": True}

@router.get("/resources/search")
async def search_resources(
    query: str = Query(None),
    category: str = Query(None),
    type: str = Query(None),
    sort_by: str = Query("relevance"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    search_query = db.query(Resource)

    if query:
        search_query = search_query.filter(
            or_(
                Resource.title.ilike(f"%{query}%"),
                Resource.description.ilike(f"%{query}%")
            )
        )

    if category:
        search_query = search_query.filter(Resource.category == category)

    if type:
        search_query = search_query.filter(Resource.type == type)

    # Apply sorting
    if sort_by == "popular":
        search_query = search_query.order_by(Resource.download_count.desc())
    elif sort_by == "recent":
        search_query = search_query.order_by(Resource.created_at.desc())
    elif sort_by == "relevance" and query:
        # Implement full-text search ranking if available
        pass

    resources = search_query.all()
    return resources

@router.get("/resources/recommended")
async def get_recommended_resources(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Get user's recent views and downloads
    recent_interactions = db.query(
        ResourceView.resource_id,
        ResourceDownload.resource_id
    ).filter(
        or_(
            ResourceView.user_id == current_user.id,
            ResourceDownload.user_id == current_user.id
        )
    ).order_by(
        func.coalesce(ResourceView.viewed_at, ResourceDownload.downloaded_at).desc()
    ).limit(10).all()

    # Get similar resources based on categories and tags
    recent_resource_ids = [r[0] for r in recent_interactions if r[0]]
    if recent_resource_ids:
        similar_resources = db.query(Resource).filter(
            and_(
                Resource.id.notin_(recent_resource_ids),
                or_(
                    Resource.category.in_(db.query(Resource.category).filter(
                        Resource.id.in_(recent_resource_ids)
                    )),
                    Resource.tags.overlap(db.query(Resource.tags).filter(
                        Resource.id.in_(recent_resource_ids)
                    ))
                )
            )
        ).order_by(
            Resource.download_count.desc()
        ).limit(5).all()
        
        return similar_resources
    
    # If no recent interactions, return popular resources
    return db.query(Resource).order_by(
        Resource.download_count.desc()
    ).limit(5).all()