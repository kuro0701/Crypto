document.addEventListener('DOMContentLoaded', () => {
    loadCoinData();
});

/**
 * URLからコインIDを取得し、対応するデータを読み込んでページ全体を構築します。
 */
async function loadCoinData() {
    const params = new URLSearchParams(window.location.search);
    const coinId = params.get('id');

    // URLにコインIDがない場合はエラーを表示
    if (!coinId) {
        displayError("コインIDが指定されていません。");
        return;
    }
    
    try {
        // 対応するJSONファイルの読み込みを試みる
        const response = await fetch(`custom-data/${coinId}.json`);
        
        // ファイルが見つからない場合(404エラーなど)、「Coming Soon」画面を表示
        if (!response.ok) {
            throw new Error('ComingSoon');
        }
        const data = await response.json();
        
        // 取得したデータを使って、ページの各セクションを更新
        updatePageTitle(data);
        displayMainInfo(data);
        displaySummary(data);
        displayFullDescription(data);
        displayRating(data.rating);
        displayRelatedPosts(data.related_posts);
        displaySupportedExchanges(); // 引数を渡さずにDEXだけ表示
        updateOtherProjects(data.id);

    } catch (error) {
        console.error("カスタムデータの読み込みエラー:", error);
        // エラーの種類に応じて表示を切り替え
        if (error.message === 'ComingSoon') {
            displayComingSoon(coinId);
        } else {
            displayError("データの読み込み中に予期せぬエラーが発生しました。");
        }
    }
}

// --- 以下、各セクションを更新するための関数群 ---

/** ページのタイトルをコイン名で更新します */
function updatePageTitle(data) {
    document.title = `${data.name || 'プロジェクト'} (${data.symbol || ''}) 分析 | Crypto Analysis Hub`;
}

/** コインの基本情報（名前、シンボル、画像）を表示します */
function displayMainInfo(data) {
    document.getElementById('coin-img').src = data.image || '';
    document.getElementById('coin-name').textContent = data.name || '...';
    document.getElementById('coin-symbol').textContent = data.symbol || '';
}

/** 「アナリストの視点」セクションを更新します */
function displaySummary(data) {
    document.getElementById('description-summary').textContent = data.description_summary || 'アナリストの視点はありません。';
}

/** プロジェクト詳細情報を表示します */
function displayFullDescription(data) {
    document.getElementById('coin-description').innerHTML = data.description_full || '<p>詳細なプロジェクト情報はありません。</p>';
}

/** プロジェクト評価（スコア、グレード、各項目のバー）を更新します */
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
            if (score >= 80) barElement.style.backgroundColor = '#00C853'; // high
            else if (score >= 60) barElement.style.backgroundColor = '#4D8AFF'; // medium
            else if (score >= 40) barElement.style.backgroundColor = '#FFAB00'; // average
            else barElement.style.backgroundColor = '#FF5252'; // low
        }
    });
}

/** 関連分析記事のリンクを表示します */
function displayRelatedPosts(posts) {
    const container = document.getElementById('related-posts-links');
    const section = document.getElementById('related-posts-section');
    if (!posts || posts.length === 0) {
        if(section) section.style.display = 'none';
        return;
    }
    let html = '';
    posts.forEach(post => {
        html += `<a href="${post.url}" class="link-item"><i class="fas fa-file-alt"></i> ${post.title}</a>`;
    });
    container.innerHTML = html;
}

/** 取扱取引所（DEXのみ）を表示します */
function displaySupportedExchanges() {
    const container = document.getElementById('exchanges-links');
    if (!container) return;

    // 表示するDEXの情報を配列で定義
    const dexes = [
        { name: 'Rango Exchange', catchphrase: '100以上のDEX/ブリッジから最適ルートを検索', tags: ['DEXアグリゲーター', 'クロスチェーン対応', 'マルチチェーン対応'], detailUrl: 'exchange-detail.html', affiliateUrl: 'https://rango.vip/a/EptIv4', recommended: true },
        { name: 'ElectraDEX', catchphrase: 'Electra Protocol上のP2P DEX', tags: ['P2P', 'オンチェーン', '流動性プール不要'], detailUrl: 'electradex-detail.html', affiliateUrl: 'https://app.electra.trade/ref/49D6AjPd', recommended: false }
    ];

    let html = '<div class="exchange-list-detail">';
    dexes.forEach(dex => {
        html += `
            <div class="exchange-card-detail ${dex.recommended ? 'recommended' : ''}">
                ${dex.recommended ? '<div class="recommended-badge">DEX</div>' : ''}
                <div class="card-header"><div class="exchange-title"><h4>${dex.name}</h4><p>${dex.catchphrase}</p></div></div>
                <div class="tags">${dex.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>
                <div class="card-buttons"><a href="${dex.affiliateUrl}" class="btn btn-primary" target="_blank" rel="noopener noreferrer">スワップを始める</a><a href="${dex.detailUrl}" class="btn btn-secondary">詳細を見る</a></div>
            </div>`;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

/** 「他のプロジェクト」のリストを動的に生成します */
function updateOtherProjects(currentId) {
    const container = document.getElementById('other-projects-links');
    if (!container) return;

    const allProjects = [
        { id: 'bitcoin', name: 'Bitcoin', img: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png' },
        { id: 'ethereum', name: 'Ethereum', img: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png' },
        { id: 'tether', name: 'Tether', img: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png' },
        { id: 'xrp', name: 'XRP', img: 'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png'}
    ];

    let html = '';
    allProjects.forEach(proj => {
        if (proj.id !== currentId) {
            html += `<a href="coin-detail.html?id=${proj.id}" class="link-item"><img src="${proj.img}" alt="${proj.name}"> ${proj.name}</a>`;
        }
    });
    container.innerHTML = html;
}


/** データが見つからない場合に「Coming Soon」画面を表示します */
function displayComingSoon(coinId) {
    const mainContent = document.querySelector('.detail-layout');
    if (mainContent) {
        const coinName = coinId.charAt(0).toUpperCase() + coinId.slice(1);
        mainContent.innerHTML = `
            <div class="card glass error-card" style="grid-column: 1 / -1;">
                <h2><i class="fas fa-hourglass-half"></i> Coming Soon</h2>
                <p><strong>${coinName}</strong> の分析ページは現在準備中です。公開までしばらくお待ちください。</p>
                <p style="font-size: 1em; margin-top: 10px;">The analysis for <strong>${coinName}</strong> is currently being prepared. Please check back later.</p>
                <a href="index.html" class="back-button">プロジェクト一覧に戻る</a>
            </div>
        `;
    }
}

/** その他のエラーが発生した場合にエラーメッセージを表示します */
function displayError(message) {
    const mainContent = document.querySelector('.detail-layout');
    if(mainContent){
        mainContent.innerHTML = `
            <div class="card glass error-card" style="grid-column: 1 / -1;">
                <h2><i class="fas fa-exclamation-triangle"></i> エラーが発生しました</h2>
                <p>${message}</p>
                <a href="index.html" class="back-button">プロジェクト一覧に戻る</a>
            </div>
        `;
    }
}