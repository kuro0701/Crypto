document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const coinId = urlParams.get('id');

    if (coinId) {
        fetchCoinDetails(coinId);
        fetchOhlcData(coinId, '7');
        fetchNews();
        setupSearch();
        setupChartControls(coinId);
    } else {
        window.location.href = 'index.html';
    }
});

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
let chart = null;

// --- ここからキャッシュ関連のロジック ---

// キャッシュの有効期間（ミリ秒）。ここでは2分に設定。
const CACHE_DURATION = 2 * 60 * 1000;

// データをキャッシュに保存
function setCache(key, data) {
    const cacheItem = {
        timestamp: new Date().getTime(),
        data: data
    };
    sessionStorage.setItem(key, JSON.stringify(cacheItem));
}

// キャッシュからデータを取得
function getCache(key) {
    const cacheItem = sessionStorage.getItem(key);
    if (!cacheItem) return null;

    const item = JSON.parse(cacheItem);
    // キャッシュが有効期間内かチェック
    if (new Date().getTime() - item.timestamp > CACHE_DURATION) {
        sessionStorage.removeItem(key);
        return null;
    }
    return item.data;
}

// --- キャッシュ関連ここまで ---


// コイン詳細データを取得 (キャッシュ対応)
async function fetchCoinDetails(coinId) {
    const cacheKey = `details_${coinId}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        displayCoinDetails(cachedData);
        return;
    }

    const url = `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setCache(cacheKey, data); // 取得したデータをキャッシュに保存
        displayCoinDetails(data);
    } catch (error) {
        console.error("Failed to fetch coin details:", error);
        // エラーメッセージをユーザーに表示するなどの処理
    }
}

// 取得したデータを表示 (変更なし)
function displayCoinDetails(data) {
    // (この関数の中身は変更ありません)
    const marketData = data.market_data;
    document.getElementById('coin-img').src = data.image.large;
    document.getElementById('coin-name').textContent = data.name;
    // ... 以下、省略 ...
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


// OHLCデータを取得 (キャッシュ対応 & エラー処理)
async function fetchOhlcData(coinId, days) {
    const cacheKey = `ohlc_${coinId}_${days}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        renderCandlestickChart(cachedData);
        return;
    }

    const chartContainer = document.getElementById('priceChart');
    chartContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">チャートを読み込み中...</p>'; // ローディング表示

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
        setCache(cacheKey, formattedData); // 整形後のデータをキャッシュ
        renderCandlestickChart(formattedData);
    } catch (error) {
        console.error("Failed to fetch OHLC data:", error);
        chartContainer.innerHTML = '<p style="text-align: center; color: var(--negative-color);">チャートの読み込みに失敗しました。時間をおいて再読み込みしてください。</p>'; // エラー表示
    }
}

// TradingView Lightweight Chartsでローソク足チャートを描画 (一部変更)
function renderCandlestickChart(data) {
    const chartContainer = document.getElementById('priceChart');
    chartContainer.innerHTML = ''; // ローディングやエラーメッセージをクリア

    if (!chart) {
        chart = LightweightCharts.createChart(chartContainer, { /* ... スタイル設定は省略 ... */ });
        const candlestickSeries = chart.addCandlestickSeries({ /* ... スタイル設定は省略 ... */ });
        candlestickSeries.setData(data);
        chart.timeScale().fitContent();
        window.addEventListener('resize', () => chart.resize(chartContainer.clientWidth, 400));
    } else {
        const series = chart.serieses();
        if (series.length > 0) {
            series[0].setData(data);
        }
        chart.timeScale().fitContent();
    }
}

// (setupChartControls, fetchNews, setupSearchなどの他の関数は変更なし)

// ... (以下、変更のない他の関数が続く) ...

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
async function fetchNews() {
    // ... (変更なし) ...
}
function setupSearch() {
    // ... (変更なし) ...
}
function displaySearchResults(coins) {
    // ... (変更なし) ...
}