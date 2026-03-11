// IMPORTANT: Use your actual Vercel backend URL
const backendUrl = "https://game-scraping-backend-omega.vercel.app";

console.log("Script loaded. Backend URL:", backendUrl);

// Test backend connection on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log("Page loaded, testing backend connection...");
    testBackendConnection();
});

function testBackendConnection() {
    fetch(`${backendUrl}/`)
        .then(response => {
            console.log("Backend response status:", response.status);
            if (response.ok) {
                return response.json();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        })
        .then(data => {
            console.log("✅ Backend connected:", data);
            document.getElementById('gameCount').textContent = '✅ Connected! Ready to scrape.';
        })
        .catch(error => {
            console.error("❌ Backend connection failed:", error);
            document.getElementById('gameCount').textContent = '❌ Backend not connected';
            showError('Cannot connect to backend. Make sure your Vercel backend is running.');
        });
}

function scrapeFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    console.log("Scraping URL:", url);
    
    if (!url) {
        alert('Please enter a GamesRadar URL');
        return;
    }
    
    if (!url.includes('gamesradar.com')) {
        alert('Please enter a valid GamesRadar URL (must contain gamesradar.com)');
        return;
    }
    
    showLoading('🔍 Scraping articles from GamesRadar...');
    
    fetch(`${backendUrl}/api/scrape-url`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: url })
    })
    .then(response => {
        console.log("Scrape response status:", response.status);
        if (response.status === 202) {
            console.log("Scraping started, polling for results...");
            document.getElementById('gameCount').textContent = '⏳ Scraping in progress...';
            pollForResults();
        } else {
            return response.json().then(data => {
                throw new Error(data.error || 'Failed to start scraping');
            });
        }
    })
    .catch(error => {
        console.error("Scrape error:", error);
        hideLoading();
        alert('Error: ' + error.message);
    });
}

function pollForResults(attempts = 0) {
    console.log(`Polling attempt ${attempts + 1}`);
    
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            console.log("Status:", status);
            
            if (status.games_count > 0) {
                console.log("Results ready!");
                fetchGames();
            } else if (attempts < 20) {
                // Try again in 1.5 seconds
                setTimeout(() => pollForResults(attempts + 1), 1500);
            } else {
                console.log("Polling timed out");
                hideLoading();
                document.getElementById('noResults').style.display = 'block';
                document.getElementById('gameCount').textContent = '⏰ Scraping timed out';
            }
        })
        .catch(error => {
            console.error("Polling error:", error);
            hideLoading();
            document.getElementById('noResults').style.display = 'block';
        });
}

function fetchGames() {
    fetch(`${backendUrl}/api/games`)
        .then(response => response.json())
        .then(games => {
            console.log("Games received:", games);
            displayGames(games);
            document.getElementById('gameCount').textContent = `📚 Found ${games.length} articles`;
            hideLoading();
        })
        .catch(error => {
            console.error("Error fetching games:", error);
            hideLoading();
            document.getElementById('noResults').style.display = 'block';
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

function showError(message) {
    const container = document.getElementById('gamesContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: #fee; border-radius: 8px;">
            <p style="color: #c33;">❌ ${escapeHtml(message)}</p>
            <button onclick="testBackendConnection()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #58a6ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Retry Connection
            </button>
        </div>
    `;
    container.style.display = 'block';
    hideLoading();
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


