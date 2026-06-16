// ==========================================================================
// 1. DYNAMIC SCRIPT LOADING & DATA ARCHITECTURE
// ==========================================================================

/**
 * Dynamically injects search.js if the 'movies' data isn't already available.
 */
function loadSearchScript() {
  return new Promise((resolve) => {
    // If window.movies or a local global 'movies' array is already here, skip loading
    if (typeof window.movies !== "undefined" || typeof movies !== "undefined") {
      resolve();
      return;
    }
    
    const script = document.createElement("script");
    script.src = "../JS/search.js"; // Adjust path dynamically if needed ('../' or '/')
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("Failed to load search.js");
      resolve(); // Resolve anyway so initialization doesn't permanently freeze
    };
    document.head.appendChild(script);
  });
}

/**
 * Main Orchestrator: Runs on page load to configure data structures,
 * set up media elements, and trigger database hooks.
 */
async function initializePage() {
  await loadSearchScript();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");

  // Capture the raw object/array exported from search.js safely
  const sourceMovies = typeof window.movies !== "undefined" ? window.movies : (typeof movies !== "undefined" ? movies : null);

  // Re-initialize window.movies as a dictionary mapping for explicit id lookups
  window.movies = {};

  // If search.js provides an array structure, filter and parse out the matched ID element
  if (sourceMovies && Array.isArray(sourceMovies) && id) {
    const matchedMovie = sourceMovies.find(m => {
      if (!m.link) return false;
      const movieUrlParams = new URLSearchParams(m.link.split('?')[1]);
      const movieId = movieUrlParams.get('movie') || movieUrlParams.get('series');
      return movieId && movieId.toLowerCase() === id.toLowerCase();
    });
    
    if (matchedMovie) {
      window.movies[id] = matchedMovie;
    }
  } else if (sourceMovies && typeof sourceMovies === "object") {
    // If it was already formatted as a key-value dictionary, preserve it directly
    window.movies = sourceMovies;
  }

  const movie = window.movies[id];

  if (!movie) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Movie not found</div>";
    return;
  }

  // Populate UI basic metadata strings
  document.getElementById("title").textContent = movie.title;
  document.getElementById("desc").textContent = movie.desc || "";

  const video = document.getElementById("bgVideo");
  
  if (movie.video && video) {
    video.innerHTML = `<source src="${movie.video}" type="video/mp4">`;
    video.load();

    // Fall back to image background if video stream faults mid-transfer or fails to parse
    video.addEventListener('error', function() {
      applyFallbackBackground();
    }, true);
  } else {
    applyFallbackBackground();
  }

  // Query Firestore to evaluate continue watching status adjustments
  checkContinueWatchingStatus();
}

// ==========================================================================
// 2. BACKGROUND FALLBACK & MEDIA RENDERERS
// ==========================================================================

/**
 * Hides video player interface and sets up the static CSS background cover image.
 */
function applyFallbackBackground() {
  const video = document.getElementById("bgVideo");
  if (video) {
    video.style.display = "none";
  }

  const bgContainer = document.body;
  const id = new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series");
  const movie = window.movies ? window.movies[id] : null;

  if (movie && movie.image) {
    console.log("Applying background image asset path:", movie.image);
    bgContainer.style.backgroundImage = `url('${movie.image}')`;
    bgContainer.style.backgroundSize = "cover";
    bgContainer.style.backgroundPosition = "center";
    bgContainer.style.backgroundRepeat = "no-repeat";
  } else {
    console.warn("No fallback image property found for ID:", id, "- Defaulting to black canvas.");
    bgContainer.style.backgroundColor = "#000000";
    bgContainer.style.backgroundImage = "none";
  }
}

// ==========================================================================
// 3. FIRESTORE INTEGRATION & USER PROGRESS
// ==========================================================================

/**
 * Asynchronously imports Firebase modules and checks user progress history records.
 */
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

          // Alter button UI text if user is active past intro and has more than 15s remaining
          if (currentTime > 5 && currentTime < (duration - 15)) {
            const timeLeftSeconds = duration - currentTime;
            const timeLeftMinutes = Math.ceil(timeLeftSeconds / 60);

            const playBtn = document.querySelector(".play-btn");
            if (playBtn) {
              playBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-right: 5px;">
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

// ==========================================================================
// 4. USER INTERACTIVE NAVIGATION CONTROLS
// ==========================================================================

/**
 * Triggers video player redirection route passing specific episode target parameters.
 */
function play() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");
  const movie = window.movies[id];
  if (movie && id) {
    window.location.href = `videoplayer?ep=${movie.play}&movie=${id}`;
  }
}

/**
 * Simple window history wrapper to handle navigating backwards.
 */
function goBack() {
  window.history.back();
}

// ==========================================================================
// 5. GLOBAL STYLE DECORATORS (UI/UX)
// ==========================================================================

/**
 * Immediately-Invoked Function Expression to clear mobile tap delays and focus styles
 */
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

// Execute initial execution pipeline
initializePage();
