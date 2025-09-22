import os
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "db")
DB_NAME = os.getenv("DB_NAME", "movies_db")
DB_PORT = os.getenv("DB_PORT", "5432")

SQLALCHEMY_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def wait_for_db(engine, max_retries=10, delay=3):
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                print("Base de datos lista.")
                return
        except OperationalError:
            print(f"Base de datos no disponible, reintentando {attempt + 1}/{max_retries} en {delay} segundos...")
            time.sleep(delay)
    raise Exception("No se pudo conectar a la base de datos después de varios intentos.")
