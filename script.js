document.addEventListener('DOMContentLoaded', () => {
    fetchWatchlist();
    fetchTopGainersLosers();
    fetchNews();
    setupSearch();
});

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// 1. ウォッチリストのデータを取得・表示
async function fetchWatchlist() {
    const watchlistIds = ['bitcoin', 'ethereum', 'ripple', 'dogecoin'];
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=jpy&ids=${watchlistIds.join(',')}&order=market_cap_desc&per_page=10&page=1&sparkline=false`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        displayCoins('#watchlist-content', data);
    } catch (error) {
        console.error("Fetching watchlist failed: ", error);
        document.getElementById('watchlist-content').innerHTML = "<p>データの読み込みに失敗しました。</p>";
    }
}

// 2. トップゲイナー/ルーザーのデータを取得・表示
async function fetchTopGainersLosers() {
    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=jpy&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        // 24時間の変動率でソート
        const sorted = data.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        
        // トップ3ゲイナーとワースト3ルーザーを取得
        const topGainers = sorted.slice(0, 3);
        const topLosers = sorted.slice(-3).reverse();

        const combined = [...topGainers, ...topLosers];
        displayCoins('#gainers-losers-content', combined);

    } catch (error) {
        console.error("Fetching top gainers/losers failed: ", error);
        document.getElementById('gainers-losers-content').innerHTML = "<p>データの読み込みに失敗しました。</p>";
    }
}

// 3. トレンドニュースを取得・表示
async function fetchNews() {
    // 無料でAPIキー不要のCryptoCompare APIを使用
    const url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const newsContent = document.getElementById('news-content');
        newsContent.innerHTML = ''; // クリア

        // 最新5件のニュースを表示
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

// 4. 検索機能の設定
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
            }, 300); // 300ms待ってから検索を実行
        } else {
            searchResults.classList.remove('visible'); // .visible クラスを削除
        }
    });

    // どこかをクリックしたら検索結果を閉じる
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.remove('visible'); // .visible クラスを削除
        }
    });
}

// 検索結果を表示する
function displaySearchResults(coins) {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';

    if (coins && coins.length > 0) {
        searchResults.classList.add('visible'); // .visible クラスを追加
        coins.slice(0, 7).forEach(coin => { // 最大7件表示
            const resultItem = document.createElement('a');
            resultItem.href = `coin-detail.html?id=${coin.id}`;
            resultItem.innerHTML = `
                <img src="${coin.thumb}" alt="${coin.name}">
                <span>${coin.name} (${coin.symbol})</span>
            `;
            searchResults.appendChild(resultItem);
        });
    } else {
        searchResults.classList.remove('visible'); // .visible クラスを削除
    }
}


// (共通) コインのリストを表示する関数
function displayCoins(containerId, coins) {
    const content = document.querySelector(containerId);
    content.innerHTML = ''; // 既存のコンテンツをクリア

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
                    <span>${coin.symbol}</span>
                </div>
            </div>
            <div class="coin-price">
                <span class="price">¥${coin.current_price.toLocaleString()}</span>
                <div class="change ${changeClass}">${change.toFixed(2)}%</div>
            </div>
        `;
        // クリックしたら詳細ページに遷移
        coinElement.addEventListener('click', () => {
            window.location.href = `coin-detail.html?id=${coin.id}`;
        });
        content.appendChild(coinElement);
    });
}