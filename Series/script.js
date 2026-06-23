// script.js - Interactive UI & Dynamic Target Reference Generator
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("series-navigation-container");
  if (!container) return;

  // Track currently selected show via a query parameter or dataset (e.g., ?show=AdventureTime)
  const currentShowId = new URLSearchParams(window.location.search).get("show") || "AdventureTime";
  const showInfo = window.seriesData ? window.seriesData[currentShowId] : null;

  if (!showInfo) {
    container.innerHTML = "<p>Series layout mapping parameters not found.</p>";
    return;
  }

  const showHeader = document.createElement("h2");
  showHeader.innerText = showInfo.title;
  container.appendChild(showHeader);

  // Loop through all configured seasons extracted dynamically out from series.js
  Object.keys(showInfo.seasons).forEach((seasonNum) => {
    const seasonWrapper = document.createElement("div");
    seasonWrapper.className = "season-wrapper";
    
    const seasonTitle = document.createElement("h3");
    seasonTitle.innerText = `Season ${seasonNum}`;
    seasonWrapper.appendChild(seasonTitle);

    const episodeGrid = document.createElement("div");
    episodeGrid.className = "episode-grid";

    const totalEpisodes = showInfo.seasons[seasonNum];
    
    // Create functional buttons for each mapped episode inside the season scope
    for (let epNum = 1; epNum <= totalEpisodes; epNum++) {
      const epButton = document.createElement("button");
      epButton.className = "episode-btn";
      epButton.innerText = `Episode ${epNum}`;

      // CRITICAL LOGIC: Construct standard query tracking values
      // Generates target key parameter value: e.g. "AdventureTime-S1E1"
      const specificEpisodePrefix = `${showInfo.id}-S${seasonNum}E${epNum}`;

      epButton.onclick = () => {
        // Redirect completely into player scope with dynamic prefix lookup mappings
        window.location.href = `/player.html?id=${showInfo.id}&ep=${specificEpisodePrefix}`;
      };

      episodeGrid.appendChild(epButton);
    }

    seasonWrapper.appendChild(episodeGrid);
    container.appendChild(seasonWrapper);
  });
});

