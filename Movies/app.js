const API = "Movies/movies.json";

// get id from URL
function getId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// homepage
async function loadMovies() {
  const res = await fetch(API);
  const movies = await res.json();

  const container = document.getElementById("movie");
  if (!container) return;

  movies.forEach(movie => {
    const div = document.createElement("div");
    div.className = "movie";

    div.innerHTML = `
      <img src="${movie.image}">
      <h3>${movie.title}</h3>
    `;

    // 🔥 CLICK EVENT
    div.onclick = () => {
      window.location.href = `index.html?id=${movie.id}`;
    };

    container.appendChild(div);
  });
}

// movie page
async function loadMovie() {
  const id = getId();
  if (!id) return;

  const res = await fetch(API);
  const movies = await res.json();

  const movie = movies.find(m => m.id == id);
  const container = document.getElementById("movie");
  if (!container) return;

  container.innerHTML = `
    <h1>${movie.title}</h1>
    <img src="${movie.image}" width="300">
    <p>${movie.description}</p>
    <p><b>${movie.genre}</b></p>

    <video controls width="600">
      <source src="${movie.video}" type="video/mp4">
    </video>
  `;
}
(function () {
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      -webkit-tap-highlight-color: transparent !important;
      -webkit-touch-callout: none !important;
    }

    button, a {
      outline: none !important;
      border: none;
    }

    button:focus,
    button:focus-visible,
    a:focus,
    a:focus-visible {
      outline: none !important;
    }

    button:active,
    a:active {
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
})();

// Run your function after page loads
window.addEventListener("load", initWatched);





























// run both
loadMovies();
loadMovie();