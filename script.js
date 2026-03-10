let allGames = [];
let searchAttempts = 0;

// 🔴 IMPORTANT: Update this with your actual Vercel backend URL
const backendUrl = "https://game-scraping-backend-omega.vercel.app";

// Load games on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, testing backend connection...');
    testBackendConnection();
});

function testBackendConnection() {
    console.log('Testing backend connection...');
    
    fetch(`${backendUrl}/`, {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (response.ok) {
            console.log('✅ Backend connection successful');
            return response.json();
        } else {
            throw new Error(`Backend returned ${response.status}`);
        }
    })
    .then(data => {
        console.log('Backend data:', data);
        loadGames();
    })
    .catch(error => {
        console.error('❌ Backend connection failed:', error);
        showError(`Cannot connect to backend. Make sure it's deployed correctly. URL: ${backendUrl}`);
    });
}

function loadGames() {
    console.log('Loading games from backend...');
    
    fetch(`${backendUrl}/api/games`, {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(games => {
        console.log('Games loaded:', games);
        allGames = games;
        displayGames(games);
        updateStats(games.length);
    })
    .catch(error => {
        console.error('Failed to load games:', error);
        showError('Failed to load games. Please check your backend.');
    });
}

function searchGame() {
    const gameName = document.getElementById('gameNameInput').value.trim();
    searchAttempts = 0;
    
    if (!gameName) {
        alert('Please enter a game name');
        return;
    }

    console.log(`Searching for: ${gameName}`);
    showLoading(`🔍 Searching GamesRadar for "${gameName}"...`);

    // Start search
    fetch(`${backendUrl}/api/search-game`, {
        method: 'POST',
        mode: 'cors',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({ game_name: gameName })
    })
    .then(response => {
        console.log('Search response status:', response.status);
        if (response.status === 202) {
            // Search started successfully
            console.log('Search started, polling for results...');
            setTimeout(() => pollForResults(), 2000); // Start polling after 2 seconds
        } else {
            return response.json().then(data => {
                throw new Error(data.error || 'Search failed');
            });
        }
    })
    .catch(error => {
        console.error('Error starting search:', error);
        hideLoading();
        showError('Failed to start search: ' + error.message);
    });
}

// Poll backend /api/status until results exist
function pollForResults() {
    searchAttempts++;
    console.log(`Polling for results (attempt ${searchAttempts})...`);
    
    fetch(`${backendUrl}/api/status`, {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(status => {
        console.log('Status check:', status);
        
        if (status.games_count > 0) {
            // Results ready
            console.log('Results ready!');
            fetchResults();
        } else if (searchAttempts >= 20) { // Try for 40 seconds max
            // Timeout
            hideLoading();
            showError('Search timed out. The game might not have any articles on GamesRadar.');
        } else {
            // Wait 2 seconds and try again
            console.log(`Waiting for results... (${searchAttempts}/20)`);
            setTimeout(() => pollForResults(), 2000);
        }
    })
    .catch(error => {
        console.error('Error polling backend:', error);
        hideLoading();
        showError('Failed to check search status. Check console for details.');
    });
}

function fetchResults() {
    console.log('Fetching results...');
    
    fetch(`${backendUrl}/api/games`, {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(games => {
        console.log('Results received:', games);
        allGames = games;
        displayGames(games);
        updateStats(games.length);
        hideLoading();
        
        if (games.length === 0) {
            document.getElementById('noResults').style.display = 'block';
            document.getElementById('noResults').innerHTML = `
                <p>No results found for "${document.getElementById('gameNameInput').value}"</p>
                <p class="hint">Try a different game name or check spelling</p>
            `;
        } else {
            document.getElementById('noResults').style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error fetching results:', error);
        hideLoading();
        showError('Failed to load search results.');
    });
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    const noResults = document.getElementById('noResults');
    
    if (games.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    let html = '';
    games.forEach(game => {
        let badgeColor = '#667eea';
        if (game.article_type === 'Review') badgeColor = '#48bb78';
        if (game.article_type === 'News') badgeColor = '#4299e1';
        if (game.article_type === 'Preview') badgeColor = '#ed8936';
        if (game.article_type === 'Feature') badgeColor = '#9f7aea';
        if (game.article_type === 'Guide') badgeColor = '#f56565';
        if (game.article_type === 'Interview') badgeColor = '#805ad5';
        
        html += `
            <div class="game-card">
                <div class="card-header">
                    <h3 class="game-title">${escapeHtml(game.game_title)}</h3>
                    <span class="article-type" style="background-color: ${badgeColor}">${game.article_type || 'Article'}</span>
                </div>
                
                ${game.article_url && game.article_url !== '#' ? 
                    `<div class="article-link">
                        <a href="${escapeHtml(game.article_url)}" target="_blank" rel="noopener noreferrer">
                            <span>🔗</span> Read on GamesRadar
                        </a>
                    </div>` : ''}
                
                <div class="game-info">
                    <strong>Published:</strong> ${escapeHtml(game.release_date)}
                </div>
                
                <div class="game-info">
                    <strong>Platforms:</strong>
                    <ul>
                        ${game.platform_availability.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="game-info">
                    <strong>Developer:</strong> ${escapeHtml(game.developer_info)}
                </div>
                
                <div class="game-info">
                    <strong>Publisher:</strong> ${escapeHtml(game.publisher_info)}
                </div>
                
                <div class="game-info">
                    <strong>Highlights:</strong>
                    <ul>
                        ${game.key_features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterGames() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (query === '') {
        displayGames(allGames);
        updateStats(allGames.length);
        return;
    }
    
    const filtered = allGames.filter(game => 
        game.game_title.toLowerCase().includes(query) ||
        (game.article_type && game.article_type.toLowerCase().includes(query)) ||
        game.developer_info.toLowerCase().includes(query) ||
        game.publisher_info.toLowerCase().includes(query)
    );
    
    displayGames(filtered);
    updateStats(filtered.length, allGames.length);
}

function clearFilter() {
    document.getElementById('searchInput').value = '';
    displayGames(allGames);
    updateStats(allGames.length);
}

function updateStats(currentCount, totalCount = null) {
    const statsBar = document.getElementById('gameCount');
    if (totalCount) {
        statsBar.innerHTML = `Showing ${currentCount} of ${totalCount} articles`;
    } else {
        statsBar.innerHTML = `Showing ${currentCount} articles`;
    }
}

function showLoading(message) {
    const loading = document.getElementById('loading');
    const container = document.getElementById('gamesContainer');
    const noResults = document.getElementById('noResults');
    const loadingMessage = document.getElementById('loadingMessage');
    
    loading.style.display = 'block';
    loadingMessage.textContent = message;
    container.style.display = 'none';
    noResults.style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('gamesContainer').style.display = 'grid';
}

function showError(message) {
    const container = document.getElementById('gamesContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: #fee; border-radius: 8px;">
            <p style="color: #c33;">❌ ${escapeHtml(message)}</p>
            <button onclick="testBackendConnection()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #58a6ff; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Retry Connection
            </button>
        </div>
    `;
    container.style.display = 'block';
    hideLoading();
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Enter key for search
document.getElementById('gameNameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchGame();
});

// Enter key for filter
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') filterGames();
});
