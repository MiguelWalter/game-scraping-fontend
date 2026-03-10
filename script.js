const backendUrl = "https://game-scraping-backend-omega.vercel.app";

function scrapeRandomGames() {
    showLoading();
    
    fetch(`${backendUrl}/api/scrape-random`, {
        method: 'POST'
    })
    .then(response => {
        if (response.status === 202) {
            pollForResults();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to start scraping');
        hideLoading();
    });
}

function pollForResults(attempts = 0) {
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            if (status.games_count > 0) {
                fetchGames();
            } else if (attempts < 20) {
                setTimeout(() => pollForResults(attempts + 1), 2000);
            } else {
                hideLoading();
                alert('Scraping timed out');
            }
        });
}

function fetchGames() {
    fetch(`${backendUrl}/api/games`)
        .then(response => response.json())
        .then(games => {
            displayGames(games);
            document.getElementById('gameCount').textContent = `Showing ${games.length} random games`;
            hideLoading();
        });
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    
    let html = '';
    games.forEach(game => {
        html += `
            <div class="game-card">
                <h2 class="game-title">${escapeHtml(game.game_title)}</h2>
                
                <div class="game-info">
                    <strong>Release Date:</strong> ${escapeHtml(game.release_date)}
                </div>
                
                <div class="game-info">
                    <strong>Platforms:</strong> ${game.platform_availability.join(', ')}
                </div>
                
                <div class="game-info">
                    <strong>Developer:</strong> ${escapeHtml(game.developer_info)}
                </div>
                
                <div class="game-info">
                    <strong>Publisher:</strong> ${escapeHtml(game.publisher_info)}
                </div>
                
                <div class="game-info">
                    <strong>Key Features:</strong>
                    <ul>
                        ${game.key_features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                </div>
                
                <a href="${escapeHtml(game.article_url)}" target="_blank" class="read-link">
                    📖 Read Full Article on GamesRadar →
                </a>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('gamesContainer').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('gamesContainer').style.display = 'grid';
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
