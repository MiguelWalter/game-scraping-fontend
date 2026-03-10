const backendUrl = "https://game-scraping-backend-omega.vercel.app";

function scrapeFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url) {
        alert('Please enter a GamesRadar URL');
        return;
    }
    
    if (!url.includes('gamesradar.com')) {
        alert('Please enter a valid GamesRadar URL');
        return;
    }
    
    showLoading(`🔍 Scraping from: ${url}`);
    
    fetch(`${backendUrl}/api/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
    .then(response => {
        if (response.status === 202) {
            pollForResults();
        } else {
            throw new Error('Failed to start scraping');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoading();
        alert('Failed to start scraping. Check console for details.');
    });
}

function pollForResults(attempts = 0) {
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            if (status.games_count > 0) {
                fetchGames();
            } else if (attempts < 30) {
                setTimeout(() => pollForResults(attempts + 1), 2000);
            } else {
                hideLoading();
                document.getElementById('noResults').style.display = 'block';
            }
        });
}

function fetchGames() {
    fetch(`${backendUrl}/api/games`)
        .then(response => response.json())
        .then(games => {
            displayGames(games);
            document.getElementById('gameCount').textContent = `Found ${games.length} articles`;
            hideLoading();
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

function showLoading(message) {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('gamesContainer').style.display = 'none';
    document.getElementById('noResults').style.display = 'none';
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

// Enter key for URL input
document.getElementById('urlInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        scrapeFromUrl();
    }
});
