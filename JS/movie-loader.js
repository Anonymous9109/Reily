// Get movie from URL
const param = window.location.search.replace("?=", "").toLowerCase();
const movieId = param.replace(/\s+/g, "_");

const movie = movies[movieId];

if (!movie) {
  document.body.innerHTML = "<h1 style='text-align:center'>Movie not found</h1>";
  throw new Error("Movie not found");
}

// Page title
document.title = movie.title;

// Video source (dynamic)
const video = document.getElementById("video");
const source = document.getElementById("video-source");
source.src = movie.preview;
video.load();

// Text content
document.getElementById("movie-title").textContent = movie.title;

document.getElementById("movie-info").innerHTML = `
  <span>${movie.year}</span>
  <span>${movie.age}</span>
  <span>${movie.duration}</span>
`;

document.getElementById("movie-description").textContent = movie.description;

document.getElementById("movie-credits").innerHTML = `
  <span><strong>Starring:</strong> ${movie.credits.starring}</span>
  <span><strong>Director:</strong> ${movie.credits.director}</span>
`;

document.getElementById("play-link").href =
  `videoplayer.html?ep=${movie.playId}`;