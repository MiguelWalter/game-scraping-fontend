let allArticles = [];

// 🔴 Update with your Vercel backend URL
const backendUrl = "https://game-scraping-backend-omega.vercel.app";

document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, checking backend...');
    checkBackend();
});

function checkBackend() {
    fetch(`${backendUrl}/`)
        .then(response => response.json())
        .then(data => {
            console.log('✅ Backend connected:', data);
            loadArticles();
        })
        .catch(error => {
            console.error('❌ Backend connection failed:', error);
            showError('Cannot connect to backend. Make sure it\'s deployed on Vercel.');
        });
}

function loadArticles() {
    fetch(`${backendUrl}/api/articles`)
        .then(response => response.json())
        .then(articles => {
            console.log('📚 Loaded articles:', articles.length);
            allArticles = articles;
            displayArticles(articles);
            updateStats(articles.length);
        })
        .catch(error => {
            console.error('Failed to load articles:', error);
        });
}

// Function to search for a specific game
function searchGame() {
    const gameName = document.getElementById('gameNameInput').value.trim();
    
    if (!gameName) {
        alert('Please enter a game name');
        return;
    }

    showLoading(`🔍 Searching for "${gameName}" on GamesRadar...`);

    fetch(`${backendUrl}/api/search-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_name: gameName })
    })
    .then(response => {
        if (response.status === 202) {
            pollForResults('search');
        } else {
            throw new Error('Search failed');
        }
    })
    .catch(error => {
        console.error('Error starting search:', error);
        hideLoading();
        showError('Failed to start search');
    });
}

// NEW: Function to scrape random articles
function scrapeRandom() {
    showLoading('🎲 Scraping 10 random articles from GamesRadar homepage...');
    
    fetch(`${backendUrl}/api/scrape-random`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.status === 202) {
            console.log('✅ Random scrape started, polling for results...');
            pollForResults('random');
        } else {
            throw new Error('Failed to start random scrape');
        }
    })
    .catch(error => {
        console.error('Error starting random scrape:', error);
        hideLoading();
        showError('Failed to start random scrape');
    });
}

function pollForResults(type, attempts = 0) {
    fetch(`${backendUrl}/api/status`)
        .then(res => res.json())
        .then(status => {
            console.log(`📊 Status check (${type}):`, status);
            
            if (status.articles_count > 0) {
                console.log('✅ Results ready!');
                fetchArticles();
            } else if (attempts < 20) {
                // Try again in 2 seconds
                setTimeout(() => pollForResults(type, attempts + 1), 2000);
            } else {
                hideLoading();
                showError('Scrape timed out. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error polling:', error);
            hideLoading();
            showError('Failed to check status');
        });
}

function fetchArticles() {
    fetch(`${backendUrl}/api/articles`)
        .then(response => response.json())
        .then(articles => {
            console.log('📚 Received articles:', articles.length);
            allArticles = articles;
            displayArticles(articles);
            updateStats(articles.length);
            hideLoading();
            
            if (articles.length === 0) {
                document.getElementById('noResults').style.display = 'block';
            } else {
                document.getElementById('noResults').style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error fetching articles:', error);
            hideLoading();
            showError('Failed to load articles');
        });
}

function displayArticles(articles) {
    const container = document.getElementById('gamesContainer');
    const noResults = document.getElementById('noResults');
    
    if (articles.length === 0) {
        container.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }
    
    noResults.style.display = 'none';
    
    let html = '';
    articles.forEach(article => {
        // Choose color based on article type
        let badgeColor = '#667eea'; // default
        if (article.article_type === 'Review') badgeColor = '#48bb78';
        if (article.article_type === 'News') badgeColor = '#4299e1';
        if (article.article_type === 'Feature') badgeColor = '#9f7aea';
        if (article.article_type === 'Guide') badgeColor = '#f56565';
        if (article.article_type === 'Preview') badgeColor = '#ed8936';
        
        html += `
            <div class="game-card">
                <div class="card-header">
                    <h3 class="game-title">${escapeHtml(article.game_title)}</h3>
                    <span class="article-type" style="background-color: ${badgeColor}">${article.article_type || 'Article'}</span>
                </div>
                
                ${article.article_url ? `
                    <div class="article-link">
                        <a href="${escapeHtml(article.article_url)}" target="_blank" rel="noopener noreferrer">
                            🔗 Read Full Article on GamesRadar
                        </a>
                    </div>
                ` : ''}
                
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
                    <strong>Developer:</strong> ${escapeHtml(article.developer_info)}
                </div>
                
                <div class="game-info">
                    <strong>Publisher:</strong> ${escapeHtml(article.publisher_info)}
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
        (article.article_type && article.article_type.toLowerCase().includes(query))
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
    const loading = document.getElementById('loading');
    const container = document.getElementById('gamesContainer');
    const noResults = document.getElementById('noResults');
    const loadingMessage = document.getElementById('loadingMessage');
    
    loading.style.display = 'block';
    loadingMessage.textContent = message;
    container.style.display = 'none';
    noResults.style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('gamesContainer').style.display = 'grid';
}

function showError(message) {
    const container = document.getElementById('gamesContainer');
    container.innerHTML = `
        <div style="text-align: center; padding: 3rem; background: #fee; border-radius: 12px;">
            <p style="color: #c33; font-size: 1.2rem;">❌ ${escapeHtml(message)}</p>
            <button onclick="checkBackend()" style="margin-top: 1rem; padding: 0.5rem 1.5rem; background: #58a6ff; color: white; border: none; border-radius: 6px; cursor: pointer;">
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

// Enter key for search
document.getElementById('gameNameInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') searchGame();
});

// Enter key for filter
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') filterArticles();
});
