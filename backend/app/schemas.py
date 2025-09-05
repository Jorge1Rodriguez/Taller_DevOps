from pydantic import BaseModel

class MovieBase(BaseModel):
    name: str
    category: str
    year: int
    director: str
    duration: int
    rating: float

class MovieCreate(MovieBase):
    pass

class Movie(MovieBase):
    id: int

    class Config:
        orm_mode = True
