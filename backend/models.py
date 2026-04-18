from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    todos           = relationship("Todo", back_populates="owner", cascade="all, delete-orphan")

class Todo(Base):
    __tablename__ = "todos"
    id         = Column(Integer, primary_key=True, index=True)
    text       = Column(String, nullable=False)
    category   = Column(String, default="perso")
    done       = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner      = relationship("User", back_populates="todos")
