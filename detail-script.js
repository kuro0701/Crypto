document.addEventListener('DOMContentLoaded', async () => {
    // 1. URLからコインのIDを取得
    const params = new URLSearchParams(window.location.search);
    const coinId = params.get('id');

    if (!coinId) {
        // IDがない場合はメインページにリダイレクトするか、エラーメッセージを表示
        document.querySelector('.main-content').innerHTML = '<h1>コインが指定されていません。</h1><a href="index.html">ホームに戻る</a>';
        return;
    }

    try {
        // 2. CoinGecko APIとローカルのカスタムデータから情報を並行して取得
        const [apiResponse, customDataResponse] = await Promise.all([
            fetch(`https://api.coingecko.com/api/v3/coins/${coinId}`),
            fetch(`custom-data/${coinId}.json`)
        ]);

        if (!apiResponse.ok) {
            throw new Error(`APIからのデータ取得に失敗しました: ${apiResponse.statusText}`);
        }
        if (!customDataResponse.ok) {
            throw new Error(`カスタムデータの読み込みに失敗しました: ${customDataResponse.statusText}`);
        }

        const apiData = await apiResponse.json();
        const customData = await customDataResponse.json();

        // 3. 取得したデータを使ってページの内容を更新
        populateCoinDetails(apiData, customData);

    } catch (error) {
        console.error('詳細データの読み込み中にエラーが発生しました:', error);
        document.querySelector('.main-content').innerHTML = `<h1>情報の取得に失敗しました。</h1><p>${error.message}</p><a href="index.html">ホームに戻る</a>`;
    }

    // 4. 詳細表示ボタンのイベントリスナーを設定
    const toggleBtn = document.getElementById('toggle-details-btn');
    const detailsContainer = document.getElementById('evaluation-details');

    if (toggleBtn && detailsContainer) {
        toggleBtn.addEventListener('click', () => {
            const isHidden = detailsContainer.classList.toggle('hidden');
            toggleBtn.textContent = isHidden ? '詳細を見る' : '閉じる';
        });
    }
});

/**
 * 取得したデータをもとにHTML要素を埋める関数
 * @param {object} apiData - CoinGecko APIから取得したデータ
 * @param {object} customData - ローカルのJSONファイルから取得したデータ
 */
function populateCoinDetails(apiData, customData) {
    // ヘッダー情報
    document.getElementById('coin-logo').src = apiData.image.large;
    document.getElementById('coin-name').textContent = apiData.name;
    document.getElementById('coin-symbol').textContent = apiData.symbol.toUpperCase();

    // 概要
    // 日本語の説明があればそれを使い、なければ英語の説明を表示
    const description = apiData.description.ja || apiData.description.en;
    document.getElementById('coin-description').innerHTML = description;

    // 総合評価
    const totalScore = customData.total_score;
    document.getElementById('total-score').textContent = totalScore;
    document.getElementById('score-grade').textContent = getGrade(totalScore);
    document.getElementById('score-grade').className = `score-grade grade-${getGrade(totalScore)}`; // スタイル用のクラスも設定
    document.getElementById('score-comment').textContent = customData.comment;
    
    // プロジェクト評価（各項目）
    const evaluations = customData.evaluation;
    for (const key in evaluations) {
        const score = evaluations[key];
        document.getElementById(`${key}-score`).textContent = score;
        const bar = document.getElementById(`${key}-bar`);
        bar.style.width = `${score}%`;
        bar.style.backgroundColor = getBarColor(score);
    }
}

/**
 * スコアに応じた評価グレードを返す
 * @param {number} score - 総合スコア
 * @returns {string} グレード (S, A, B, C, D)
 */
function getGrade(score) {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
}

/**
 * スコアに応じたバーの色を返す
 * @param {number} score - 各項目のスコア
 * @returns {string} 色のHEXコード
 */
function getBarColor(score) {
    if (score >= 80) return '#4caf50'; // Green
    if (score >= 60) return '#ffc107'; // Amber
    return '#f44336'; // Red
}