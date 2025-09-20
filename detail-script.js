document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const coinId = urlParams.get('id');

    if (coinId) {
        fetchCoinDetails(coinId);
        fetchOhlcData(coinId, '7'); // 初期表示は7日間
        setupChartControls(coinId);
        // setupSearch() と fetchNews() はこのファイルに存在しないため呼び出しを削除
    } else {
        window.location.href = 'index.html'; // IDがなければホームページへ
    }
});

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
let chart = null;
let candlestickSeries = null; // チャートのデータ系列を保持する変数

// --- キャッシュ関連のロジック (変更なし) ---
const CACHE_DURATION = 2 * 60 * 1000;
function setCache(key, data) {
    const cacheItem = { timestamp: new Date().getTime(), data: data };
    sessionStorage.setItem(key, JSON.stringify(cacheItem));
}
function getCache(key) {
    const cacheItem = sessionStorage.getItem(key);
    if (!cacheItem) return null;
    const item = JSON.parse(cacheItem);
    if (new Date().getTime() - item.timestamp > CACHE_DURATION) {
        sessionStorage.removeItem(key);
        return null;
    }
    return item.data;
}

// --- コイン詳細データの取得・表示 (変更なし) ---
async function fetchCoinDetails(coinId) {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        displayCoinDetails(data);
    } catch (error) {
        console.error("Failed to fetch coin details:", error);
    }
}
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
    // ... その他の表示処理 ...
}


// --- チャート関連のロジック (★改善版★) ---

/**
 * OHLCデータを取得してチャートを描画する
 * @param {string} coinId - コインのID
 * @param {string} days - 取得する日数
 */
async function fetchOhlcData(coinId, days) {
    const cacheKey = `ohlc_${coinId}_${days}`;
    const cachedData = getCache(cacheKey);

    if (cachedData) {
        console.log(`チャートデータをキャッシュから読み込みました (${coinId}, ${days}days)`);
        renderCandlestickChart(cachedData);
        return;
    }

    const chartContainer = document.getElementById('priceChart');
    chartContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">チャートを読み込み中...</p>';
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/ohlc?vs_currency=jpy&days=${days}`;

    try {
        console.log(`APIからチャートデータを取得中: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (!data || data.length === 0) {
            throw new Error("APIから有効なチャートデータが返されませんでした。");
        }

        const formattedData = data.map(d => ({
            time: d[0] / 1000,
            open: d[1],
            high: d[2],
            low: d[3],
            close: d[4]
        }));

        console.log(`チャートデータ ${formattedData.length} 件を整形しました`);
        setCache(cacheKey, formattedData);
        renderCandlestickChart(formattedData);

    } catch (error) {
        console.error("Failed to fetch OHLC data:", error);
        chartContainer.innerHTML = `<p style="text-align: center; color: var(--negative-color);">${error.message}</p>`;
    }
}

/**
 * ローソク足チャートを描画または更新する
 * @param {Array} data - 整形済みのチャートデータ
 */
function renderCandlestickChart(data) {
    const chartContainer = document.getElementById('priceChart');

    // チャートがなければ初期化
    if (!chart) {
        console.log("チャートを新規作成します");
        chartContainer.innerHTML = ''; // ローディング表示を消去
        chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 400,
            layout: {
                backgroundColor: 'transparent',
                textColor: '#E5E5EA',
            },
            grid: {
                vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
                horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.2)',
            },
        });
        candlestickSeries = chart.addCandlestickSeries({
            upColor: 'rgb(52, 199, 89)',
            downColor: 'rgb(255, 59, 48)',
            borderDownColor: 'rgb(255, 59, 48)',
            borderUpColor: 'rgb(52, 199, 89)',
            wickDownColor: 'rgb(255, 59, 48)',
            wickUpColor: 'rgb(52, 199, 89)',
        });
        window.addEventListener('resize', () => chart.resize(chartContainer.clientWidth, 400));
    }

    console.log("チャートにデータをセットしています...");
    candlestickSeries.setData(data);
    chart.timeScale().fitContent();
    console.log("チャートの描画/更新が完了しました");
}

/**
 * チャートの日数切り替えボタンを設定する
 * @param {string} coinId
 */
function setupChartControls(coinId) {
    const buttons = document.querySelectorAll('.time-range-btn');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const days = button.getAttribute('data-days');
            console.log(`チャート期間を ${days} 日に切り替えます`);
            fetchOhlcData(coinId, days);
        });
    });
}