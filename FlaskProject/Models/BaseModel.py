from database import db
from datetime import datetime


class BaseModel(db.Model):
    """
    Base model with common fields for all database models.
    Provides created_at and updated_at timestamps for audit trails and synchronization.
    """
    __abstract__ = True

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
