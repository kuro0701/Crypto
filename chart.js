// chart.js

// チャートを描画するDOM要素を取得
const chartContainer = document.getElementById('tv-chart');

// TradingViewのチャートを作成
const chart = LightweightCharts.createChart(chartContainer, {
    width: chartContainer.clientWidth,
    height: chartContainer.clientHeight,
    layout: {
        backgroundColor: 'rgba(0, 0, 0, 0)', // 背景はCSS側で制御するため透明に
        textColor: '#d1d4dc',
    },
    grid: {
        vertLines: {
            color: 'rgba(42, 46, 57, 0.5)',
        },
        horzLines: {
            color: 'rgba(42, 46, 57, 0.5)',
        },
    },
    crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
    },
    rightPriceScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
    },
    timeScale: {
        borderColor: 'rgba(197, 203, 206, 0.4)',
        timeVisible: true,
        secondsVisible: false,
    },
});

// ローソク足シリーズを追加
const candleSeries = chart.addCandlestickSeries({
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderDownColor: '#ef5350',
  borderUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  wickUpColor: '#26a69a',
});


// --- サンプルデータ ---
// 本来はCoinGecko APIなどから取得します
const sampleData = [
    { time: '2025-09-15', open: 9850000, high: 9920000, low: 9810000, close: 9880000 },
    { time: '2025-09-16', open: 9880000, high: 9990000, low: 9870000, close: 9980000 },
    { time: '2025-09-17', open: 9980000, high: 10050000, low: 9950000, close: 10020000 },
    { time: '2025-09-18', open: 10020000, high: 10120000, low: 10010000, close: 10100000 },
    { time: '2025-09-19', open: 10100000, high: 10150000, low: 10060000, close: 10130000 },
    { time: '2025-09-20', open: 10130000, high: 10180000, low: 10090000, close: 10160000 },
];
// --- サンプルデータここまで ---

// チャートにデータをセット
candleSeries.setData(sampleData);

// ウィンドウサイズが変更された時にチャートをリサイズ
window.addEventListener('resize', () => {
    chart.resize(chartContainer.clientWidth, chartContainer.clientHeight);
});