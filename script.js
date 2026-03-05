let allGames = [];

// Your Vercel backend URL
const backendUrl = "https://game-scraping-backend-fm64.vercel.app";

// Load games on page load
document.addEventListener('DOMContentLoaded', function() {
    loadGames();
});

function loadGames() {
    fetch(`${backendUrl}/api/games`)
        .then(response => response.json())
        .then(games => {
            allGames = games;
            displayGames(games);
            updateStats(games.length);
        })
        .catch(error => {
            console.error('Failed to load games:', error);
            alert('Failed to load games. Please check your backend.');
        });
}

function searchGame() {
    const gameName = document.getElementById('gameNameInput').value.trim();
    
    if (!gameName) {
        alert('Please enter a game name');
        return;
    }

    showLoading(`🔍 Searching GamesRadar for "${gameName}"...`);

    // Start search
    fetch(`${backendUrl}/api/search-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_name: gameName })
    })
    .then(response => {
        if (response.status !== 202) throw new Error("Backend did not accept the search");
        pollForResults();
    })
    .catch(error => {
        console.error('Error starting search:', error);
        hideLoading();
        alert('Failed to start search. Please try again.');
    });
}

// Poll backend /api/status until results exist
function pollForResults(attempts = 0) {
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            if (status.games_count > 0 || attempts > 20) {
                // Results ready or max attempts reached
                checkForResults();
            } else {
                // Wait 1 second and try again
                setTimeout(() => pollForResults(attempts + 1), 1000);
            }
        })
        .catch(error => {
            console.error('Error polling backend:', error);
            hideLoading();
            alert('Failed to get results from backend.');
        });
}

function checkForResults() {
    fetch(`${backendUrl}/api/games`)
        .then(response => response.json())
        .then(games => {
            allGames = games;
            displayGames(games);
            updateStats(games.length);
            hideLoading();
            
            if (games.length === 0) {
                document.getElementById('noResults').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error fetching results:', error);
            hideLoading();
            alert('Failed to load search results.');
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
                        <a href="${escapeHtml(game.article_url)}" target="_blank">
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
        game.article_type.toLowerCase().includes(query) ||
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

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
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
