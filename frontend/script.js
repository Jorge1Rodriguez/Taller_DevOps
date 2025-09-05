const API_BASE_URL = 'http://localhost:8080';

let movies = [];
let editingMovieId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadMovies();
    setupFormHandlers();
});

async function loadMovies() {
    showLoading(true);
    hideMessages();
    try {
        const response = await fetch(`${API_BASE_URL}/peliculas`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        movies = await response.json();
        renderMovies();
        updateStats();
        showSuccessMessage('Películas cargadas exitosamente');
    } catch (error) {
        console.error('Error cargando películas:', error);
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
    const avgRating = totalMovies > 0
        ? (movies.reduce((sum, m) => sum + (m.rating || 0), 0) / totalMovies).toFixed(1)
        : '0.0';
    const uniqueGenres = new Set(movies.map(m => m.category).filter(Boolean)).size;
    document.getElementById('totalMovies').textContent = totalMovies;
    document.getElementById('avgRating').textContent = avgRating;
    document.getElementById('totalGenres').textContent = uniqueGenres;
}

function renderMovies() {
    const grid = document.getElementById('moviesGrid');
    const noMovies = document.getElementById('noMovies');
    if (movies.length === 0) {
        grid.innerHTML = '';
        if (noMovies) noMovies.style.display = 'block';
        return;
    }
    if (noMovies) noMovies.style.display = 'none';
    grid.innerHTML = movies.map(movie => `
        <div class="movie-card">
            <div class="movie-poster">🎭</div>
            <div class="movie-info">
                <h3 class="movie-title">${escapeHtml(movie.name || 'Sin nombre')}</h3>
                <div class="movie-details">
                    <div class="movie-detail"><strong>Categoría:</strong> ${escapeHtml(movie.category || 'N/A')}</div>
                    <div class="movie-detail"><strong>Año:</strong> ${movie.year || 'N/A'}</div>
                    <div class="movie-detail"><strong>Director:</strong> ${escapeHtml(movie.director || 'N/A')}</div>
                    <div class="movie-detail"><strong>Duración:</strong> ${movie.duration ? movie.duration + ' min' : 'N/A'}</div>
                </div>
                <div class="movie-rating">
                    <span class="stars">${generateStars(movie.rating || 0)}</span>
                    <span class="rating-text">${movie.rating || 0}/10</span>
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
    const normalized = rating / 2;
    const fullStars = Math.floor(normalized);
    const halfStar = (normalized % 1) >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);
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

async function editMovie(id) {
    try {
        showLoading(true);
        hideMessages();
        const response = await fetch(`${API_BASE_URL}/peliculas/${id}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        const movie = await response.json();
        editingMovieId = id;
        document.getElementById('modalTitle').textContent = 'Editar Película';
        document.getElementById('name').value = movie.name || '';
        document.getElementById('category').value = movie.category || '';
        document.getElementById('year').value = movie.year || '';
        document.getElementById('director').value = movie.director || '';
        document.getElementById('duration').value = movie.duration || '';
        document.getElementById('rating').value = movie.rating || '';
        document.getElementById('movieModal').classList.add('active');
    } catch (error) {
        console.error('Error al cargar película para editar:', error);
        showErrorMessage('No se pudo cargar la película para edición.');
    } finally {
        showLoading(false);
    }
}

async function viewMovie(id) {
    try {
        showLoading(true);
        hideMessages();
        const response = await fetch(`${API_BASE_URL}/peliculas/${id}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        const movie = await response.json();
        document.getElementById('viewModalTitle').textContent = movie.name || 'Película';
        document.getElementById('movieDetails').innerHTML = `
            <div class="movie-full-details">
                <div class="detail-item"><div class="detail-label">Nombre</div><div class="detail-value">${escapeHtml(movie.name || 'N/A')}</div></div>
                <div class="detail-item"><div class="detail-label">Categoría</div><div class="detail-value">${escapeHtml(movie.category || 'N/A')}</div></div>
                <div class="detail-item"><div class="detail-label">Año</div><div class="detail-value">${movie.year || 'N/A'}</div></div>
                <div class="detail-item"><div class="detail-label">Director</div><div class="detail-value">${escapeHtml(movie.director || 'N/A')}</div></div>
                <div class="detail-item"><div class="detail-label">Duración</div><div class="detail-value">${movie.duration ? movie.duration + ' minutos' : 'N/A'}</div></div>
                <div class="detail-item">
                    <div class="detail-label">Calificación</div>
                    <div class="detail-value">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="stars" style="font-size: 1.5rem;">${generateStars(movie.rating || 0)}</span>
                            <span style="font-weight: bold; color: #1976d2;">${movie.rating || 0}/10</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('viewModal').classList.add('active');
    } catch (error) {
        console.error('Error al cargar detalles de película:', error);
        showErrorMessage('No se pudo cargar detalles de la película.');
    } finally {
        showLoading(false);
    }
}

async function deleteMovie(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta película del catálogo?')) return;
    showLoading(true);
    hideMessages();
    try {
        const response = await fetch(`${API_BASE_URL}/peliculas/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error ${response.status}: ${errorText}`);
        }
        await loadMovies();
        showSuccessMessage('Película eliminada correctamente');
    } catch (error) {
        console.error('Error al eliminar película:', error);
        showErrorMessage('No se pudo eliminar la película.');
    } finally {
        showLoading(false);
    }
}

function closeModal() {
    document.getElementById('movieModal').classList.remove('active');
}

function closeViewModal() {
    document.getElementById('viewModal').classList.remove('active');
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = show ? 'block' : 'none';
}

function showErrorMessage(text) {
    const el = document.getElementById('errorMessage');
    if (el) {
        el.textContent = text;
        el.style.display = 'block';
    }
}

function showSuccessMessage(text) {
    const el = document.getElementById('successMessage');
    if (el) {
        el.textContent = text;
        el.style.display = 'block';
    }
}

function hideMessages() {
    const errorEl = document.getElementById('errorMessage');
    if (errorEl) errorEl.style.display = 'none';
    const successEl = document.getElementById('successMessage');
    if (successEl) successEl.style.display = 'none';
}

function setupFormHandlers() {
    const form = document.getElementById('movieForm');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        hideMessages();
        const data = {
            name: document.getElementById('name').value.trim(),
            category: document.getElementById('category').value.trim(),
            year: parseInt(document.getElementById('year').value) || null,
            director: document.getElementById('director').value.trim(),
            duration: parseInt(document.getElementById('duration').value) || null,
            rating: parseFloat(document.getElementById('rating').value) || 0
        };
        showLoading(true);
        try {
            let response;
            if (editingMovieId) {
                response = await fetch(`${API_BASE_URL}/peliculas/${editingMovieId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                response = await fetch(`${API_BASE_URL}/peliculas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }
            await loadMovies();
            closeModal();
            showSuccessMessage('Película guardada correctamente');
        } catch (error) {
            console.error('Error al guardar película:', error);
            showErrorMessage('No se pudo guardar la película.');
        } finally {
            showLoading(false);
        }
    };
}
