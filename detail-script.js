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

/**
 * ▼▼▼【変更点】取扱取引所セクションの表示ロジックを更新 ▼▼▼
 * @param {Array} exchanges - プロジェクトデータに含まれる取引所のリスト
 */
function displaySupportedExchanges(exchanges) {
    const container = document.getElementById('exchanges-links');
    if (!exchanges || exchanges.length === 0) {
        container.innerHTML = '<p>現在、国内の取扱取引所の情報はありません。</p>';
        return;
    }

    // サイトで定義済みの国内取引所情報（ロゴや特徴などを追加）
    const domesticExchanges = {
        'コインチェック': { 
            rank: 1, 
            logo: 'https://via.placeholder.com/50', // ロゴURL
            catchphrase: 'アプリDL数No.1！初心者ならまずココ',
            tags: ['初心者人気 No.1', 'アプリが使いやすい'],
            detailUrl: 'exchange-detail.html',
            affiliateUrl: '#' // アフィリエイトリンク
        },
        'GMOコイン': { 
            rank: 2, 
            logo: 'https://via.placeholder.com/50',
            catchphrase: '手数料で選ぶなら。オリコン満足度No.1',
            tags: ['手数料が安い', '取扱銘柄数が豊富'],
            detailUrl: '#',
            affiliateUrl: '#'
        },
        'bitFlyer': { 
            rank: 3, 
            logo: 'https://via.placeholder.com/50',
            catchphrase: 'BTC取引量6年連続No.1。信頼と実績',
            tags: ['セキュリティ重視', '1円から始められる'],
            detailUrl: '#',
            affiliateUrl: '#'
        }
    };

    // jsonデータと上記で定義した国内取引所情報をマージし、取扱のあるものだけを抽出
    const supportedDomesticExchanges = exchanges
        .map(ex => {
            const domesticData = domesticExchanges[ex.name];
            return domesticData ? { ...ex, ...domesticData } : null;
        })
        .filter(ex => ex !== null)
        .sort((a, b) => a.rank - b.rank); // ランキング順に並び替え

    if (supportedDomesticExchanges.length === 0) {
        container.innerHTML = '<p>現在、国内の取扱取引所の情報はありません。</p>';
        return;
    }

    // 新しいカードデザインのHTMLを生成
    let html = '<div class="exchange-list-detail">';
    supportedDomesticExchanges.forEach(ex => {
        html += `
            <div class="exchange-card-detail">
                <div class="card-header">
                    <img src="${ex.logo}" alt="${ex.name} Logo" class="exchange-logo">
                    <div class="exchange-title">
                        <h4><span class="rank-badge">${ex.rank}</span>${ex.name}</h4>
                        <p>${ex.catchphrase}</p>
                    </div>
                </div>
                <div class="tags">
                    ${ex.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <div class="card-buttons">
                    <a href="${ex.affiliateUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">公式サイトで無料口座開設</a>
                    <a href="${ex.detailUrl}" class="btn btn-secondary">詳細レビューを見る</a>
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