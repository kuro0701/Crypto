document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const coinId = urlParams.get('id');

    if (coinId) {
        loadCustomData(coinId);
    } else {
        // Coin IDがない場合はホームページにリダイレクト
        window.location.href = 'index.html';
    }
});

async function loadCustomData(coinId) {
    const customDataUrl = `custom-data/${coinId}.json`;

    try {
        const response = await fetch(customDataUrl);
        if (!response.ok) throw new Error('Custom data file not found.');
        
        const data = await response.json();

        // --- 基本情報の表示 (画像とタブの問題を解決) ---
        document.getElementById('coin-name').textContent = data.name || coinId;
        document.getElementById('coin-symbol').textContent = data.symbol || '';
        document.getElementById('coin-img').src = data.image_url || '';
        document.title = `${data.name || '不明なコイン'} - プロジェクト分析`;

        // --- 評価データの表示 ---
        if (data.rating) {
            const r = data.rating;
            const c = r.categories;
            document.getElementById('rating-score').innerHTML = `${r.score}<span>/100</span>`;
            document.getElementById('rating-grade').textContent = `評価: ${r.grade}`;
            document.getElementById('rating-future-score').textContent = c.future;
            document.getElementById('rating-future-bar').style.width = `${c.future}%`;
            document.getElementById('rating-tech-score').textContent = c.tech;
            document.getElementById('rating-tech-bar').style.width = `${c.tech}%`;
            document.getElementById('rating-team-score').textContent = c.team;
            document.getElementById('rating-team-bar').style.width = `${c.team}%`;
            document.getElementById('rating-tokenomics-score').textContent = c.tokenomics;
            document.getElementById('rating-tokenomics-bar').style.width = `${c.tokenomics}%`;
            document.getElementById('rating-community-score').textContent = c.community;
            document.getElementById('rating-community-bar').style.width = `${c.community}%`;
            document.getElementById('rating-comment').innerHTML = r.comment.replace(/\n/g, '<br>');
        }

        // --- 概要の表示 ---
        if (data.description) {
            document.getElementById('coin-description').innerHTML = data.description;
        }

        // --- 公式リンクの表示 ---
        if (data.officialLinks && data.officialLinks.length > 0) {
            displayOfficialLinks(data.officialLinks);
        } else {
            document.getElementById('official-links-container').style.display = 'none';
        }

    } catch (error) {
        console.error("Failed to load custom data:", error);
        document.querySelector('main').innerHTML = `
            <div class="card glass error-card">
                <h2><i class="fas fa-exclamation-triangle"></i> データ読み込みエラー</h2>
                <p>「${coinId}」の分析データが見つかりませんでした。</p>
                <a href="index.html" class="back-button">プロジェクト一覧に戻る</a>
            </div>`;
    }
}

function displayOfficialLinks(links) {
    const linksContainer = document.getElementById('official-links');
    linksContainer.innerHTML = '';
    
    links.forEach(link => {
        if (link.url) {
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
            linkElement.className = 'link-item';
            linkElement.innerHTML = `<i class="${getIconForLink(link.name)}"></i><span>${link.name}</span>`;
            linksContainer.appendChild(linkElement);
        }
    });
}

function getIconForLink(name) {
    const lowerCaseName = name.toLowerCase();
    if (lowerCaseName.includes('公式サイト') || lowerCaseName.includes('ホームページ')) return 'fas fa-home';
    if (lowerCaseName.includes('ホワイトペーパー')) return 'fas fa-file-alt';
    if (lowerCaseName.includes('github')) return 'fab fa-github';
    if (lowerCaseName.includes('twitter')) return 'fab fa-twitter';
    if (lowerCaseName.includes('reddit')) return 'fab fa-reddit-alien';
    if (lowerCaseName.includes('explorer')) return 'fas fa-cubes';
    if (lowerCaseName.includes('telegram')) return 'fab fa-telegram-plane';
    return 'fas fa-link';
}