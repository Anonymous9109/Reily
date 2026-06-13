// --- ADDED: Dynamic connection to search.js ---
function loadSearchScript() {
  return new Promise((resolve) => {
    // If movies is already loaded, skip
    if (typeof movies !== "undefined") {
      resolve();
      return;
    }
    // Create a script tag pointing to your search file
    const script = document.createElement("script");
    script.src = "../JS/search.js"; // Adjust the path ('../' or '/') depending on your subfolder depth
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("Failed to load search.js");
      resolve(); // Resolve anyway so the code doesn't crash, it will just drop to black background
    };
    document.head.appendChild(script);
  });
}

// Wrap your main initialization code in an async block to wait for search.js to load
async function initializePage() {
  await loadSearchScript();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");

  // We expose the global movies reference so player.js can pull dynamic titles
  window.movies = typeof movies !== "undefined" ? movies : {};

  // Fallback Logic to populate window.movies[id] from search.js array if it's missing
  if (!window.movies[id] && typeof movies !== "undefined" && Array.isArray(movies) && id) {
    const matchedMovie = movies.find(m => {
      const movieUrlParams = new URLSearchParams(m.link.split('?')[1]);
      const movieId = movieUrlParams.get('movie') || movieUrlParams.get('series');
      return movieId && movieId.toLowerCase() === id.toLowerCase();
    });
    if (matchedMovie) {
      window.movies[id] = matchedMovie;
    }
  }

  const movie = window.movies[id];

  if (!movie) {
    document.body.innerHTML = "Movie not found";
  } else {
    document.getElementById("title").textContent = movie.title;
    document.getElementById("desc").textContent = movie.desc || "";

    const video = document.getElementById("bgVideo");
    
    if (movie.video && video) {
      video.innerHTML = `<source src="${movie.video}" type="video/mp4">`;
      video.load();

      video.addEventListener('error', function() {
        applyFallbackBackground();
      }, true);
    } else {
      applyFallbackBackground();
    }

    // Check for saved progress in Firestore to modify the Play Button
    checkContinueWatchingStatus();
  }
}

// Run the initialization
initializePage();

// --- Rest of your script functions remain unchanged ---
function applyFallbackBackground() {
  const video = document.getElementById("bgVideo");
  if (video) {
    video.style.display = "none";
  }

  const bgContainer = document.body;
  const id = new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series");
  const movie = window.movies[id];

  if (movie && movie.image) {
    bgContainer.style.backgroundImage = `url('${movie.image}')`;
    bgContainer.style.backgroundSize = "cover";
    bgContainer.style.backgroundPosition = "center";
    bgContainer.style.backgroundRepeat = "no-repeat";
  } else {
    bgContainer.style.backgroundColor = "#000000";
    bgContainer.style.backgroundImage = "none";
  }
}

async function checkContinueWatchingStatus() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");
  try {
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");

    const auth = getAuth();
    const db = getFirestore();

    auth.onAuthStateChanged(async (user) => {
      if (user && user.email && id) {
        const docRef = doc(db, "watchHistory", user.email, "movies", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const currentTime = data.currentTime || 0;
          const duration = data.duration || 0;

          if (currentTime > 5 && currentTime < (duration - 15)) {
            const timeLeftSeconds = duration - currentTime;
            const timeLeftMinutes = Math.ceil(timeLeftSeconds / 60);

            const playBtn = document.querySelector(".play-btn");
            if (playBtn) {
              playBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
                Continue • ${timeLeftMinutes}m left
              `;
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Error reading continue watching status:", error);
  }
}

function play() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");
  const movie = window.movies[id];
  if (movie && id) {
    window.location.href = `videoplayer?ep=${movie.play}&movie=${id}`;
  }
}

function goBack() {
  window.history.back();
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
    button:focus, button:focus-visible, a:focus, a:focus-visible {
      outline: none !important;
    }
    button:active, a:active {
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
})();
