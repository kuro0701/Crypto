document.addEventListener('DOMContentLoaded', () => {
    fetchTrendingCoins(); // ★Modified★ ウォッチリストの代わりにトレンドコインを取得
    fetchTopGainersLosers();
    fetchNews();
    setupSearch();
});

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

/**
 * (★New★)
 * CoinGeckoでトレンドになっているコインの情報を取得して表示する
 */
async function fetchTrendingCoins() {
    const container = document.getElementById('trending-content');
    try {
        // 1. まず、トレンドになっているコインのリストを取得
        const trendingResponse = await fetch(`${COINGECKO_API_BASE}/search/trending`);
        if (!trendingResponse.ok) throw new Error('Failed to fetch trending coins.');
        const trendingData = await trendingResponse.json();

        // 2. トレンドコインのIDだけを抽出する
        const coinIds = trendingData.coins.map(coin => coin.item.id);

        // 3. 抽出したIDを使って、各コインの市場データを一括で取得
        const marketsUrl = `${COINGECKO_API_BASE}/coins/markets?vs_currency=jpy&ids=${coinIds.join(',')}&order=market_cap_desc&sparkline=false`;
        const marketsResponse = await fetch(marketsUrl);
        if (!marketsResponse.ok) throw new Error('Failed to fetch market data for trending coins.');
        const marketsData = await marketsResponse.json();

        // 4. 取得したデータを表示関数に渡す
        displayCoins('#trending-content', marketsData);

    } catch (error) {
        console.error("Fetching trending coins failed: ", error);
        container.innerHTML = "<p>トレンドデータの読み込みに失敗しました。</p>";
    }
}


// 2. トップゲイナー/ルーザーのデータを取得・表示 (変更なし)
async function fetchTopGainersLosers() {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=jpy&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const sorted = data.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        const topGainers = sorted.slice(0, 3);
        const topLosers = sorted.slice(-3).reverse();
        const combined = [...topGainers, ...topLosers];
        displayCoins('#gainers-losers-content', combined);

    } catch (error) {
        console.error("Fetching top gainers/losers failed: ", error);
        document.getElementById('gainers-losers-content').innerHTML = "<p>データの読み込みに失敗しました。</p>";
    }
}

// 3. トレンドニュースを取得・表示 (変更なし)
async function fetchNews() {
    const url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const newsContent = document.getElementById('news-content');
        newsContent.innerHTML = '';
        data.Data.slice(0, 5).forEach(news => {
            const newsItem = `
                <div class="news-item">
                    <a href="${news.url}" target="_blank" rel="noopener noreferrer">
                        <h3>${news.title}</h3>
                        <p class="news-source">${news.source}</p>
                    </a>
                </div>
            `;
            newsContent.innerHTML += newsItem;
        });
    } catch (error) {
        console.error("Fetching news failed: ", error);
        document.getElementById('news-content').innerHTML = "<p>ニュースの読み込みに失敗しました。</p>";
    }
}

// 4. 検索機能の設定 (変更なし)
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        const query = searchInput.value;

        if (query.length > 2) {
            searchTimeout = setTimeout(async () => {
                const url = `${COINGECKO_API_BASE}/search?query=${query}`;
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    displaySearchResults(data.coins);
                } catch (error) {
                    console.error("Search failed:", error);
                }
            }, 300);
        } else {
            searchResults.classList.remove('visible');
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.remove('visible');
        }
    });
}

// 検索結果を表示する (変更なし)
function displaySearchResults(coins) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';

    if (coins && coins.length > 0) {
        searchResults.classList.add('visible');
        coins.slice(0, 7).forEach(coin => {
            const resultItem = document.createElement('a');
            resultItem.href = `coin-detail.html?id=${coin.id}`;
            resultItem.innerHTML = `
                <img src="${coin.thumb}" alt="${coin.name}">
                <span>${coin.name} (${coin.symbol})</span>
            `;
            searchResults.appendChild(resultItem);
        });
    } else {
        searchResults.classList.remove('visible');
    }
}


// (共通) コインのリストを表示する関数 (変更なし)
function displayCoins(containerId, coins) {
    const content = document.querySelector(containerId);
    content.innerHTML = '';

    coins.forEach(coin => {
        const change = coin.price_change_percentage_24h;
        const changeClass = change >= 0 ? 'positive' : 'negative';

        const coinElement = document.createElement('div');
        coinElement.className = 'coin-item';
        coinElement.innerHTML = `
            <div class="coin-info">
                <img src="${coin.image}" alt="${coin.name}">
                <div class="coin-name">
                    <span>${coin.name}</span>
                    <span>${coin.symbol.toUpperCase()}</span>
                </div>
            </div>
            <div class="coin-price">
                <span class="price">¥${coin.current_price.toLocaleString()}</span>
                <div class="change ${changeClass}">${change ? change.toFixed(2) : '0.0'}%</div>
            </div>
        `;
        coinElement.addEventListener('click', () => {
            window.location.href = `coin-detail.html?id=${coin.id}`;
        });
        content.appendChild(coinElement);
    });
}