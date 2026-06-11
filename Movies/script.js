import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-auth.js"; // Match your actual Firebase version

const auth = getAuth();

// 1. Listen for the Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, reveal the page and load the movie data
    document.body.style.display = "block";
    initializeMoviePage();
  } else {
    // User is not signed in, boot them out
    window.location.href = "index.html";
  }
});

function initializeMoviePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie");

  // Check if 'movies' is accessible globally. If it's loaded in another file, window.movies finds it.
  const movieData = window.movies ? window.movies[id] : (typeof movies !== 'undefined' ? movies[id] : null);

  if (!movieData) {
    document.body.innerHTML = "Movie not found";
    return;
  }

  document.getElementById("title").textContent = movieData.title;
  document.getElementById("desc").textContent = movieData.desc;

  const video = document.getElementById("bgVideo");
  video.innerHTML = `<source src="${movieData.video}" type="video/mp4">`;
}

// 2. EXPLICITLY make your button functions global so HTML onclick attributes work
window.play = function() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie");
  const movieData = window.movies ? window.movies[id] : (typeof movies !== 'undefined' ? movies[id] : null);
  
  if (movieData) {
    window.location.href = `videoplayer?ep=${movieData.play}`;
  }
};

window.goBack = function() {
  window.history.back();
};

// CSS Injection remains untouched
(function () {
  const style = document.createElement('style');
  style.innerHTML = `
    * { -webkit-tap-highlight-color: transparent !important; -webkit-touch-callout: none !important; }
    button, a { outline: none !important; border: none; }
    button:focus, button:focus-visible, a:focus, a:focus-visible { outline: none !important; }
    button:active, a:active { background-color: transparent !important; }
  `;
  document.head.appendChild(style);
})();
