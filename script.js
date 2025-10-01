document.addEventListener('DOMContentLoaded', async () => {
    try {
        // CoinGecko APIからトップ100の暗号通貨データを取得
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=jpy&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        
        // レスポンスが正常でない場合、エラーをスロー
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        // データをJSON形式に変換
        const data = await response.json();
        
        // crypto-list の中身をクリア
        const cryptoList = document.getElementById('crypto-list');
        cryptoList.innerHTML = ''; // 既存のデータをクリア

        // 取得したデータでテーブルを生成
        data.forEach(coin => {
            const row = document.createElement('tr');
            
            // 24h Change のスタイルを設定
            const priceChangeClass = coin.price_change_percentage_24h > 0 ? 'positive' : 'negative';
            
            // 修正箇所： a タグに btn-analyze クラスを追加
            row.innerHTML = `
                <td class="rank">${coin.market_cap_rank}</td>
                <td>
                    <div class="coin-name">
                        <img src="${coin.image}" alt="${coin.name}" class="coin-logo">
                        <span>${coin.name} <span class="text-secondary">${coin.symbol.toUpperCase()}</span></span>
                    </div>
                </td>
                <td>¥${coin.current_price.toLocaleString()}</td>
                <td class="${priceChangeClass}">${coin.price_change_percentage_24h.toFixed(2)}%</td>
                <td>¥${coin.market_cap.toLocaleString()}</td>
                <td><a href="coin-detail.html?id=${coin.id}" class="analyze-link btn-analyze">分析</a></td>
            `;
            
            cryptoList.appendChild(row);
        });

    } catch (error) {
        // エラーが発生した場合、コンソールに出力
        console.error('Error fetching crypto data:', error);
        // ユーザーにエラーメッセージを表示することも可能
        const cryptoList = document.getElementById('crypto-list');
        cryptoList.innerHTML = '<tr><td colspan="6">データの読み込みに失敗しました。時間をおいて再度お試しください。</td></tr>';
    }
});