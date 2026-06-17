// ==========================================================================
// 1. DYNAMIC DATA ARCHITECTURE & DEPENDENCY LOADING (SANDBOXED)
// ==========================================================================

/**
 * Loads text files instead of script tags to bypass global variable conflicts.
 */
async function loadDataFiles() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");

  if (!id) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>No video ID provided.</div>";
    return;
  }

  try {
    // 1. Fetch and parse search.js safely
    const searchResponse = await fetch("/JS/search.js");
    const searchText = await searchResponse.text();
    // Convert the 'const movies =' declaration to a safe localized object evaluation
    const cleanSearchText = searchText.replace(/const\s+movies\s*=/, "return ");
    const parseSearch = new Function(cleanSearchText);
    window.searchArray = parseSearch();

    // 2. Fetch and parse movies.js safely
    const moviesResponse = await fetch("/Movies/movies.js");
    const moviesText = await moviesResponse.text();
    // Convert the 'const movies =' declaration to a safe localized object evaluation
    const cleanMoviesText = moviesText.replace(/const\s+movies\s*=/, "return ");
    const parseMovies = new Function(cleanMoviesText);
    window.movieDetailsDict = parseMovies();

    // 3. Kickoff layout initialization
    renderPage(id);

  } catch (error) {
    console.error("Critical error while reading data engines safely:", error);
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Failed to load background systems.</div>";
  }
}

/**
 * Handles building the UI and background assets now that data maps are secure.
 */
function renderPage(id) {
  // Case-insensitive lookup protects against "SAW" vs "saw" mismatching
  const exactKey = Object.keys(window.movieDetailsDict).find(key => key.toLowerCase() === id.toLowerCase());
  const movieData = exactKey ? window.movieDetailsDict[exactKey] : null;

  if (!movieData) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Movie data not found.</div>";
    return;
  }

  // Bind to global window scope so play() and fallback handlers can access it cleanly
  window.currentMovie = movieData;

  // Locate image asset string path early to use across layout engines
  const targetId = id || new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series");
  const matchedSearchItem = window.searchArray ? window.searchArray.find(m => {
    if (!m.link) return false;
    const urlPart = m.link.includes('?') ? m.link.split('?')[1] : m.link;
    const movieUrlParams = new URLSearchParams(urlPart);
    const movieId = movieUrlParams.get('movie') || movieUrlParams.get('series');
    return movieId && movieId.toLowerCase() === targetId.toLowerCase();
  }) : null;

  let imagePath = "";
  if (matchedSearchItem && matchedSearchItem.image) {
    const filename = matchedSearchItem.image.split('/').pop();
    imagePath = `/images/${filename}`;
  }

  // Build out dynamic orientation DOM nodes structural wrappers safely
  setupLandscapeDOMArchitecture(imagePath);

  // Populate UI Typography
  document.getElementById("title").textContent = movieData.title;
  
  const descEl = document.getElementById("desc");
  if (descEl) {
    descEl.textContent = movieData.desc || "";
  }

  // Handle Video / Background Stream initialization
  const video = document.getElementById("bgVideo");
  
  if (movieData.video && video) {
    video.innerHTML = `<source src="${movieData.video}" type="video/mp4">`;
    video.load();

    video.addEventListener('error', function() {
      applyFallbackBackground(imagePath, targetId);
    }, true);
  } else {
    applyFallbackBackground(imagePath, targetId);
  }

  checkContinueWatchingStatus();
}

/**
 * Programmatically structures elements into a component pipeline matching design constraints
 */
function setupLandscapeDOMArchitecture(imagePath) {
  let mainWrapper = document.getElementById("movieContentWrapper");
  let posterContainer = document.getElementById("moviePosterContainer");
  let posterImg = document.getElementById("moviePosterImg");
  let ambientBg = document.getElementById("ambientBg");

  // 1. Create Ambient Backdrop Engine Layer
  if (!ambientBg) {
    ambientBg = document.createElement("div");
    ambientBg.id = "ambientBg";
    document.body.insertBefore(ambientBg, document.body.firstChild);
  }
  if (imagePath) {
    ambientBg.style.backgroundImage = `url('${imagePath}')`;
  }

  // 2. Assemble Dynamic Flex Layout Columns
  if (!mainWrapper) {
    mainWrapper = document.createElement("div");
    mainWrapper.id = "movieContentWrapper";
    
    posterContainer = document.createElement("div");
    posterContainer.id = "moviePosterContainer";
    
    posterImg = document.createElement("img");
    posterImg.id = "moviePosterImg";
    
    posterContainer.appendChild(posterImg);
    mainWrapper.appendChild(posterContainer);
    
    // Select and safely migrate loose standalone template components into layout flow hierarchy
    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("desc");
    const playBtn = document.querySelector(".play-btn");
    
    if (titleEl) posterContainer.appendChild(titleEl); // Title in front of image
    if (descEl) mainWrapper.appendChild(descEl);       // Description under image
    if (playBtn) mainWrapper.appendChild(playBtn);     // Button under description
    
    document.body.appendChild(mainWrapper);
  }

  if (imagePath && posterImg) {
    posterImg.src = imagePath;
  }
}

