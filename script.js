document.addEventListener('DOMContentLoaded', () => {
    fetchTrendingCoins();
    fetchMarketData();
});

// より安定したCORSプロキシに変更
const CORS_PROXY = "https://https-cors-anywhere.vercel.app/";
const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

async function fetchTrendingCoins() {
    // プロキシをURLの先頭に追加
    const url = `${CORS_PROXY}${COINGECKO_API_BASE}/search/trending`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        displayTrendingCoins(data.coins);
    } catch (error) {
        console.error("Failed to fetch trending coins:", error);
    }
}

async function fetchMarketData() {
    // プロキシをURLの先頭に追加
    const url = `${CORS_PROXY}${COINGECKO_API_BASE}/coins/markets?vs_currency=jpy&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        displayMarketData(data);
    } catch (error) {
        console.error("Failed to fetch market data:", error);
    }
}


function displayTrendingCoins(coins) {
    const container = document.getElementById('trending-coins-container');
    container.innerHTML = '';
    coins.forEach(coin => {
        const coinItem = `
            <a href="coin-detail.html?id=${coin.item.id}" class="trending-coin">
                <img src="${coin.item.small}" alt="${coin.item.name}">
                <div class="trending-coin-info">
                    <p class="coin-name">${coin.item.name}</p>
                    <p class="coin-symbol">${coin.item.symbol.toUpperCase()}</p>
                </div>
                 <p class="coin-rank">#${coin.item.market_cap_rank}</p>
            </a>
        `;
        container.innerHTML += coinItem;
    });
}

function displayMarketData(coins) {
    const tbody = document.getElementById('crypto-table-body');
    tbody.innerHTML = '';
    coins.forEach(coin => {
        const priceChange = coin.price_change_percentage_24h;
        const changeClass = priceChange >= 0 ? 'positive' : 'negative';

        const row = `
            <tr>
                <td class="rank">#${coin.market_cap_rank}</td>
                <td class="coin">
                    <a href="coin-detail.html?id=${coin.id}">
                        <img src="${coin.image}" alt="${coin.name}">
                        <span>${coin.name} <span class="symbol">${coin.symbol.toUpperCase()}</span></span>
                    </a>
                </td>
                <td class="price">¥${coin.current_price.toLocaleString()}</td>
                <td class="change ${changeClass}">${priceChange ? priceChange.toFixed(2) : '0.00'}%</td>
                <td class="market-cap">¥${coin.market_cap.toLocaleString()}</td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}