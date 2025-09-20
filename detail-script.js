document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const coinId = urlParams.get('id');

    if (coinId) {
        fetchCoinDetails(coinId);
        // 初期表示は7日間
        fetchOhlcData(coinId, '7');
        fetchNews();
        setupSearch();
        // 期間切り替えボタンのセットアップ
        setupChartControls(coinId);
    } else {
        window.location.href = 'index.html';
    }
});

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
let chart = null;

// コイン詳細データを取得
async function fetchCoinDetails(coinId) {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        displayCoinDetails(data);
    } catch (error) {
        console.error("Failed to fetch coin details:", error);
    }
}

// 取得したデータを表示
function displayCoinDetails(data) {
    const marketData = data.market_data;
    
    document.getElementById('coin-img').src = data.image.large;
    document.getElementById('coin-name').textContent = data.name;
    document.getElementById('coin-symbol').textContent = data.symbol.toUpperCase();
    document.getElementById('coin-price').textContent = `¥${marketData.current_price.jpy.toLocaleString()}`;

    const change = marketData.price_change_percentage_24h;
    const changeElement = document.getElementById('coin-change');
    changeElement.textContent = `${change.toFixed(2)}%`;
    changeElement.className = change >= 0 ? 'positive' : 'negative';
    
    document.getElementById('market-cap').textContent = `¥${marketData.market_cap.jpy.toLocaleString()}`;
    document.getElementById('volume-24h').textContent = `¥${marketData.total_volume.jpy.toLocaleString()}`;
    document.getElementById('circulating-supply').textContent = `${marketData.circulating_supply.toLocaleString()} ${data.symbol.toUpperCase()}`;
    document.getElementById('total-supply').textContent = marketData.total_supply ? `${marketData.total_supply.toLocaleString()} ${data.symbol.toUpperCase()}` : 'N/A';
    document.getElementById('high-24h').textContent = `¥${marketData.high_24h.jpy.toLocaleString()}`;
    document.getElementById('low-24h').textContent = `¥${marketData.low_24h.jpy.toLocaleString()}`;

    document.getElementById('coin-description').innerHTML = data.description.ja || data.description.en;

    const additionalInfo = document.getElementById('additional-info');
    additionalInfo.innerHTML = `
        <li><span class="label">公開日</span> <span class="value">${data.genesis_date || 'N/A'}</span></li>
        <li><span class="label">ハッシュアルゴリズム</span> <span class="value">${data.hashing_algorithm || 'N/A'}</span></li>
        <li><span class="label">コミュニティスコア</span> <span class="value">${data.community_score || 'N/A'}</span></li>
        <li><span class="label">ホームページ</span> <span class="value"><a href="${data.links.homepage[0]}" target="_blank">${data.links.homepage[0]}</a></span></li>
    `;
}

// OHLCデータを取得
async function fetchOhlcData(coinId, days) {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/ohlc?vs_currency=jpy&days=${days}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const formattedData = data.map(d => ({
            time: d[0] / 1000,
            open: d[1],
            high: d[2],
            low: d[3],
            close: d[4]
        }));
        renderCandlestickChart(formattedData);
    } catch (error) {
        console.error("Failed to fetch OHLC data:", error);
    }
}

// TradingView Lightweight Chartsでローソク足チャートを描画
function renderCandlestickChart(data) {
    const chartContainer = document.getElementById('priceChart');
    if (!chart) { // 初回のみチャートを作成
        chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: { backgroundColor: 'rgba(0,0,0,0)', textColor: '#E5E5EA' },
            grid: { vertLines: { color: 'rgba(255, 255, 255, 0.1)' }, horzLines: { color: 'rgba(255, 255, 255, 0.1)' } },
            crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
            rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.2)' },
            timeScale: { borderColor: 'rgba(255, 255, 255, 0.2)', timeVisible: true, secondsVisible: false },
        });

        const candlestickSeries = chart.addCandlestickSeries({
          upColor: '#34C759', downColor: '#FF3B30', borderDownColor: '#FF3B30',
          borderUpColor: '#34C759', wickDownColor: '#FF3B30', wickUpColor: '#34C759',
        });

        candlestickSeries.setData(data);
        chart.timeScale().fitContent();

        window.addEventListener('resize', () => chart.resize(chartContainer.clientWidth, 400));
    } else { // 2回目以降はデータを更新
        // 'findSeries' is not a function. Let's get all series and update the first one.
        const series = chart.serieses();
        if(series.length > 0){
             series[0].setData(data);
        }
        chart.timeScale().fitContent();
    }
}


// 期間切り替えボタンのセットアップ
function setupChartControls(coinId) {
    const buttons = document.querySelectorAll('.time-range-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const days = button.getAttribute('data-days');
            fetchOhlcData(coinId, days);
        });
    });
}

// ニュース取得
async function fetchNews() {
    const url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN';
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        const newsContent = document.getElementById('related-news-content');
        newsContent.innerHTML = '';

        data.Data.slice(0, 3).forEach(news => {
            const newsItem = `
                <div class="news-item">
                    <a href="${news.url}" target="_blank" rel="noopener noreferrer">
                        <h3>${news.title}</h3>
                        <p class="news-source">${news.source}</p>
                    </a>
                </div>`;
            newsContent.innerHTML += newsItem;
        });
    } catch (error {
        console.error("Fetching news failed: ", error);
        document.getElementById('related-news-content').innerHTML = "<p>ニュースの読み込みに失敗しました。</p>";
    }
}

// 検索機能
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