// Kickoff the sandboxed loading process immediately
loadDataFiles();

// ==========================================================================
// 2. BACKGROUND FALLBACK (DYNAMIC EXTENSION EXTRACTION VIA MATCHED ID)
// ==========================================================================

function applyFallbackBackground(imagePath, targetId) {
  const video = document.getElementById("bgVideo");
  if (video) {
    video.style.display = "none";
  }

  const bgContainer = document.body;

  if (imagePath) {
    console.log(`Setting landscape dynamic ambient background asset matching:`, imagePath);
    // Keep baseline full page scaling alive for portrait safety fallbacks
    bgContainer.style.backgroundImage = `url('${imagePath}')`;
    bgContainer.style.backgroundSize = "cover";
    bgContainer.style.backgroundPosition = "center";
    bgContainer.style.backgroundRepeat = "no-repeat";
    bgContainer.style.backgroundAttachment = "fixed";
  } else {
    console.warn(`No attached image property found in search array for ID: "${targetId}". Using black background.`);
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
  const movie = window.currentMovie; 
  
  if (movie && id) {
    window.location.href = `videoplayer?ep=${movie.play || ''}&movie=${id}`;
  }
}

function goBack() {
  window.history.back();
}

// ==========================================================================
// 5. GLOBAL STYLE DECORATORS & FADING OVERLAYS (UI/UX)
// ==========================================================================

(function () {
  // 1. Create and inject the subtle fading background overlay
  const overlay = document.createElement('div');
  overlay.id = "bottomFadeOverlay";
  
  // Set up layout and the light linear-gradient
  Object.assign(overlay.style, {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "100%",
    height: "55vh", // Controls how high up the viewport the gradient climbs
    background: "linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0) 100%)",
    pointerEvents: "none", // Allows clicks to pass through completely
    zIndex: "2" // Places it over backgrounds, but behind UI typography elements
  });
  
  document.body.appendChild(overlay);

  // 2. Responsive UI Presentation Layer Styles Rules
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      -webkit-tap-highlight-color: transparent !important;
      -webkit-touch-callout: none !important;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background-color: #000;
      min-height: 100vh;
    }
    button, a {
      outline: none !important;
      border: none;
      cursor: pointer;
    }
    button:focus, button:focus-visible, a:focus, a:focus-visible {
      outline: none !important;
    }
    button:active, a:active {
      background-color: transparent !important;
    }
    #bgVideo {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      object-fit: cover;
      z-index: 1;
    }

    /* Ambient Canvas Engine Styling */
    #ambientBg {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      filter: blur(50px) brightness(0.45) saturate(1.4);
      transform: scale(1.15); /* Eliminates dynamic blur borders screen leak */
      z-index: 0;
      pointer-events: none;
    }

    /* Core Content Block Structure Base */
    #movieContentWrapper {
      position: relative;
      z-index: 3;
      display: flex;
      flex-direction: column;
    }

    /* ==========================================
     * LANDSCAPE ORIENTATION DESIGN IMPLEMENTATION
     * ========================================== */
    @media (orientation: landscape) {
      body {
        padding: 40px;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
      }

      #movieContentWrapper {
        position: fixed;
        top: 40px;
        left: 40px;
        width: 400px;
        max-width: 35vw;
        gap: 20px;
      }

      /* 1. Image Layer on Top Left */
      #moviePosterContainer {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 10;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.75);
      }

      #moviePosterImg {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* 2. Title Layered Safely In Front of Image */
      #title {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        margin: 0 !important;
        padding: 32px 20px 16px 20px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.4) 65%, transparent 100%);
        color: #ffffff;
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        text-shadow: 0 2px 8px rgba(0,0,0,0.4);
        z-index: 4;
      }

      /* 3. Description Rendered Directly Under Image Box */
      #desc {
        margin: 0;
        color: rgba(255, 255, 255, 0.85);
        font-size: 1.05rem;
        line-height: 1.6;
        max-height: 180px;
        overflow-y: auto;
        padding-right: 8px;
      }

      /* 4. Play Action Controller Box Under Description Layer */
      .play-btn {
        align-self: flex-start;
        margin-top: 4px;
      }
      
      .back-btn {
        position: fixed;
        top: 40px;
        right: 40px;
        z-index: 5;
      }
    }

    /* Elegant fallback structures layout for vertical devices */
    @media (orientation: portrait) {
      #moviePosterContainer {
        display: none; /* Degrades gracefully to background layout standard spacing */
      }
      #movieContentWrapper {
        margin-top: 55vh;
        gap: 16px;
      }
      #title {
        color: #fff;
        font-size: 2.2rem;
        font-weight: 800;
        margin: 0;
      }
      #desc {
        color: rgba(255, 255, 255, 0.7);
        font-size: 1rem;
        line-height: 1.5;
        margin: 0;
      }
    }
  `;
  document.head.appendChild(style);
})();
