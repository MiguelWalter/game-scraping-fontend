const backendUrl = "https://game-scraping-backend-omega.vercel.app/"; // CHANGE TO YOUR VERCEL URL

let allGames = [];

document.addEventListener('DOMContentLoaded', () => {
    loadGames();
});

function loadGames() {
    fetch(`${backendUrl}/api/games`)
        .then(res => res.json())
        .then(games => {
            allGames = games;
            displayGames(games);
            document.getElementById('gamesContainer').style.display = 'grid';
        })
        .catch(err => {
            console.error('Error loading games:', err);
            showError('Could not load games. Make sure backend is running.');
        });
}

function scrapeFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    if (!url.includes('gamesradar.com')) {
        alert('Please enter a valid GamesRadar URL');
        return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('gamesContainer').style.display = 'none';

    fetch(`${backendUrl}/api/scrape-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
    })
    .then(res => {
        if (res.status === 202) {
            pollForResults();
        } else {
            throw new Error('Scrape failed to start');
        }
    })
    .catch(err => {
        console.error(err);
        document.getElementById('loading').style.display = 'none';
        showError('Failed to start scraping.');
    });
}

function pollForResults(attempts = 0) {
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            if (status.games_count > 0) {
                loadGames();
                document.getElementById('loading').style.display = 'none';
            } else if (attempts < 20) {
                setTimeout(() => pollForResults(attempts + 1), 2000);
            } else {
                document.getElementById('loading').style.display = 'none';
                showError('Scraping timed out. Please try again.');
            }
        });
}

function displayGames(games) {
    const container = document.getElementById('gamesContainer');
    if (!games || games.length === 0) {
        container.innerHTML = '';
        document.getElementById('noResults').style.display = 'block';
        return;
    }
    document.getElementById('noResults').style.display = 'none';

    let html = '';
    games.forEach(game => {
        html += `
            <div class="game-card">
                <h3>${escapeHtml(game.game_title)}</h3>
                <div class="game-info"><strong>Release:</strong> ${escapeHtml(game.release_date)}</div>
                <div class="game-info"><strong>Platforms:</strong> ${game.platform_availability.join(', ')}</div>
                <div class="game-info"><strong>Developer:</strong> ${escapeHtml(game.developer_info)}</div>
                <div class="game-info"><strong>Publisher:</strong> ${escapeHtml(game.publisher_info)}</div>
                <div class="game-info"><strong>Features:</strong>
                    <ul>${game.key_features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}</ul>
                </div>
                <a href="${escapeHtml(game.article_url)}" target="_blank">Read on GamesRadar →</a>
            </div>
        `;
    });
    container.innerHTML = html;
}

function filterGames() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) {
        displayGames(allGames);
        return;
    }
    const filtered = allGames.filter(game =>
        game.game_title.toLowerCase().includes(query) ||
        game.developer_info.toLowerCase().includes(query) ||
        game.publisher_info.toLowerCase().includes(query) ||
        game.key_features.some(f => f.toLowerCase().includes(query))
    );
    displayGames(filtered);
    if (filtered.length === 0) document.getElementById('noResults').style.display = 'block';
}

function clearFilter() {
    document.getElementById('searchInput').value = '';
    displayGames(allGames);
}

function showError(message) {
    const errDiv = document.getElementById('error');
    errDiv.textContent = message;
    errDiv.style.display = 'block';
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

// Event listeners
document.getElementById('scrapeBtn').addEventListener('click', scrapeFromUrl);
document.getElementById('searchBtn').addEventListener('click', filterGames);
document.getElementById('clearBtn').addEventListener('click', clearFilter);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filterGames();
});
