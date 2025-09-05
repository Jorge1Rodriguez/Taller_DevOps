from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
import database

app = FastAPI()

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup():
    models.Base.metadata.create_all(bind=database.engine)

@app.get("/peliculas", response_model=list[schemas.Movie])
def read_movies(db: Session = Depends(get_db)):
    return crud.get_movies(db)

@app.get("/peliculas/{movie_id}", response_model=schemas.Movie)
def read_movie(movie_id: int, db: Session = Depends(get_db)):
    movie = crud.get_movie(db, movie_id)
    if movie is None:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@app.post("/peliculas", response_model=schemas.Movie)
def create_movie(movie: schemas.MovieCreate, db: Session = Depends(get_db)):
    return crud.create_movie(db, movie)

@app.put("/peliculas/{movie_id}", response_model=schemas.Movie)
def update_movie(movie_id: int, movie: schemas.MovieCreate, db: Session = Depends(get_db)):
    return crud.update_movie(db, movie_id, movie)

@app.delete("/peliculas/{movie_id}")
def delete_movie(movie_id: int, db: Session = Depends(get_db)):
    crud.delete_movie(db, movie_id)
    return {"ok": True}
