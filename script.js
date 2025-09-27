document.addEventListener('DOMContentLoaded', () => {
    // ページ内に比較テーブルが存在する場合のみ、データの読み込みを実行します。
    if (document.getElementById('comparison-table')) {
        loadComparisonData();
    }
});

/**
 * 各プロジェクトのカスタムデータを読み込み、比較テーブルを生成します。
 */
async function loadComparisonData() {
    // 分析対象のプロジェクトIDを配列で管理します。
    const projectIds = ['bitcoin', 'ethereum', 'tether'];
    const tableBody = document.querySelector('#comparison-table tbody');
    
    // テーブルが存在しない場合は処理を中断します。
    if (!tableBody) return;

    // ユーザーに処理中であることを示すローディング表示を行います。
    tableBody.innerHTML = `<tr><td colspan="8">データを読み込んでいます...</td></tr>`;

    // 各プロジェクトのJSONファイルを非同期で並行して取得します。
    const fetchPromises = projectIds.map(id => 
        fetch(`custom-data/${id}.json`)
        .then(res => {
            // ファイルの取得に失敗した場合はエラーをスローします。
            if (!res.ok) throw new Error(`Failed to load ${id}.json`);
            return res.json();
        })
        .catch(error => {
            // エラーが発生したファイルについてはコンソールに記録し、nullを返して処理を続行させます。
            console.error(error);
            return null;
        })
    );

    try {
        // すべてのファイル取得処理が完了するのを待ちます。
        const projects = await Promise.all(fetchPromises);
        
        // 取得に成功したデータのみをフィルタリングします（エラーでnullになったものを除外）。
        const validProjects = projects.filter(p => p);

        // 有効なデータが一つもなかった場合は、エラーメッセージを表示します。
        if (validProjects.length === 0) {
            throw new Error("すべてのプロジェクトデータの読み込みに失敗しました。");
        }

        // ローディング表示をクリアし、テーブルの内容を生成します。
        tableBody.innerHTML = ''; 
        validProjects.forEach(data => {
            // データが存在しない場合に備えて、デフォルト値を設定します。
            const r = data.rating || {};
            const d = r.details || {};
            const row = `
                <tr>
                    <td class="project-name">
                        <img src="${data.image || ''}" alt="${data.name || ''}">
                        <span>${data.name || 'N/A'}</span>
                    </td>
                    <td data-label="総合評価"><span class="grade grade-${(r.grade || '').replace('+', 'plus')}">${r.grade || '-'}</span> (${r.overall || 0})</td>
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
        // データ処理中にエラーが発生した場合、テーブルにエラーメッセージを表示します。
        console.error("比較データの処理中にエラー:", error);
        tableBody.innerHTML = `<tr><td colspan="8" class="error-message">${error.message}</td></tr>`;
    }
}

/**
 * 評価スコアから、数値とビジュアルバーを含むHTMLセルを生成します。
 * @param {number} score - 評価スコア (0-100)
 * @returns {string} - テーブルセルに挿入するHTML文字列
 */
function createRatingCell(score) {
    const s = score || 0; // スコアが存在しない場合は0として扱います。
    let colorClass = 'low';
    if (s >= 80) colorClass = 'high';
    else if (s >= 60) colorClass = 'medium';
    else if (s >= 40) colorClass = 'average';

    return `
        <div class="rating-cell">
            <span class="score-value">${s}</span>
            <div class="score-bar-bg">
                <div class="score-bar ${colorClass}" style="width: ${s}%;"></div>
            </div>
        </div>
    `;
}