const backendUrl = "https://game-scraping-backend-omega.vercel.app";

function scrapeFromUrl() {
    showLoading('Getting games...');
    
    fetch(`${backendUrl}/api/scrape-url`, {
        method: 'POST'
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
                    } else if (attempts > 10) {
                        clearInterval(interval);
                        hideLoading();
                        alert('Timeout - but will still show games!');
                        fetchGames(); // Try anyway
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
    
    let html = '';
    games.forEach(game => {
        html += `
            <div class="game-card">
                <h2>${escapeHtml(game.game_title)}</h2>
                <p><strong>Release:</strong> ${escapeHtml(game.release_date)}</p>
                <p><strong>Platforms:</strong> ${game.platform_availability.join(', ')}</p>
                <p><strong>Developer:</strong> ${escapeHtml(game.developer_info)}</p>
                <p><strong>Publisher:</strong> ${escapeHtml(game.publisher_info)}</p>
                <p><strong>Features:</strong> ${game.key_features[0]}</p>
                <a href="${escapeHtml(game.article_url)}" target="_blank">Read Article →</a>
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

document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') scrapeFromUrl();
});
