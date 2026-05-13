document.addEventListener("DOMContentLoaded", () => {
  const section = document.getElementById("episodes-section");
  const seriesId = document.body.dataset.seriesId;
  const episodes = allSeries[seriesId] || [];

  section.innerHTML = `
    <h1>${seriesId.replace(/-/g, " ").toUpperCase()}</h1>
    <div class="episodes-grid">
      ${episodes.map(ep => `
        <a href="${ep.link}" class="episode-item">
          <img src="${ep.thumbnail}" alt="${ep.title}">
          <span>${ep.title}</span>
        </a>
      `).join("")}
    </div>
  `;
});