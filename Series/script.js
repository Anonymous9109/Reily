document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const seriesId = params.get("id") || "steven-universe"; // Default fallback
  const series = window.seriesData ? window.seriesData[seriesId] : null;

  if (!series) {
    document.body.innerHTML = `<h2 style="color:white;text-align:center;margin-top:20%;">Series not found.</h2>`;
    return;
  }

  /********** 1) Inject UI Styles **********/
  const style = document.createElement("style");
  style.textContent = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background-color: #0f0f0f; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .hero-container { position: relative; width: 100%; height: 55vh; min-height: 350px; background-size: cover; background-position: center; }
    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to top, #0f0f0f 0%, rgba(15,15,15,0.4) 60%, rgba(0,0,0,0.8) 100%); display: flex; align-items: flex-end; padding: 2rem 5%; }
    .series-details { max-width: 700px; }
    .series-title { font-size: 2.8rem; font-weight: 800; margin-bottom: 0.5rem; text-shadow: 0 2px 8px rgba(0,0,0,0.7); }
    .series-desc { font-size: 1rem; color: #ccc; line-height: 1.5; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    
    .resume-btn { display: inline-flex; align-items: center; gap: 8px; background: #e50914; color: #fff; border: none; padding: 12px 24px; font-weight: 600; font-size: 1rem; border-radius: 4px; cursor: pointer; text-decoration: none; transition: background 0.2s; }
    .resume-btn:hover { background: #b80710; }

    .content-container { padding: 2rem 5%; }
    .controls-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 1px solid #222; padding-bottom: 1rem; }
    .season-select { background: #1a1a1a; color: #fff; border: 1px solid #333; padding: 10px 16px; font-size: 1rem; border-radius: 4px; cursor: pointer; outline: none; }
    
    .episodes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
    .ep-card { background: #181818; border-radius: 6px; overflow: hidden; cursor: pointer; text-decoration: none; color: white; border: 1px solid transparent; transition: transform 0.2s, border-color 0.2s; position: relative; }
    .ep-card:hover { transform: translateY(-4px); border-color: #333; }
    .ep-thumb { width: 100%; aspect-ratio: 16/9; background: #2a2a2a; display: flex; align-items: center; justify-content: center; color: #666; font-weight: bold; position: relative; }
    .ep-info { padding: 12px; }
    .ep-number { font-size: 0.85rem; color: #e50914; font-weight: 700; margin-bottom: 4px; }
    .ep-title { font-size: 0.95rem; font-weight: 600; }
    
    .ep-progress-bar { position: absolute; bottom: 0; left: 0; height: 4px; background: #e50914; width: 0%; }
  `;
  document.head.appendChild(style);

  /********** 2) Build Base DOM Structure **********/
  const app = document.createElement("div");
  app.innerHTML = `
    <div class="hero-container" style="background-image: url('${series.banner}')">
      <div class="hero-overlay">
        <div class="series-details">
          <h1 class="series-title">${series.title}</h1>
          <p class="series-desc">${series.description}</p>
          <div id="heroAction">
            <a href="player.html?id=${series.id}&season=1&ep=1" class="resume-btn">▶ Play Episode 1</a>
          </div>
        </div>
      </div>
    </div>
    <div class="content-container">
      <div class="controls-bar">
        <h2>Episodes</h2>
        <select id="seasonSelect" class="season-select"></select>
      </div>
      <div id="episodesGrid" class="episodes-grid"></div>
    </div>
  `;
  document.body.appendChild(app);

  /********** 3) Fetch Cloudflare D1 Watch Progress **********/
  const API_BASE_URL = "https://rinolski.misty-fog-201e.workers.dev";
  const AUTH_TOKEN = localStorage.getItem("session_token") || "";
  let watchProgress = {};

  if (AUTH_TOKEN) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/get-progress`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${AUTH_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        watchProgress = data.progress || {};
      }
    } catch (e) {
      console.error("Failed to load progress from D1:", e);
    }
  }

  /********** 4) Populate Seasons & Episodes **********/
  const seasonSelect = document.getElementById("seasonSelect");
  const episodesGrid = document.getElementById("episodesGrid");

  series.seasons.forEach((season) => {
    const opt = document.createElement("option");
    opt.value = season.seasonNumber;
    opt.textContent = `Season ${season.seasonNumber}`;
    seasonSelect.appendChild(opt);
  });

  function renderEpisodes(seasonNumber) {
    episodesGrid.innerHTML = "";
    const season = series.seasons.find(s => s.seasonNumber === parseInt(seasonNumber));
    if (!season) return;

    for (let i = 1; i <= season.totalEpisodes; i++) {
      const epCard = document.createElement("a");
      epCard.className = "ep-card";
      epCard.href = `player.html?id=${series.id}&season=${season.seasonNumber}&ep=${i}`;

      // Check D1 progress for this episode key
      const progressKey = `${series.id}_s${season.seasonNumber}_e${i}`;
      const epData = watchProgress[progressKey] || watchProgress[i]; 
      let pct = 0;
      if (epData && epData.duration > 0) {
        pct = Math.min(100, Math.max(0, (epData.left / epData.duration) * 100));
      }

      epCard.innerHTML = `
        <div class="ep-thumb">
          <span>EP ${i}</span>
          <div class="ep-progress-bar" style="width: ${pct}%"></div>
        </div>
        <div class="ep-info">
          <div class="ep-number">Episode ${i}</div>
          <div class="ep-title">Episode ${i}</div>
        </div>
      `;
      episodesGrid.appendChild(epCard);
    }
  }

  seasonSelect.addEventListener("change", (e) => renderEpisodes(e.target.value));
  
  // Render initial season
  renderEpisodes(series.seasons[0].seasonNumber);
});

