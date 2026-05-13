// Get id from URL
function getSeriesId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id'); // e.g., "lucifer"
}

// Render series function
function renderSeries(series) {
    const container = document.getElementById('series-container');

    if (!series) {
        container.innerHTML = "<p style='color:white;'>Series not found.</p>";
        return;
    }

    container.innerHTML = `
        <div class="movie-poster">
            <video src="${series.video}" autoplay loop muted controls crossorigin="anonymous"></video>
        </div>
        <h1 class="movie-title">${series.title}</h1>
        <div class="movie-info">
            <span>${series.year}</span>
            <span>${series.rating}</span>
            <span>${series.seasons}</span>
        </div>
        <div class="movie-buttons">
            <a href="videoplayer.html?ep=${series.episodes[0].ep}">Play</a>
        </div>
        <div class="movie-description">${series.description}</div>
        <div class="movie-credits">
            <span><strong>Starring:</strong> ${series.credits.starring}</span>
            <span><strong>Creator:</strong> ${series.credits.creator}</span>
        </div>
        <h2>Episodes</h2>
        <div class="episodes">
            ${series.episodes.map(ep => `
                <div class="episode">
                    <a href="videoplayer.html?ep=${ep.ep}">
                        <img src="${ep.img}" alt="${ep.title}">
                    </a>
                    <div class="episode-info">
                        <p class="episode-title">${ep.title}</p>
                        <p class="episode-length">${ep.length}</p>
                        <p class="episode-description">${ep.description}</p>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Load series based on URL
const seriesId = getSeriesId();
renderSeries(allSeries[seriesId] || allSeries['lucifer']); // fallback to lucifer if id missing