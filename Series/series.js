const series = {
  "breaking-bad": {
    title: "Breaking Bad",
    desc: "A chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine with a former student to secure his family's future.",
    video: "https://res.cloudinary.com/dn8w9kttq/video/upload/v1774284493/zk60iwa76xprasopmscv.mp4",
    episodes: {
      "s1e1": { title: "Pilot", play: "BreakingBad_S1E1" },
      "s1e2": { title: "Cat's in the Bag...", play: "BreakingBad_S1E2" },
      "s1e3": { title: "And the Bag's in the River", play: "BreakingBad_S1E3" }
    }
  },
  "steven-universe": {
    title: "Steven Universe",
    desc: "A team of interstellar warriors, the Crystal Gems, protects the universe while training their younger half-human, half-Gem brother Steven.",
    video: "",
    episodes: {
      "s1e1": { title: "Gem Glow", play: "StevenUniverse_S1E1" },
      "s1e2": { title: "Laser Light Cannon", play: "StevenUniverse_S1E2" }
    }
  }
};

async function loadDataFiles() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("series");

  if (!id) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>No series ID provided.</div>";
    return;
  }

  try {
    const searchResponse = await fetch("/JS/search.js");
    const searchText = await searchResponse.text();
    const cleanSearchText = searchText.replace(/const\s+(series|movies)\s*=/, "return ");
    const parseSearch = new Function(cleanSearchText);
    window.searchArray = parseSearch();

    const seriesResponse = await fetch("/Series/series.js");
    const seriesText = await seriesResponse.text();
    const cleanSeriesText = seriesText.replace(/const\s+(series|movies)\s*=/, "return ");
    const parseSeries = new Function(cleanSeriesText);
    window.seriesDetailsDict = parseSeries();

    renderPage(id);
  } catch (error) {
    window.seriesDetailsDict = series;
    renderPage(id);
  }
}

function renderPage(id) {
  const exactKey = Object.keys(window.seriesDetailsDict || {}).find(key => key.toLowerCase() === id.toLowerCase());
  const seriesData = exactKey ? window.seriesDetailsDict[exactKey] : null;

  if (!seriesData) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Series data not found.</div>";
    return;
  }

  window.currentSeriesData = seriesData;

  const matchedSearchItem = window.searchArray ? window.searchArray.find(s => {
    if (!s.link) return false;
    const urlPart = s.link.includes('?') ? s.link.split('?')[1] : s.link;
    const seriesId = new URLSearchParams(urlPart).get('series');
    return seriesId && seriesId.toLowerCase() === id.toLowerCase();
  }) : null;

  let imagePath = "";
  if (matchedSearchItem && matchedSearchItem.image) {
    const filename = matchedSearchItem.image.split('/').pop();
    imagePath = `/images/${filename}`;
  }

  setupAmbientBackground(imagePath);

  const titleEl = document.getElementById("title");
  if (titleEl) titleEl.textContent = seriesData.title;

  const descEl = document.getElementById("desc");
  if (descEl) descEl.textContent = seriesData.desc || "";

  renderEpisodeList(seriesData.episodes, id);
}

function renderEpisodeList(episodes, seriesId) {
  let listContainer = document.getElementById("episodesContainer");
  if (!listContainer) {
    listContainer = document.createElement("div");
    listContainer.id = "episodesContainer";
    listContainer.className = "episodes-container";
    
    const wrapper = document.getElementById("movieContentWrapper") || document.body;
    wrapper.appendChild(listContainer);
  }

  if (!episodes || Object.keys(episodes).length === 0) {
    listContainer.innerHTML = `<div class="empty-state">No episodes available yet.</div>`;
    return;
  }

  listContainer.innerHTML = `
    <h3 class="episodes-header">Episodes</h3>
    <div class="episodes-grid">
      ${Object.entries(episodes).map(([epKey, epData]) => `
        <div class="episode-card" onclick="playEpisode('${seriesId}', '${epData.play}')">
          <div class="ep-info">
            <span class="ep-key">${epKey.toUpperCase()}</span>
            <span class="ep-title">${escapeHtml(epData.title)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function setupAmbientBackground(imagePath) {
  let ambientBg = document.getElementById("ambientBg");

  if (!ambientBg) {
    ambientBg = document.createElement("div");
    ambientBg.id = "ambientBg";
    document.body.insertBefore(ambientBg, document.body.firstChild);
  }

  if (imagePath) {
    ambientBg.style.backgroundImage = `url('${imagePath}')`;
  }
}

function playEpisode(seriesId, playKey) {
  if (seriesId && playKey) {
    window.location.href = `videoplayer?ep=${playKey}&series=${seriesId}`;
  }
}

function escapeHtml(str) {
  return str ? String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
}

loadDataFiles();
