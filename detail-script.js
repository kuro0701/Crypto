document.addEventListener('DOMContentLoaded', function() {
    const params = new URLSearchParams(window.location.search);
    const coinId = params.get('id');

    // List of all available coin IDs
    const availableCoins = ['bitcoin', 'ethereum', 'bnb', 'xrp', 'tether', 'solana'];

    if (coinId && availableCoins.includes(coinId)) {
        fetch(`./custom-data/${coinId}.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Populate general coin info
                document.getElementById('coin-name').textContent = data.name;
                document.getElementById('coin-symbol').textContent = `(${data.symbol.toUpperCase()})`;
                document.getElementById('coin-image').src = data.image;
                document.getElementById('description-summary').textContent = data.description_summary;
                document.getElementById('description-full').innerHTML = data.description_full;

                // Populate rating
                document.getElementById('overall-rating').textContent = data.rating.overall;
                document.getElementById('rating-grade').textContent = data.rating.grade;
                document.getElementById('rating-comment').textContent = data.rating.comment;

                // Populate rating details
                const futureScore = data.rating.details.future;
                const techScore = data.rating.details.tech;
                const teamScore = data.rating.details.team;
                const tokenomicsScore = data.rating.details.tokenomics;
                const communityScore = data.rating.details.community;

                document.querySelector('.future .score').textContent = futureScore;
                document.querySelector('.future .bar-inner').style.width = `${futureScore}%`;
                document.querySelector('.tech .score').textContent = techScore;
                document.querySelector('.tech .bar-inner').style.width = `${techScore}%`;
                document.querySelector('.team .score').textContent = teamScore;
                document.querySelector('.team .bar-inner').style.width = `${teamScore}%`;
                document.querySelector('.tokenomics .score').textContent = tokenomicsScore;
                document.querySelector('.tokenomics .bar-inner').style.width = `${tokenomicsScore}%`;
                document.querySelector('.community .score').textContent = communityScore;
                document.querySelector('.community .bar-inner').style.width = `${communityScore}%`;

            })
            .catch(error => {
                console.error('Error fetching coin data:', error);
                document.getElementById('coin-detail-container').innerHTML = '<p>コインデータの読み込み中にエラーが発生しました。</p>';
            });
    } else {
        document.getElementById('coin-detail-container').innerHTML = '<p>指定されたコインが見つかりません。</p>';
    }
});