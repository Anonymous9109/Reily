// ==========================================================================
// 1. DYNAMIC SCRIPT LOADING & DATA ARCHITECTURE
// ==========================================================================

function loadSearchScript() {
  return new Promise((resolve) => {
    if (typeof window.movies !== "undefined" || typeof movies !== "undefined") {
      resolve();
      return;
    }
    
    const script = document.createElement("script");
    script.src = "/JS/search.js"; // Absolute root path to search script
    script.onload = () => resolve();
    script.onerror = () => {
      console.error("Failed to load search.js");
      resolve(); 
    };
    document.head.appendChild(script);
  });
}

async function initializePage() {
  await loadSearchScript();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");

  const sourceMovies = typeof window.movies !== "undefined" ? window.movies : (typeof movies !== "undefined" ? movies : null);
  window.movies = {};

  // Find the exact movie record in search.js matching our URL ID
  if (sourceMovies && Array.isArray(sourceMovies) && id) {
    const matchedMovie = sourceMovies.find(m => {
      if (!m.link) return false;
      const urlPart = m.link.includes('?') ? m.link.split('?')[1] : m.link;
      const movieUrlParams = new URLSearchParams(urlPart);
      const movieId = movieUrlParams.get('movie') || movieUrlParams.get('series');
      
      return movieId && movieId.toLowerCase() === id.toLowerCase();
    });
    
    if (matchedMovie) {
      window.movies[id] = matchedMovie;
    }
  } else if (sourceMovies && typeof sourceMovies === "object") {
    window.movies = sourceMovies;
  }

  const movie = window.movies[id];

  if (!movie) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Movie not found</div>";
    return;
  }

  document.getElementById("title").textContent = movie.title;
  
  const descEl = document.getElementById("desc");
  if (descEl) {
    descEl.textContent = movie.desc || "";
  }

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

  checkContinueWatchingStatus();
}

// Run the application initialization sequence
initializePage();

// ==========================================================================
// 2. BACKGROUND FALLBACK (DYNAMIC EXTENSION extraction VIA MATCHED ID)
// ==========================================================================

function applyFallbackBackground() {
  const video = document.getElementById("bgVideo");
  if (video) {
    video.style.display = "none";
  }

  const bgContainer = document.body;
  const id = new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series");
  const movie = window.movies ? window.movies[id] : null;

  // If the ID successfully paired with a record inside search.js, extract the exact file string
  if (movie && movie.image) {
    // Splits "images/ThePursuitofHappyness.webp" and isolated "ThePursuitofHappyness.webp"
    const filename = movie.image.split('/').pop(); 
    
    // Stitch it into your standard root images directory absolute path
    const derivedImagePath = `/images/${filename}`;
    console.log(`Successfully mapped ID "${id}" to absolute filename:`, derivedImagePath);
    
    bgContainer.style.backgroundImage = `url('${derivedImagePath}')`;
    bgContainer.style.backgroundSize = "cover";
    bgContainer.style.backgroundPosition = "center";
    bgContainer.style.backgroundRepeat = "no-repeat";
    bgContainer.style.backgroundAttachment = "fixed";
  } else {
    console.warn(`Could not extract a valid search.js database image filename for ID: "${id}".`);
    bgContainer.style.backgroundColor = "#000000";
    bgContainer.style.backgroundImage = "none";
  }
}

// ==========================================================================
// 3. FIRESTORE INTEGRATION & USER PROGRESS
// ==========================================================================

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

function play() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");
  const movie = window.movies[id];
  if (movie && id) {
    window.location.href = `videoplayer?ep=${movie.play || ''}&movie=${id}`;
  }
}

function goBack() {
  window.history.back();
}

// ==========================================================================
// 5. GLOBAL STYLE DECORATORS (UI/UX)
// ==========================================================================

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

