const backendUrl = "https://game-scraping-backend-omega.vercel.app";

function scrapeFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url) {
        alert('Please enter a URL');
        return;
    }
    
    showLoading('Scraping games...');
    
    fetch(`${backendUrl}/api/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
    .then(() => {
        let attempts = 0;
        const interval = setInterval(() => {
            fetch(`${backendUrl}/api/status`)
                .then(res => res.json())
                .then(status => {
                    if (status.games_count > 0) {
                        clearInterval(interval);
                        fetchGames();
                    } else if (attempts > 15) {
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
                    📖 Read Full Article →
                </a>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('noResults').style.display = 'none';
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
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Enter key
document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') scrapeFromUrl();
});
