import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.x.x/firebase-auth.js"; // Adjust version/path if needed

const auth = getAuth();

// 1. Check if user is logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, safe to show content and load movie data
    document.body.style.display = "block"; 
    initializeMoviePage();
  } else {
    // User is not signed in, redirect to index
    window.location.href = "index.html"; // Adjust if your file is named differently (e.g., "/")
  }
});

// 2. Put your original page logic inside a function
function initializeMoviePage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie");

  const movie = movies[id];

  if (!movie) {
    document.body.innerHTML = "Movie not found";
    return; // Stop execution if no movie exists
  }

  document.getElementById("title").textContent = movie.title;
  document.getElementById("desc").textContent = movie.desc;

  const video = document.getElementById("bgVideo");
  video.innerHTML = `<source src="${movie.video}" type="video/mp4">`;
}

// 3. Keep your navigation functions global so HTML buttons can click them
function play() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie");
  const movie = movies[id];
  if (movie) {
    window.location.href = `videoplayer?ep=${movie.play}`;
  }
}

function goBack() {
  window.history.back();
}

// Your style block remains untouched
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
