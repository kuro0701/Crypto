document.addEventListener('DOMContentLoaded', () => {
    // グローバル市場データを取得
    fetchGlobalData();
    // コインリストの最初のページを取得
    fetchCoins(currentPage);
    // 検索バーのセットアップ
    setupSearch();
    // ページネーションのボタンにイベントを設定
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
});

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
let currentPage = 1;
const coinsPerPage = 100; // 1ページあたりのコイン数

/**
 * グローバル市場データを取得して表示する
 */
async function fetchGlobalData() {
    try {
        const response = await fetch(`${COINGECKO_API_BASE}/global`);
        if (!response.ok) throw new Error('Failed to fetch global data.');
        const data = await response.json();
        const globalData = data.data;
        const jpyData = globalData.total_market_cap.jpy;

        // 取得したデータを円単位にフォーマットして表示
        document.getElementById('marketCap').textContent = `¥${Math.round(jpyData / 1_000_000_000_000).toLocaleString()} 兆`;
        document.getElementById('volume24h').textContent = `¥${Math.round(globalData.total_volume.jpy / 1_000_000_000_000).toLocaleString()} 兆`;
        document.getElementById('btcDominance').textContent = `${globalData.market_cap_percentage.btc.toFixed(1)}%`;

    } catch (error) {
        console.error("Fetching global data failed:", error);
        document.getElementById('marketCap').textContent = "取得失敗";
        document.getElementById('volume24h').textContent = "取得失敗";
        document.getElementById('btcDominance').textContent = "取得失敗";
    }
}

/**
 * 指定されたページのコインデータを取得してテーブルに表示する
 * @param {number} page - 取得するページ番号
 */
async function fetchCoins(page) {
    const tableBody = document.getElementById('coinTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">読み込み中...</td></tr>'; // ローディング表示

    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=jpy&order=market_cap_desc&per_page=${coinsPerPage}&page=${page}&sparkline=false`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch coin data.');
        const coins = await response.json();
        
        displayCoinsInTable(coins);
        updatePaginationInfo();

    } catch (error) {
        console.error(`Fetching coins for page ${page} failed:`, error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">データの読み込みに失敗しました。</td></tr>';
    }
}

/**
 * 取得したコインデータをテーブルに描画する
 * @param {Array} coins - 表示するコインの配列
 */
function displayCoinsInTable(coins) {
    const tableBody = document.getElementById('coinTableBody');
    tableBody.innerHTML = ''; // テーブルをクリア

    coins.forEach(coin => {
        const change = coin.price_change_percentage_24h;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${coin.market_cap_rank}</td>
            <td>
                <div class="coin-info">
                    <img src="${coin.image}" alt="${coin.name}">
                    <div>
                        <span class="coin-name">${coin.name}</span>
                        <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                    </div>
                </div>
            </td>
            <td>¥${coin.current_price.toLocaleString()}</td>
            <td class="${changeClass}">${change ? change.toFixed(2) : 'N/A'}%</td>
            <td>¥${coin.market_cap.toLocaleString()}</td>
        `;
        // 行クリックで詳細ページへ遷移
        row.addEventListener('click', () => {
            window.location.href = `coin-detail.html?id=${coin.id}`;
        });
        tableBody.appendChild(row);
    });
}

/**
 * ページネーションの表示を更新する
 */
function updatePaginationInfo() {
    document.getElementById('pageInfo').textContent = `Page ${currentPage}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
}

/**
 * ページを変更する
 * @param {number} direction - 1 (次へ) または -1 (前へ)
 */
function changePage(direction) {
    if (currentPage + direction > 0) {
        currentPage += direction;
        fetchCoins(currentPage);
    }
}

/**
 * 検索機能のセットアップ
 */
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('keyup', (event) => {
        const query = event.target.value.toLowerCase();
        const rows = document.querySelectorAll('#coinTableBody tr');
        rows.forEach(row => {
            const coinName = row.querySelector('.coin-name').textContent.toLowerCase();
            const coinSymbol = row.querySelector('.coin-symbol').textContent.toLowerCase();
            if (coinName.includes(query) || coinSymbol.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}