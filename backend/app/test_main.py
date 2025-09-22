from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_movies():
    response = client.get("/peliculas")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_and_delete_movie():
    movie_data = {
        "name": "Test Movie",
        "category": "Action",
        "year": 2023,
        "director": "Director Name",
        "duration": 120,
        "rating": 8.5
    }
    # Crear película
    response = client.post("/peliculas", json=movie_data)
    assert response.status_code == 200
    movie_id = response.json()["id"]

    # Borrar película creada
    response = client.delete(f"/peliculas/{movie_id}")
    assert response.status_code == 200
    assert response.json() == {"ok": True}

