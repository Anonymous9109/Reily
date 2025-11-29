document.addEventListener("DOMContentLoaded", () => {
  const episodeList = document.getElementById("episode-list");
  const seriesId = document.body.dataset.seriesId;

  const allSeries = {
    "itadaki-seieki": [
      { title: "Episode 1", thumbnail: "/images/itadaki-ep1.jpg", link: "/Player.html?ep=itadaki-ep1" },
      { title: "Episode 2", thumbnail: "/images/itadaki-ep2.png", link: "/Player.html?ep=itadaki-ep2" }
    ],

    "otome-hime": [
      { title: "Episode 1", thumbnail: "/images/OtomeHime.jpg", link: "/Player.html?ep=otome-hime-ep1" }
    ],

    "kakushi-dere": [
      { title: "Episode 1", thumbnail: "/images/kakushi-dere-ep1.jpg", link: "/Player.html?ep=kakushi-dere-ep1" },
      { title: "Episode 2", thumbnail: "/images/kakushi-dere-ep2.jpg", link: "/Player.html?ep=kakushi-dere-ep2" }
    ],

    "Koi-Maguwai": [
      { title: "Episode 1", thumbnail: "/images/KoiMaguwai-ep1.jpg", link: "/Player.html?ep=KoiMaguwai-ep1" }
    ],

    "Mou-Hasamazu-Ni-Wa-Irarenai": [
      { title: "Episode 1", thumbnail: "/images/Mou-Hasamazu-Ni-Wa-Irarenai-ep1.jpg", link: "/Player.html?ep=Mou-Hasamazu-Ni-Wa-Irarenai-ep1" }
    ],

    "Shoujo-tachinoSadism": [
      { title: "Episode 1", thumbnail: "/images/shoujo-tachi-no-sadism-the-animation-ep1.jpg", link: "/Player.html?ep=Shoujo-tachinoSadism-ep1" },
      { title: "Episode 2", thumbnail: "/images/shoujo-tachi-no-sadism-the-animation-ep2.jpg", link: "/Player.html?ep=Shoujo-tachinoSadism-ep2" }
    ]
  };

  const episodes = allSeries[seriesId] || [];

  const playSVG = `
    <svg class="play-button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="48" height="48">
      <circle cx="32" cy="32" r="32" fill="rgba(0,0,0,0.5)"/>
      <polygon points="26,20 26,44 46,32" fill="#fff"/>
    </svg>
  `;

  episodes.forEach(ep => {
    const epDiv = document.createElement("div");
    epDiv.className = "episode-item";

    const container = document.createElement("div");
    container.className = "episode-thumb-container";

    if (ep.thumbnail && ep.thumbnail.trim() !== "") {
      const img = document.createElement("img");
      img.src = ep.thumbnail;
      img.alt = ep.title;
      img.onerror = () => {
        img.style.display = "none";
        container.classList.add("episode-placeholder");
      };
      container.appendChild(img);
    } else {
      container.classList.add("episode-placeholder");
    }

    container.insertAdjacentHTML("beforeend", playSVG);

    const titleDiv = document.createElement("div");
    titleDiv.className = "episode-title";
    titleDiv.textContent = ep.title;

    epDiv.appendChild(container);
    epDiv.appendChild(titleDiv);

    epDiv.addEventListener("click", () => {
      if (ep.link && ep.link !== "#") window.location.href = ep.link;
    });

    episodeList.appendChild(epDiv);
  });
});