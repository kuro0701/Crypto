document.addEventListener('DOMContentLoaded', () => {
    // 比較テーブルが存在する場合に実行
    if (document.getElementById('comparison-table')) {
        loadComparisonData();
    }
});

async function loadComparisonData() {
    const projectIds = ['bitcoin', 'ethereum', 'tether']; // 分析済みのIDリスト
    const tableBody = document.querySelector('#comparison-table tbody');
    
    // 各プロジェクトのデータを並行して取得
    const projectDataPromises = projectIds.map(id => 
        fetch(`custom-data/${id}.json`).then(res => {
            if (!res.ok) throw new Error(`${id}.json not found`);
            return res.json();
        })
    );

    try {
        const projects = await Promise.all(projectDataPromises);
        
        // 取得したデータでテーブルを生成
        projects.forEach(data => {
            const r = data.rating;
            const d = r.details;
            const row = `
                <tr>
                    <td class="project-name">
                        <img src="${data.image}" alt="${data.name}">
                        <span>${data.name}</span>
                    </td>
                    <td data-label="総合評価"><span class="grade grade-${r.grade.replace('+', 'plus')}">${r.grade}</span> (${r.overall})</td>
                    <td data-label="将来性">${createRatingCell(d.future)}</td>
                    <td data-label="技術力">${createRatingCell(d.tech)}</td>
                    <td data-label="チーム">${createRatingCell(d.team)}</td>
                    <td data-label="トークノミクス">${createRatingCell(d.tokenomics)}</td>
                    <td data-label="コミュニティ">${createRatingCell(d.community)}</td>
                    <td data-label="詳細"><a href="coin-detail.html?id=${data.id}" class="detail-link">分析 <i class="fas fa-angle-right"></i></a></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

    } catch (error) {
        console.error("比較データの読み込みに失敗:", error);
        tableBody.innerHTML = `<tr><td colspan="8">データの読み込みに失敗しました。</td></tr>`;
    }
}

// 評価スコアに応じたバーを生成するヘルパー関数
function createRatingCell(score) {
    let colorClass = 'low';
    if (score >= 80) colorClass = 'high';
    else if (score >= 60) colorClass = 'medium';
    else if (score >= 40) colorClass = 'average';

    return `
        <div class="rating-cell">
            <span class="score-value">${score}</span>
            <div class="score-bar-bg">
                <div class="score-bar ${colorClass}" style="width: ${score}%;"></div>
            </div>
        </div>
    `;
}