document.addEventListener("DOMContentLoaded", () => {
  const movieId = document.body.dataset.movieId;
  const data = moviesData[movieId];

  if (!data) return;

  const container = document.getElementById("movie-container");

  container.innerHTML = `
    <div class="header">
      <div class="movie-poster" id="video-container">
        <video id="video" autoplay loop crossorigin="anonymous">
          <source src="${data.video}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <div class="custom-controls" id="custom-controls">
          <button id="play-pause">
            <svg id="play-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M5 3L19 12L5 21V3Z" />
            </svg>
            <svg id="pause-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M6 19H10V5H6V19ZM14 5V19H18V5Z" />
            </svg>
          </button>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar" id="progress-bar"></div>
      </div>
    </div>

    <div class="container">
      <h1 class="movie-title">${data.title}</h1>
      <div class="movie-info">
        <span>${data.year}</span>
        <span>${data.rating}</span>
        <span>${data.season}</span>
      </div>
      <div class="movie-buttons">
        <a href="${data.episodesPage}" class="play">Play</a>
      </div>
      <div class="movie-description">${data.description}</div>
      <div class="movie-credits">
        <span><strong>Starring:</strong> ${data.starring}</span>
        <span><strong>Director:</strong> ${data.director}</span>
      </div>
    </div>
  `;

  setupPlayerControls();
});

// 🔹 Simple video play/pause system
function setupPlayerControls() {
  const video = document.getElementById("video");
  const playPauseBtn = document.getElementById("play-pause");
  const playIcon = document.getElementById("play-icon");
  const pauseIcon = document.getElementById("pause-icon");

  playIcon.style.display = "none";

  playPauseBtn.addEventListener("click", () => {
    if (video.paused) {
      video.play();
      playIcon.style.display = "none";
      pauseIcon.style.display = "block";
    } else {
      video.pause();
      playIcon.style.display = "block";
      pauseIcon.style.display = "none";
    }
  });

  // progress bar
  const progress = document.getElementById("progress-bar");
  video.addEventListener("timeupdate", () => {
    const percent = (video.currentTime / video.duration) * 100;
    progress.style.width = `${percent}%`;
  });
}