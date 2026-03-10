const backendUrl = "https://game-scraping-backend-omega.vercel.app";

function scrapeFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url.includes('gamesradar.com')) {
        alert('Please enter a GamesRadar URL');
        return;
    }
    
    showLoading('Scraping...');
    
    fetch(`${backendUrl}/api/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
    .then(() => {
        // Check faster (every 1 second)
        let attempts = 0;
        const interval = setInterval(() => {
            fetch(`${backendUrl}/api/status`)
                .then(res => res.json())
                .then(status => {
                    if (status.games_count > 0) {
                        clearInterval(interval);
                        fetchGames();
                    } else if (attempts > 15) { // 15 seconds max
                        clearInterval(interval);
                        hideLoading();
                        document.getElementById('noResults').style.display = 'block';
                    }
                    attempts++;
                });
        }, 1000);
    });
}

function fetchGames() {
    fetch(`${backendUrl}/api/games`)
        .then(response => response.json())
        .then(games => {
            displayGames(games);
            hideLoading();
        });
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    
    if (games.length === 0) {
        document.getElementById('noResults').style.display = 'block';
        return;
    }
    
    let html = '';
    games.forEach(game => {
        html += `
            <div class="game-card">
                <h2>${escapeHtml(game.game_title)}</h2>
                <div class="game-info">
                    <strong>Platforms:</strong> ${game.platform_availability.join(', ')}
                </div>
                <a href="${escapeHtml(game.article_url)}" target="_blank" class="read-link">
                    Read on GamesRadar →
                </a>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('noResults').style.display = 'none';
}

function showLoading(msg) {
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
        .replace(/"/g, "&quot;");
}

// Enter key
document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') scrapeFromUrl();
});
