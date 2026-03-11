const backendUrl = "https://game-scraping-backend-omega.vercel.app";

let scrapingAttempts = 0;

function scrapeFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url.includes('gamesradar.com')) {
        alert('Please enter a valid GamesRadar URL');
        return;
    }
    
    showLoading('🔍 Scraping articles...');
    scrapingAttempts = 0;
    
    fetch(`${backendUrl}/api/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
    .then(() => {
        checkResults();
    })
    .catch(error => {
        console.error('Error:', error);
        hideLoading();
        alert('Failed to start scraping');
    });
}

function checkResults() {
    scrapingAttempts++;
    
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            if (status.games_count > 0) {
                fetchGames();
            } else if (scrapingAttempts < 15) {
                setTimeout(checkResults, 2000);
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
            document.getElementById('noResults').style.display = 'none';
        });
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    
    if (!games || games.length === 0) {
        document.getElementById('noResults').style.display = 'block';
        return;
    }
    
    let html = '';
    games.forEach(game => {
        html += `
            <div class="game-card">
                <h2>${escapeHtml(game.game_title)}</h2>
                <p><strong>Release:</strong> ${escapeHtml(game.release_date)}</p>
                <p><strong>Platforms:</strong> ${game.platform_availability.join(', ')}</p>
                <p><strong>Developer:</strong> ${escapeHtml(game.developer_info)}</p>
                <p><strong>Publisher:</strong> ${escapeHtml(game.publisher_info)}</p>
                <div class="features">
                    <strong>Features:</strong>
                    <ul>
                        ${game.key_features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                </div>
                <a href="${escapeHtml(game.article_url)}" target="_blank" class="read-link">
                    Read Full Article →
                </a>
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

document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') scrapeFromUrl();
});
