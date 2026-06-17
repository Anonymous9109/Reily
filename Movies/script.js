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

  // 2. Assemble Dynamic Layout Columns
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
    height: "55vh", 
    background: "linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.2) 60%, rgba(0, 0, 0, 0) 100%)",
    pointerEvents: "none", 
    zIndex: "2" 
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
      background-color: #000;
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
    #bgVideo {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      object-fit: cover;
      z-index: 1;
    }

    /* ==========================================
     * LANDSCAPE ORIENTATION DESIGN IMPLEMENTATION
     * ========================================== */
    @media (orientation: landscape) {
      body {
        overflow-y: auto !important; /* Forces normal document scrolling availability */
        min-height: 100vh;
      }

      /* Ambient Canvas Engine Styling */
      #ambientBg {
        display: block !important;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: blur(65px) brightness(0.4) saturate(1.4);
        transform: scale(1.2); /* Eliminates dynamic blur borders screen leak */
        z-index: 0;
        pointer-events: none;
      }

      /* Core Layout Wrapper positioned top-left but allows scrolling */
      #movieContentWrapper {
        display: flex;
        flex-direction: column;
        width: 320px; /* Structured fixed portrait-ratio content width column */
        max-width: 30vw;
        gap: 20px;
        margin: 40px 0 60px 40px; /* Left-anchored margin flow instead of hard position fixing */
        position: relative;
        z-index: 3;
      }

      /* 1. Image Layer on Top Left styled as a vertical Movie Poster */
      #moviePosterContainer {
        position: relative;
        width: 100%;
        aspect-ratio: 2 / 3; /* Exact true standard movie poster dimensions ratio */
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
      }

      #moviePosterImg {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      /* 2. Title Layered Safely In Front of Image Poster Box */
      #title {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        margin: 0 !important;
        padding: 48px 16px 16px 16px;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.5) 60%, transparent 100%);
        color: #ffffff;
        font-size: 1.8rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        z-index: 4;
      }

      /* 3. Description Rendered Directly Under Image Box */
      #desc {
        margin: 0;
        color: rgba(255, 255, 255, 0.85);
        font-size: 1rem;
        line-height: 1.5;
      }

      /* 4. Play Action Controller Box Under Description Layer */
      .play-btn {
        align-self: flex-start;
      }
      
      .back-btn {
        position: fixed;
        top: 40px;
        right: 40px;
        z-index: 5;
      }
    }

    /* ==========================================
     * PORTRAIT MODE STABILIZER (ZERO ALTERATIONS)
     * ========================================== */
    @media (orientation: portrait) {
      /* display: contents neutralizes layout changes so your original styles rule */
      #movieContentWrapper {
        display: contents !important;
      }
      #moviePosterContainer {
        display: contents !important;
      }
      #moviePosterImg {
        display: none !important; /* Hide image asset to keep portrait exactly matching original */
      }
      #ambientBg {
        display: none !important; /* Fall back safely to standard page background settings */
      }
      #title, #desc, .play-btn, .back-btn {
        position: relative;
        z-index: 2;
      }
    }
  `;
  document.head.appendChild(style);
})();
