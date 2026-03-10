let allArticles = [];

// 🔴 Update with your Vercel backend URL
const backendUrl = "https://game-scraping-backend-omega.vercel.app";

document.addEventListener('DOMContentLoaded', function() {
    checkBackend();
});

function checkBackend() {
    fetch(`${backendUrl}/`)
        .then(response => response.json())
        .then(data => {
            console.log('Backend connected:', data);
            loadArticles();
        })
        .catch(error => {
            console.error('Backend connection failed:', error);
            showError('Cannot connect to backend');
        });
}

function loadArticles() {
    fetch(`${backendUrl}/api/articles`)
        .then(response => response.json())
        .then(articles => {
            allArticles = articles;
            displayArticles(articles);
            updateStats(articles.length);
        })
        .catch(error => {
            console.error('Failed to load articles:', error);
        });
}

function scrapeRandom() {
    showLoading('🎲 Scraping 10 random articles from GamesRadar...');
    
    fetch(`${backendUrl}/api/scrape-random`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.status === 202) {
            pollForResults();
        }
    })
    .catch(error => {
        console.error('Error starting scrape:', error);
        hideLoading();
        showError('Failed to start scraping');
    });
}

function pollForResults(attempts = 0) {
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            if (status.articles_count > 0) {
                fetchArticles();
            } else if (attempts < 20) {
                setTimeout(() => pollForResults(attempts + 1), 2000);
            } else {
                hideLoading();
                showError('Scrape timed out');
            }
        });
}

function fetchArticles() {
    fetch(`${backendUrl}/api/articles`)
        .then(response => response.json())
        .then(articles => {
            allArticles = articles;
            displayArticles(articles);
            updateStats(articles.length);
            hideLoading();
        });
}

function displayArticles(articles) {
    const container = document.getElementById('gamesContainer');
    
    if (articles.length === 0) {
        container.innerHTML = '<div class="no-results"><p>No articles yet. Click "Scrape Random Articles" to get started!</p></div>';
        return;
    }
    
    let html = '';
    articles.forEach(article => {
        let badgeColor = '#667eea';
        if (article.article_type === 'Review') badgeColor = '#48bb78';
        if (article.article_type === 'News') badgeColor = '#4299e1';
        if (article.article_type === 'Feature') badgeColor = '#9f7aea';
        if (article.article_type === 'Guide') badgeColor = '#f56565';
        
        html += `
            <div class="game-card">
                <div class="card-header">
                    <h3 class="game-title">${escapeHtml(article.game_title)}</h3>
                    <span class="article-type" style="background-color: ${badgeColor}">${article.article_type}</span>
                </div>
                
                <div class="article-link">
                    <a href="${escapeHtml(article.article_url)}" target="_blank">
                        🔗 Read on GamesRadar
                    </a>
                </div>
                
                <div class="game-info">
                    <strong>Published:</strong> ${escapeHtml(article.release_date)}
                </div>
                
                <div class="game-info">
                    <strong>Platforms:</strong>
                    <ul>
                        ${article.platform_availability.map(p => `<li>${escapeHtml(p)}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="game-info">
                    <strong>Highlights:</strong>
                    <ul>
                        ${article.key_features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function filterArticles() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    
    if (query === '') {
        displayArticles(allArticles);
        updateStats(allArticles.length);
        return;
    }
    
    const filtered = allArticles.filter(article => 
        article.game_title.toLowerCase().includes(query) ||
        article.article_type.toLowerCase().includes(query)
    );
    
    displayArticles(filtered);
    updateStats(filtered.length, allArticles.length);
}

function clearFilter() {
    document.getElementById('searchInput').value = '';
    displayArticles(allArticles);
    updateStats(allArticles.length);
}

function updateStats(currentCount, totalCount = null) {
    const statsBar = document.getElementById('gameCount');
    if (totalCount) {
        statsBar.innerHTML = `Showing ${currentCount} of ${totalCount} articles`;
    } else {
        statsBar.innerHTML = `Showing ${currentCount} articles`;
    }
}

function showLoading(message) {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('gamesContainer').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('gamesContainer').style.display = 'grid';
}

function showError(message) {
    const container = document.getElementById('gamesContainer');
    container.innerHTML = `<div class="error-message">❌ ${escapeHtml(message)}</div>`;
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
