document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const seriesSlug = params.get("series") || params.get("movie");

  if (!seriesSlug || !window.seriesData || !window.seriesData[seriesSlug]) {
    document.getElementById("error-msg").style.display = "block";
    return;
  }

  const data = window.seriesData[seriesSlug];
  document.getElementById("content").style.display = "block";

  // Populate Header Data
  document.getElementById("hero").style.backgroundImage = `url('${data.backdrop}')`;
  document.getElementById("poster").src = data.poster;
  document.getElementById("title").textContent = data.title;
  document.getElementById("synopsis").textContent = data.synopsis;

  const seasonsBar = document.getElementById("seasonsBar");
  const episodesList = document.getElementById("episodesList");

  // Format single digits with leading zero (e.g., 1 -> "01")
  const pad = (num) => String(num).padStart(2, "0");

  // Render Season Tabs
  data.seasons.forEach((season, index) => {
    const btn = document.createElement("button");
    btn.className = `season-tab ${index === 0 ? "active" : ""}`;
    btn.textContent = `Season ${season.seasonNumber}`;
    
    btn.onclick = () => {
      document.querySelectorAll(".season-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderSeasonEpisodes(season, data.epPrefix, seriesSlug);
    };
    
    seasonsBar.appendChild(btn);
  });

  // Dynamic Episode Card Generator
  function renderSeasonEpisodes(season, prefix, slug) {
    episodesList.innerHTML = "";
    const seasonStr = pad(season.seasonNumber);

    for (let i = 1; i <= season.totalEpisodes; i++) {
      const epStr = pad(i);
      const epId = `${prefix}S${seasonStr}E${epStr}`;
      const epTitle = `Episode ${i}`;

      const card = document.createElement("a");
      card.className = "episode-card";
      card.href = `/Movies/videoplayer?ep=${encodeURIComponent(epId)}&movie=${encodeURIComponent(slug)}`;

      card.innerHTML = `
        <div class="ep-info">
          <span class="ep-number">${i}</span>
          <div class="ep-title">${epTitle}</div>
        </div>
        <div class="ep-action">
          <div class="play-btn-wrapper">
            <svg viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>Play</span>
          </div>
        </div>
      `;
      
      episodesList.appendChild(card);
    }
  }

  // Load Season 1 on startup
  if (data.seasons.length > 0) {
    renderSeasonEpisodes(data.seasons[0], data.epPrefix, seriesSlug);
  }
});

