document.addEventListener("DOMContentLoaded", () => {
  const seriesId = document.body.dataset.seriesId;
  const series = window.seriesData[seriesId];

  if (!series) return;

  // Top section (poster, title, first episode play button)
  const top = document.getElementById("series-top");
  top.innerHTML = `
    <div class="container">
      <div class="movie-poster">
        <img src="${series.episodes[0].thumbnail}" alt="${series.title}">
        <div class="movie-buttons">
          <a href="../Player.html?ep=${series.episodes[0].epId}" class="play">Play</a>
        </div>
      </div>

      <h1 class="movie-title">${series.title}</h1>
      <div class="movie-description">${series.description}</div>
    </div>
  `;

  // Episodes list
  const episodesSection = document.getElementById("episodes-section");
  const headerDiv = document.createElement("div");
  headerDiv.className = "episodes-header";
  headerDiv.innerHTML = `<h2>Episodes</h2>`;
  episodesSection.appendChild(headerDiv);

  series.episodes.forEach(ep => {
    const epDiv = document.createElement("div");
    epDiv.className = "episode";
    epDiv.innerHTML = `
      <a href="../Player.html?ep=${ep.epId}">
        <div class="image-container">
          <img src="${ep.thumbnail}" alt="${ep.title}" onerror="this.style.display='none'; this.parentElement.style.backgroundColor='#4F4F4F';">
          <div class="play-button">&#9656;</div>
        </div>
      </a>
      <div class="episode-info">
        <p class="episode-title">${ep.title}</p>
        <p class="episode-description">${ep.description || ''}</p>
      </div>
    `;
    episodesSection.appendChild(epDiv);
  });
});