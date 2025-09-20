document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const coinId = urlParams.get('id');

    if (coinId) {
        fetchCoinDetails(coinId);
    } else {
        window.location.href = 'index.html';
    }
});

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

/**
 * CoinGecko APIから仮想通貨の詳細データを取得して表示する
 * @param {string} coinId - 取得するコインのID (e.g., 'bitcoin')
 */
async function fetchCoinDetails(coinId) {
    // API URLを構築
    const url = `${COINGECKO_API_BASE}/coins/${coinId}?localization=ja&tickers=false&market_data=true&community_data=true&developer_data=false&sparkline=false`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data); // 取得したデータを確認
        displayCoinDetails(data);

    } catch (error) {
        console.error("Failed to fetch coin details:", error);
        // エラーが発生した場合、ユーザーにメッセージを表示
        document.querySelector('.container').innerHTML = `
            <h1 style="text-align: center;">情報の取得に失敗しました</h1>
            <p style="text-align: center;">時間をおいて再度お試しください。</p>
            <a href="index.html" class="back-button" style="text-align: center; display: block; margin-top: 20px;">ホームページに戻る</a>
        `;
    }
}

/**
 * 取得したデータをHTMLの各要素に反映させる
 * @param {object} data - CoinGecko APIから返されたデータオブジェクト
 */
function displayCoinDetails(data) {
    const marketData = data.market_data;

    // --- ヘッダー情報 ---
    document.getElementById('coin-img').src = data.image.large;
    document.getElementById('coin-name').textContent = data.name;
    document.getElementById('coin-symbol').textContent = data.symbol.toUpperCase();
    document.getElementById('coin-price').textContent = `¥${marketData.current_price.jpy.toLocaleString()}`;
    
    const priceChange = marketData.price_change_percentage_24h;
    const changeElement = document.getElementById('coin-change');
    changeElement.textContent = `${priceChange.toFixed(2)}%`;
    changeElement.className = priceChange >= 0 ? 'positive' : 'negative';

    // --- 統計情報 ---
    document.getElementById('market-cap-rank').textContent = `#${data.market_cap_rank}`;
    document.getElementById('market-cap').textContent = `¥${(marketData.market_cap.jpy / 100000000).toFixed(2)} 億円`;
    document.getElementById('volume-24h').textContent = `¥${(marketData.total_volume.jpy / 100000000).toFixed(2)} 億円`;
    document.getElementById('circulating-supply').textContent = `${Math.round(marketData.circulating_supply).toLocaleString()} ${data.symbol.toUpperCase()}`;
    document.getElementById('total-supply').textContent = data.market_data.total_supply ? `${Math.round(data.market_data.total_supply).toLocaleString()} ${data.symbol.toUpperCase()}` : '上限なし';
    document.getElementById('genesis-date').textContent = data.genesis_date || 'N/A';

    // --- プロジェクト概要 ---
    // APIからの説明文のリンクを新しいタブで開くように置換
    const description = data.description.ja || data.description.en;
    document.getElementById('coin-description').innerHTML = description.replace(/<a href/g, '<a target="_blank" href');

    // --- 公式リンク ---
    displayOfficialLinks(data.links);
}

/**
 * 公式リンクを動的に生成して表示する
 * @param {object} links - APIから取得したリンクオブジェクト
 */
function displayOfficialLinks(links) {
    const linksContainer = document.getElementById('official-links');
    linksContainer.innerHTML = ''; // コンテナをクリア

    const linkMapping = {
        'ホームページ': { url: links.homepage[0], icon: 'fas fa-home' },
        'ブロックチェーンエクスプローラー': { url: links.blockchain_site[0], icon: 'fas fa-cubes' },
        'Twitter': { url: `https://twitter.com/${links.twitter_screen_name}`, icon: 'fab fa-twitter' },
        'Facebook': { url: `https://facebook.com/${links.facebook_username}`, icon: 'fab fa-facebook' },
        'Telegram': { url: `https://t.me/${links.telegram_channel_identifier}`, icon: 'fab fa-telegram-plane' },
        'Reddit': { url: links.subreddit_url, icon: 'fab fa-reddit-alien' }
    };

    for (const [name, data] of Object.entries(linkMapping)) {
        if (data.url) { // URLが存在する場合のみリンクを作成
            const linkElement = document.createElement('a');
            linkElement.href = data.url;
            linkElement.target = '_blank';
            linkElement.className = 'link-item';
            linkElement.innerHTML = `<i class="${data.icon}"></i><span>${name}</span>`;
            linksContainer.appendChild(linkElement);
        }
    }
}