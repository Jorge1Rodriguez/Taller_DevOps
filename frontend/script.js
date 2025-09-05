const API_BASE_URL = 'http://localhost:8000'; // Cambia según sea necesario

let movies = [];
let editingMovieId = null;

document.addEventListener('DOMContentLoaded', function () {
    loadMovies();
    setupFormHandlers();
});

async function loadMovies() {
    showLoading(true);
    hideMessages();
    try {
        const response = await fetch(`${API_BASE_URL}/peliculas`);
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        movies = await response.json();
        renderMovies();
        updateStats();
        showSuccessMessage('Películas cargadas exitosamente');
    } catch (error) {
        showErrorMessage('Error al conectar con la API. Verifica que el servidor esté ejecutándose en ' + API_BASE_URL);
        movies = [];
        renderMovies();
        updateStats();
    } finally {
        showLoading(false);
    }
}

function updateStats() {
    const totalMovies = movies.length;
    const avgRating = totalMovies > 0 ? (movies.reduce((sum, movie) => sum + (movie.calificacion || 0), 0) / totalMovies).toFixed(1) : '0.0';
    const uniqueGenres = new Set(movies.map(movie => movie.categoria).filter(Boolean)).size;
    document.getElementById('totalMovies').textContent = totalMovies;
    document.getElementById('avgRating').textContent = avgRating;
    document.getElementById('totalGenres').textContent = uniqueGenres;
}

function renderMovies() {
    const grid = document.getElementById('moviesGrid');
    const noMovies = document.getElementById('noMovies');
    if (movies.length === 0) {
        grid.innerHTML = '';
        grid.appendChild(noMovies);
        noMovies.style.display = 'block';
        return;
    }
    noMovies.style.display = 'none';
    grid.innerHTML = movies.map(movie => `
        <div class="movie-card">
            <div class="movie-poster">🎭</div>
            <div class="movie-info">
                <h3 class="movie-title">${escapeHtml(movie.nombre || 'Sin nombre')}</h3>
                <div class="movie-details">
                    <div class="movie-detail"><strong>Categoría:</strong> ${escapeHtml(movie.categoria || 'N/A')}</div>
                    <div class="movie-detail"><strong>Año:</strong> ${movie.año || 'N/A'}</div>
                    <div class="movie-detail"><strong>Director:</strong> ${escapeHtml(movie.director || 'N/A')}</div>
                    <div class="movie-detail"><strong>Duración:</strong> ${movie.duracion ? movie.duracion + ' min' : 'N/A'}</div>
                </div>
                <div class="movie-rating">
                    <span class="stars">${generateStars(movie.calificacion || 0)}</span>
                    <span class="rating-text">${movie.calificacion || 0}/10</span>
                </div>
                <div class="movie-actions">
                    <button class="btn btn-view btn-small" onclick="viewMovie(${movie.id})">Ver</button>
                    <button class="btn btn-edit btn-small" onclick="editMovie(${movie.id})">Editar</button>
                    <button class="btn btn-delete btn-small" onclick="deleteMovie(${movie.id})">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const normalizedRating = rating / 2;
    const fullStars = Math.floor(normalizedRating);
    const halfStar = (normalizedRating % 1) >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return '★'.repeat(fullStars) +
        (halfStar ? '☆' : '') +
        '☆'.repeat(emptyStars);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAddMovieModal() {
    editingMovieId = null;
    document.getElementById('modalTitle').textContent = 'Agregar Nueva Película';
    document.getElementById('movieForm').reset();
    document.getElementById('movieModal').classList.add('active');
}

function editMovie(id) {
    const movie = movies.find(m => m.id === id);
    if (!movie) return;
    editingMovieId = id;
    document.getElementById('modalTitle').textContent = 'Editar Película';
    document.getElementById('nombre').value = movie.nombre || '';
    document.getElementById('categoria').value = movie.categoria || '';
    document.getElementById('año').value = movie.año || '';
    document.getElementById('director').value = movie.director || '';
    document.getElementById('duracion').value = movie.duracion || '';
    document.getElementById('calificacion').value = movie.calificacion || '';
    document.getElementById('movieModal').classList.add('active');
}

function viewMovie(id) {
    const movie = movies.find(m => m.id === id);
    if (!movie) return;
    document.getElementById('viewModalTitle').textContent = movie.nombre || 'Película';
    document.getElementById('movieDetails').innerHTML = `
        <div class="movie-full-details">
            <div class="detail-item">
                <div class="detail-label">Nombre</div>
                <div class="detail-value">${escapeHtml(movie.nombre || 'N/A')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Categoría</div>
                <div class="detail-value">${escapeHtml(movie.categoria || 'N/A')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Año</div>
                <div class="detail-value">${movie.año || 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Director</div>
                <div class="detail-value">${escapeHtml(movie.director || 'N/A')}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Duración</div>
                <div class="detail-value">${movie.duracion ? movie.duracion + ' minutos' : 'N/A'}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Calificación</div>
                <div class="detail-value">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="stars" style="font-size: 1.5rem;">${generateStars(movie.calificacion || 0)}</span>
                        <span style="font-weight: bold; color: #1976d2;">${movie.calificacion || 0}/10</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.getElementById('viewModal').classList.add('active');
}

async function deleteMovie(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta película del catálogo?')) {
        return;
    }
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/peliculas/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error!');
        await loadMovies();
        showSuccessMessage('Película eliminada correctamente');
    } catch (e) {
        showErrorMessage('No se pudo eliminar la película.');
    }
    showLoading(false);
}

function closeModal() {
    document.getElementById('movieModal').classList.remove('active');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.remove('active');
}

function showLoading(show) {
    document.getElementById('loading').classList.toggle('active', show);
}

function showErrorMessage(text) {
    const el = document.getElementById('errorMessage');
    el.textContent = text;
    el.style.display = 'block';
}

function showSuccessMessage(text) {
    const el = document.getElementById('successMessage');
    el.textContent = text;
    el.style.display = 'block';
}

function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

function setupFormHandlers() {
    document.getElementById('movieForm').onsubmit = async function (e) {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('nombre').value,
            categoria: document.getElementById('categoria').value,
            año: parseInt(document.getElementById('año').value),
            director: document.getElementById('director').value,
            duracion: parseInt(document.getElementById('duracion').value),
            calificacion: parseFloat(document.getElementById('calificacion').value)
        };
        showLoading(true);
        try {
            let resp;
            if (editingMovieId) {
                resp = await fetch(`${API_BASE_URL}/peliculas/${editingMovieId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                resp = await fetch(`${API_BASE_URL}/peliculas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            if (!resp.ok) throw new Error('Error!');
            await loadMovies();
            closeModal();
            showSuccessMessage('Película guardada correctamente');
        } catch (e) {
            showErrorMessage('No se pudo guardar la película.');
        }
        showLoading(false);
    };
}
