const backendUrl = "https://game-scraping-backend-omega.vercel.app"; // your actual backend URL

document.addEventListener('DOMContentLoaded', () => {
    testConnection();
});

function testConnection() {
    fetch(`${backendUrl}/`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('gameCount').textContent = '✅ Connected';
        })
        .catch(() => {
            document.getElementById('gameCount').textContent = '❌ Connection failed';
        });
}

function scrapeFromUrl() {
    // The URL input is now just a placeholder – we always scrape from RSS
    showLoading('🔍 Scraping latest games from GamesRadar...');

    fetch(`${backendUrl}/api/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'ignored' })
    })
    .then(() => pollForResults())
    .catch(err => {
        console.error(err);
        hideLoading();
        alert('Failed to start scraping');
    });
}

function pollForResults(attempts = 0) {
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            if (status.games_count > 0) {
                fetchGames();
            } else if (attempts < 20) {
                setTimeout(() => pollForResults(attempts + 1), 1500);
            } else {
                hideLoading();
                document.getElementById('noResults').style.display = 'block';
            }
        });
}

function fetchGames() {
    fetch(`${backendUrl}/api/games`)
        .then(res => res.json())
        .then(games => {
            displayGames(games);
            hideLoading();
        });
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    const noResults = document.getElementById('noResults');

    if (!games || games.length === 0) {
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    let html = '';
    games.forEach(game => {
        html += `
            <div class="game-card">
                <h2 class="game-title">${escapeHtml(game.game_title)}</h2>
                <p><strong>Release Date:</strong> ${escapeHtml(game.release_date)}</p>
                <p><strong>Platforms:</strong> ${game.platform_availability.join(', ')}</p>
                <p><strong>Developer:</strong> ${escapeHtml(game.developer_info)}</p>
                <p><strong>Publisher:</strong> ${escapeHtml(game.publisher_info)}</p>
                <div class="features">
                    <strong>Key Features:</strong>
                    <ul>
                        ${game.key_features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                </div>
                <a href="${escapeHtml(game.article_url)}" target="_blank" class="read-link">Read Full Article →</a>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showLoading(msg) {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loadingMessage').textContent = msg;
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
        .replace(/"/g, "&quot;");
}

// Enter key on input triggers scrape (though URL is ignored)
document.getElementById('urlInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') scrapeFromUrl();
});
