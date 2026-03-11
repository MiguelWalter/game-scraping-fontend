const backendUrl = "https://game-scraping-backend-omega.vercel.app";

document.addEventListener('DOMContentLoaded', function() {
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
    const url = document.getElementById('urlInput').value.trim();
    
    if (!url.includes('gamesradar.com')) {
        alert('Please enter a valid GamesRadar URL');
        return;
    }
    
    showLoading();
    
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
                    } else if (attempts > 20) {
                        clearInterval(interval);
                        hideLoading();
                        document.getElementById('noResults').style.display = 'block';
                    }
                    attempts++;
                });
        }, 1500);
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
    
    if (games.length === 0) {
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
                <p><strong>Features:</strong> ${game.key_features[0]}</p>
                <a href="${escapeHtml(game.article_url)}" target="_blank">Read Article →</a>
            </div>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('noResults').style.display = 'none';
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
        .replace(/"/g, "&quot;");
}

document.getElementById('urlInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') scrapeFromUrl();
});
