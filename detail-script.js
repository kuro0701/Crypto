document.addEventListener('DOMContentLoaded', () => {
    loadCoinData();
});

// コインデータの読み込み（カスタムデータのみ）
async function loadCoinData() {
    const params = new URLSearchParams(window.location.search);
    const coinId = params.get('id');

    if (!coinId) {
        displayError("コインIDが指定されていません。");
        return;
    }
    
    try {
        const response = await fetch(`custom-data/${coinId}.json`);
        if (!response.ok) throw new Error('評価ファイルが見つかりません。');
        const data = await response.json();
        
        // ページにデータを反映
        document.title = `${data.name} (${data.symbol}) 分析 | Crypto Analysis Hub`;
        document.getElementById('coin-img').src = data.image;
        document.getElementById('coin-name').textContent = data.name;
        document.getElementById('coin-symbol').textContent = data.symbol;
        
        // アナリストの視点
        document.getElementById('description-summary').textContent = data.description_summary || 'サマリーはありません。';

        // 評価データ
        displayCustomData(data);
        
        // 関連ブログ記事
        displayRelatedPosts(data.related_posts);

    } catch (error) {
        console.error("カスタムデータの読み込みエラー:", error);
        displayError("コイン情報の読み込みに失敗しました。");
    }
}


// (displayCustomData関数は変更なし)
function displayCustomData(data) {
    // ...
}

// 関連ブログ記事の表示
function displayRelatedPosts(posts) {
    const container = document.getElementById('related-posts-links');
    if (!posts || posts.length === 0) {
        container.innerHTML = '<p>関連する記事はありません。</p>';
        return;
    }

    let html = '';
    posts.forEach(post => {
        html += `<a href="${post.url}" class="link-item"><i class="fas fa-file-alt"></i> ${post.title}</a>`;
    });
    container.innerHTML = html;
}

// (displayError関数は変更なし)
function displayError(message) {
    // ...
}

// (不要になった関数を削除)
// displayMarketData, fetchMarketData, displayOfficialLinks, displayExchangesなど