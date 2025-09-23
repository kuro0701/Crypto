document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const coinId = urlParams.get('id');

    if (coinId) {
        // コイン詳細とチャートを読み込む
        fetchCoinDetails(coinId);
        fetchAndRenderChart(coinId, 7); // 初期表示は7日間

        // 時間軸ボタンにイベントを設定
        document.querySelectorAll('.time-range-btn').forEach(button => {
            button.addEventListener('click', () => {
                // 他ボタンの .active クラスを削除
                document.querySelector('.time-range-btn.active').classList.remove('active');
                // クリックしたボタンに .active クラスを追加
                button.classList.add('active');
                
                const days = button.dataset.days;
                fetchAndRenderChart(coinId, days);
            });
        });

    } else {
        window.location.href = 'index.html';
    }
});

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
let priceChartInstance = null; // チャートのインスタンスを保持する変数

/**
 * CoinGecko APIから仮想通貨の詳細データを取得して表示する
 * @param {string} coinId - 取得するコインのID (e.g., 'bitcoin')
 */
async function fetchCoinDetails(coinId) {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}?localization=ja&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        displayCoinDetails(data);
    } catch (error) {
        console.error("Failed to fetch coin details:", error);
    }
}


/**
 * CoinGecko APIからチャートデータを取得して描画する
 * @param {string} coinId - コインID
 * @param {number} days - 取得する日数 (e.g., 7, 30, 90)
 */
async function fetchAndRenderChart(coinId, days) {
    const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart?vs_currency=jpy&days=${days}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch chart data');
        const data = await response.json();
        
        // データをChart.jsのフォーマットに変換
        const chartData = data.prices.map(item => ({
            x: item[0], // タイムスタンプ
            y: item[1]  // 価格
        }));
        
        renderChart(chartData);

    } catch (error) {
        console.error("Failed to render chart:", error);
    }
}

/**
 * Chart.jsを使ってチャートを描画する
 * @param {Array} data - チャート用のデータ
 */
function renderChart(data) {
    const ctx = document.getElementById('priceChart').getContext('2d');

    // 既存のチャートがあれば破棄する
    if (priceChartInstance) {
        priceChartInstance.destroy();
    }
    
    // 線のグラデーションを作成
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(77, 138, 255, 0.5)');   
    gradient.addColorStop(1, 'rgba(77, 138, 255, 0.0)');

    priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: '価格 (JPY)',
                data: data,
                borderColor: '#4D8AFF',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.1,
                fill: true,
                backgroundColor: gradient,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        tooltipFormat: 'yyyy/MM/dd HH:mm'
                    },
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#8E8E93',
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        borderColor: 'transparent',
                    },
                    ticks: {
                        color: '#8E8E93',
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}


/**
 * (省略) 以降の関数は変更なし
 */
function displayCoinDetails(data) {
    const marketData = data.market_data;
    document.getElementById('coin-img').src = data.image.large;
    document.getElementById('coin-name').textContent = data.name;
    document.getElementById('coin-symbol').textContent = data.symbol.toUpperCase();
    document.getElementById('coin-price').textContent = `¥${marketData.current_price.jpy.toLocaleString()}`;
    const priceChange = marketData.price_change_percentage_24h;
    const changeElement = document.getElementById('coin-change');
    changeElement.textContent = `${priceChange ? priceChange.toFixed(2) : '0.00'}%`;
    changeElement.className = priceChange >= 0 ? 'positive' : 'negative';
    document.getElementById('market-cap-rank').textContent = `#${data.market_cap_rank}`;
    document.getElementById('market-cap').textContent = formatJapaneseYen(marketData.market_cap.jpy);
    document.getElementById('volume-24h').textContent = formatJapaneseYen(marketData.total_volume.jpy);
    document.getElementById('circulating-supply').textContent = `${Math.round(marketData.circulating_supply).toLocaleString()} ${data.symbol.toUpperCase()}`;
    document.getElementById('total-supply').textContent = data.market_data.total_supply ? `${Math.round(data.market_data.total_supply).toLocaleString()} ${data.symbol.toUpperCase()}` : '上限なし';
    document.getElementById('genesis-date').textContent = data.genesis_date || 'N/A';
    const description = data.description?.ja || data.description?.en || '概要はありません。';
    document.getElementById('coin-description').innerHTML = description.replace(/<a href/g, '<a target="_blank" href');
    displayOfficialLinks(data.links);
}

function formatJapaneseYen(number) {
    if (typeof number !== 'number') return 'N/A';
    const trillion = 1_000_000_000_000;
    const billion = 100_000_000;
    const million = 10_000;
    if (number >= trillion) return `¥ ${(number / trillion).toFixed(2)} 兆円`;
    if (number >= billion) return `¥ ${(number / billion).toFixed(2)} 億円`;
    if (number >= million) return `¥ ${(number / million).toLocaleString()} 万円`;
    return `¥ ${number.toLocaleString()} 円`;
}

function displayOfficialLinks(links) {
    const linksContainer = document.getElementById('official-links');
    linksContainer.innerHTML = ''; 
    const linkMapping = {'ホームページ': { url: links.homepage?.[0], icon: 'fas fa-home' },'エクスプローラー': { url: links.blockchain_site?.[0], icon: 'fas fa-cubes' },'Twitter': { url: links.twitter_screen_name ? `https://twitter.com/${links.twitter_screen_name}` : null, icon: 'fab fa-twitter' },'Facebook': { url: links.facebook_username ? `https://facebook.com/${links.facebook_username}` : null, icon: 'fab fa-facebook' },'Telegram': { url: links.telegram_channel_identifier ? `https://t.me/${links.telegram_channel_identifier}` : null, icon: 'fab fa-telegram-plane' },'Reddit': { url: links.subreddit_url, icon: 'fab fa-reddit-alien' }};
    let createdLinks = 0;
    for (const [name, data] of Object.entries(linkMapping)) {
        if (data.url) { 
            const linkElement = document.createElement('a');
            linkElement.href = data.url;
            linkElement.target = '_blank';
            linkElement.className = 'link-item';
            linkElement.innerHTML = `<i class="${data.icon}"></i><span>${name}</span>`;
            linksContainer.appendChild(linkElement);
            createdLinks++;
        }
    }
    if (createdLinks === 0) {
        linksContainer.closest('.card').style.display = 'none';
    }
}