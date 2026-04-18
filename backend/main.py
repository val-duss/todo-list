from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError
from pydantic import BaseModel, field_validator
from typing import Optional

import models
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ── Schemas ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    password: str

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Au moins 3 caractères requis")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Au moins 6 caractères requis")
        return v

class TodoCreate(BaseModel):
    text: str
    category: str = "perso"

class TodoUpdate(BaseModel):
    done: Optional[bool] = None
    text: Optional[str] = None
    category: Optional[str] = None

# ── Auth dependency ───────────────────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        username = auth.decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable")
    return user

# ── Auth routes ───────────────────────────────────────────────────────────────

@app.post("/auth/register", status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == data.username).first():
        raise HTTPException(status_code=400, detail="Nom d'utilisateur déjà pris")
    user = models.User(
        username=data.username,
        hashed_password=auth.hash_password(data.password),
    )
    db.add(user)
    db.commit()
    return {"access_token": auth.create_access_token(user.username), "username": user.username}

@app.post("/auth/login")
def login(data: UserCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == data.username).first()
    if not user or not auth.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    return {"access_token": auth.create_access_token(user.username), "username": user.username}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/auth/me")
def me(current_user=Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username}

# ── Todo routes ───────────────────────────────────────────────────────────────

@app.get("/todos")
def get_todos(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(models.Todo)
        .filter(models.Todo.user_id == current_user.id)
        .order_by(models.Todo.created_at.desc())
        .all()
    )

@app.post("/todos", status_code=201)
def create_todo(data: TodoCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    todo = models.Todo(**data.model_dump(), user_id=current_user.id)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo

# Must be defined BEFORE /todos/{todo_id} to avoid route conflict
@app.delete("/todos/completed", status_code=204)
def delete_completed(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Todo).filter(
        models.Todo.user_id == current_user.id,
        models.Todo.done == True,
    ).delete()
    db.commit()

@app.patch("/todos/{todo_id}")
def update_todo(todo_id: int, data: TodoUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    for k, v in data.model_dump(exclude_none=True).items():
        setattr(todo, k, v)
    db.commit()
    db.refresh(todo)
    return todo

@app.delete("/todos/{todo_id}", status_code=204)
def delete_todo(todo_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    todo = db.query(models.Todo).filter(
        models.Todo.id == todo_id,
        models.Todo.user_id == current_user.id,
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Tâche introuvable")
    db.delete(todo)
    db.commit()
