document.addEventListener('DOMContentLoaded', () => {
    loadCoinData();
});

/**
 * URLパラメータからコインIDを取得し、対応するカスタムデータを読み込んでページに表示します。
 */
async function loadCoinData() {
    const params = new URLSearchParams(window.location.search);
    const coinId = params.get('id');

    if (!coinId) {
        displayError("コインIDが指定されていません。");
        return;
    }
    
    try {
        const response = await fetch(`custom-data/${coinId}.json`);
        if (!response.ok) {
            throw new Error('指定されたプロジェクトの評価ファイルが見つかりません。');
        }
        const data = await response.json();
        
        // 取得したデータを使って、ページの各セクションを更新します。
        displayPageTitle(data);
        displayMainInfo(data);
        displaySummary(data);
        displayFullDescription(data);
        displayRating(data.rating); // <-- この関数の中身が抜けていました
        displayRelatedPosts(data.related_posts);
        displaySupportedExchanges(data.supported_exchanges);

    } catch (error) {
        console.error("カスタムデータの読み込みエラー:", error);
        displayError(error.message);
    }
}

// --- 各セクションの表示を更新する関数群 ---

function displayPageTitle(data) {
    document.title = `${data.name || 'プロジェクト'} (${data.symbol || ''}) 分析 | Crypto Analysis Hub`;
}

function displayMainInfo(data) {
    document.getElementById('coin-img').src = data.image || '';
    document.getElementById('coin-name').textContent = data.name || '...';
    document.getElementById('coin-symbol').textContent = data.symbol || '';
}

function displaySummary(data) {
    document.getElementById('description-summary').textContent = data.description_summary || 'アナリストの視点はありません。';
}

function displayFullDescription(data) {
    document.getElementById('coin-description').innerHTML = data.description_full || '<p>詳細なプロジェクト情報はありません。</p>';
}

/**
 * ▼▼▼【重要】ここが前回、完全に抜け落ちていた評価表示のロジックです ▼▼▼
 * 評価データを読み込み、スコア、グレード、詳細なレーティングバーをHTMLに描画します。
 * @param {object} rating - 評価データオブジェクト
 */
function displayRating(rating) {
    const r = rating || {};
    const d = r.details || {};
    document.getElementById('rating-score').innerHTML = `${r.overall || '--'}<span>/100</span>`;
    document.getElementById('rating-grade').textContent = `評価: ${r.grade || '-'}`;
    document.getElementById('rating-comment').textContent = r.comment || '';

    const categories = ['future', 'tech', 'team', 'tokenomics', 'community'];
    categories.forEach(cat => {
        const score = d[cat] || 0;
        // 各要素が存在するか確認してから更新
        const scoreElement = document.getElementById(`rating-${cat}-score`);
        if (scoreElement) scoreElement.textContent = score;
        
        const barElement = document.getElementById(`rating-${cat}-bar`);
        if (barElement) {
            barElement.style.width = `${score}%`;
            if (score >= 80) barElement.style.backgroundColor = '#00C853';
            else if (score >= 60) barElement.style.backgroundColor = '#4D8AFF';
            else if (score >= 40) barElement.style.backgroundColor = '#FFAB00';
            else barElement.style.backgroundColor = '#FF5252';
        }
    });
}

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

function displaySupportedExchanges(exchanges) {
    const container = document.getElementById('exchanges-links');
    if (!exchanges || exchanges.length === 0) {
        container.innerHTML = '<p>取扱取引所の情報はありません。</p>';
        return;
    }
    let html = '';
    exchanges.forEach(ex => {
        html += `<a href="${ex.url}" class="exchange-link-item"><i class="fas fa-store"></i> ${ex.name}</a>`;
    });
    container.innerHTML = html;
}

/**
 * エラーメッセージをページ全体に表示します。
 * @param {string} message - 表示するエラーメッセージ
 */
function displayError(message) {
    const mainContent = document.querySelector('.detail-layout');
    if(mainContent){
        mainContent.innerHTML = `
            <div class="card glass error-card" style="grid-column: 1 / -1;">
                <h2><i class="fas fa-exclamation-triangle"></i> エラー</h2>
                <p>${message}</p>
                <a href="index.html" class="back-button">プロジェクト一覧に戻る</a>
            </div>
        `;
    }
}