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
        displayRating(data.rating);
        displayRelatedPosts(data.related_posts);
        // 取扱取引所セクションの表示を呼び出します。
        displaySupportedExchanges();

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

function displayRating(rating) {
    const r = rating || {};
    const d = r.details || {};
    document.getElementById('rating-score').innerHTML = `${r.overall || '--'}<span>/100</span>`;
    document.getElementById('rating-grade').textContent = `評価: ${r.grade || '-'}`;
    document.getElementById('rating-comment').textContent = r.comment || '';

    const categories = ['future', 'tech', 'team', 'tokenomics', 'community'];
    categories.forEach(cat => {
        const score = d[cat] || 0;
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

function displaySupportedExchanges() {
    const container = document.getElementById('exchanges-links');
    
    // 表示するDEXの情報を配列で定義
    const dexes = [
        {
            name: 'Rango Exchange',
            catchphrase: '100以上のDEX/ブリッジから最適ルートを検索',
            tags: ['DEXアグリゲーター', 'クロスチェーン対応', 'マルチチェーン対応'],
            detailUrl: 'exchange-detail.html',
            affiliateUrl: 'https://rango.vip/a/EptIv4',
            recommended: true
        },
        {
            name: 'ElectraDEX',
            catchphrase: 'Electra Protocol上のP2P DEX',
            tags: ['P2P', 'オンチェーン', '流動性プール不要'],
            detailUrl: 'electradex-detail.html',
            affiliateUrl: 'https://app.electra.trade/ref/49D6AjPd',
            recommended: false
        }
    ];

    // 新しいカードデザインのHTMLを生成
    let html = '<div class="exchange-list-detail">';
    dexes.forEach(dex => {
        html += `
            <div class="exchange-card-detail ${dex.recommended ? 'recommended' : ''}">
                ${dex.recommended ? '<div class="recommended-badge">DEX</div>' : ''}
                <div class="card-header">
                    <div class="exchange-title">
                        <h4>${dex.name}</h4>
                        <p>${dex.catchphrase}</p>
                    </div>
                </div>
                <div class="tags">
                    ${dex.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="card-buttons">
                    <a href="${dex.affiliateUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">スワップを始める</a>
                    <a href="${dex.detailUrl}" class="btn btn-secondary">詳細を見る</a>
                </div>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;
}

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
// --- 追記ここから ---

document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('toggle-details-btn');
    const detailsContainer = document.getElementById('evaluation-details');

    if (toggleBtn && detailsContainer) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = detailsContainer.classList.toggle('hidden');
            toggleBtn.textContent = isHidden ? '詳細を見る' : '閉じる';
        });
    }
});

// --- 追記ここまで ---