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

  // Pre-locate structural poster layout images from search array
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

  // Safely prepare layout containers for landscape layout requirements
  setupLandscapeDOMArchitecture(imagePath);

  // Populate UI
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
      applyFallbackBackground(id);
    }, true);
  } else {
    applyFallbackBackground(id);
  }

  checkContinueWatchingStatus();
}

/**
 * Builds non-intrusive container wrappers needed for the landscape layout modifications
 */
function setupLandscapeDOMArchitecture(imagePath) {
  let mainWrapper = document.getElementById("movieContentWrapper");
  let posterContainer = document.getElementById("moviePosterContainer");
  let posterImg = document.getElementById("moviePosterImg");
  let ambientBg = document.getElementById("ambientBg");

  // Create an ambient blur backdrop background element
  if (!ambientBg) {
    ambientBg = document.createElement("div");
    ambientBg.id = "ambientBg";
    document.body.insertBefore(ambientBg, document.body.firstChild);
  }
  if (imagePath) {
    ambientBg.style.backgroundImage = `url('${imagePath}')`;
  }

  // Group text elements into a clean grid tracking network for landscape requirements
  if (!mainWrapper) {
    mainWrapper = document.createElement("div");
    mainWrapper.id = "movieContentWrapper";
    
    posterContainer = document.createElement("div");
    posterContainer.id = "moviePosterContainer";
    
    posterImg = document.createElement("img");
    posterImg.id = "moviePosterImg";
    
    posterContainer.appendChild(posterImg);
    mainWrapper.appendChild(posterContainer);
    
    // Select your loose document items and append them to the responsive wrapper pipeline
    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("desc");
    const playBtn = document.querySelector(".play-btn");
    
    if (titleEl) mainWrapper.appendChild(titleEl); 
    if (descEl) mainWrapper.appendChild(descEl);   
    if (playBtn) mainWrapper.appendChild(playBtn); 
    
    // INJECTION FIX: Insert at the absolute top of the body to block ghost HTML elements from creating top whitespace
    document.body.insertBefore(mainWrapper, document.body.firstChild);
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

function applyFallbackBackground(id) {
  const video = document.getElementById("bgVideo");
  if (video) {
    video.style.display = "none";
  }

  const bgContainer = document.body;
  const targetId = id || new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series");

  // Find the item in your search array matching this exact ID string from the URL
  const matchedSearchItem = window.searchArray ? window.searchArray.find(m => {
    if (!m.link) return false;
    const urlPart = m.link.includes('?') ? m.link.split('?')[1] : m.link;
    const movieUrlParams = new URLSearchParams(urlPart);
    const movieId = movieUrlParams.get('movie') || movieUrlParams.get('series');
    return movieId && movieId.toLowerCase() === targetId.toLowerCase();
  }) : null;

  if (matchedSearchItem && matchedSearchItem.image) {
    // Isolates the clean filename safely regardless of extension
    const filename = matchedSearchItem.image.split('/').pop();
    const absoluteImagePath = `/images/${filename}`;
    
    console.log(`Setting background image from ID link match:`, absoluteImagePath);
    
    bgContainer.style.backgroundImage = `url('${absoluteImagePath}')`;
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
    background: "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0) 100%)",
    pointerEvents: "none", // Allows clicks to pass through completely
    zIndex: "1" // Places it over backgrounds, but behind UI typography elements
  });
  
  document.body.appendChild(overlay);

  // 2. Clear mobile tap delays, outline styling, and stack text layers explicitly
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      -webkit-tap-highlight-color: transparent !important;
      -webkit-touch-callout: none !important;
      box-sizing: border-box;
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
    
    /* Forces elements out of the stacking index loop to sit cleanly over the fade overlay */
    #title, #desc, .play-btn, .back-btn, .text-container-wrapper, .info-container {
      position: relative;
      z-index: 2;
    }

    /* ==========================================
     * LANDSCAPE ORIENTATION DESIGN MODIFICATIONS
     * ========================================== */
    @media (orientation: landscape) {
      body {
        display: block !important;
        overflow-y: auto !important; /* Enables smooth document scrolling */
        min-height: 10vh;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* Disables potential leftover structural container blocks from pushing down layout flow */
      .text-container-wrapper, .info-container {
        display: none !important;
      }

      /* Ambient Blurred Canvas Element Styling */
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
        filter: blur(65px) brightness(0.35) saturate(1.4);
        transform: scale(1.2); 
        z-index: 0;
        pointer-events: none;
      }

      /* Grid structure setup to coordinate elements */
      #movieContentWrapper {
        display: grid;
        grid-template-columns: 240px 1fr; /* Left: Poster width constraint, Right: Flexible space */
        gap: 24px;
        width: 800px;
        max-width: 75vw;
        margin: 0px 0 80px 60px !important; /* Zeroed out top margin completely */
        padding-top: 10px !important;       /* Clean minimal padding spacing right from screen edge boundary */
        position: relative;
        z-index: 3;
      }

      /* 1. Image element rendered styled as a vertical Movie Poster */
      #moviePosterContainer {
        grid-column: 1;
        grid-row: 1;
        display: block !important;
        width: 100%;
        aspect-ratio: 2 / 3; /* Standard professional movie poster aspect dimensional scale */
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      }

      #moviePosterImg {
        display: block !important;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* 2. Title cleanly positioned onto the Right Side of the Movie Poster Box */
      #title {
        grid-column: 2;
        grid-row: 1;
        align-self: center; /* Vertically centers the title inline with the poster's height */
        color: #ffffff;
        font-size: 2.8rem;
        font-weight: 800;
        margin: 0 !important;
        padding: 0 !important;
        background: none !important;
        text-shadow: 0 2px 12px rgba(0, 0, 0, 0.7);
        position: relative;
        z-index: 4;
      }

      /* 3. Description positioned underneath the top item structure rows */
      #desc {
        grid-column: 1 / span 2;
        grid-row: 2;
        margin: 10px 0 0 0 !important;
        color: rgba(255, 255, 255, 0.85);
        font-size: 1.05rem;
        line-height: 1.6;
        position: relative;
        z-index: 4;
      }

      /* 4. Action Play Controller Box positions underneath the description track layout */
      .play-btn {
        grid-column: 1 / span 2;
        grid-row: 3;
        align-self: flex-start !important;
        justify-self: start !important;
        position: relative;
        z-index: 4;
      }
      
      .back-btn {
        position: fixed;
        top: 40px;
        right: 40px;
        z-index: 5;
      }
    }

    /* ==========================================
     * PORTRAIT ORIENTATION STABILIZER (CENTERED IN THE MIDDLE)
     * ========================================== */
    @media (orientation: portrait) {
      /* Targets the text wrapper container and centers it directly in the dead center of the screen */
      #movieContentWrapper {
        display: flex !important;
        flex-direction: column !important;
        justify-content: center !important;
        align-items: center !important;
        text-align: center !important;
        position: absolute !important;
        top: 70% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 100% !important;
        max-width: 88vw !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 3 !important;
      }

      #moviePosterContainer, 
      #moviePosterImg, 
      #ambientBg {
        display: none !important; /* Disables landscape dynamic nodes to retain layout rules */
      }

      /* Enforces complete horizontal copy text alignment */
      #title, #desc {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
        width: 100%;
      }

      #title {
        margin: 0 0 16px 0 !important;
      }

      #desc {
        margin: 0 0 24px 0 !important;
      }

      .play-btn {
        margin: 0 auto !important;
        display: inline-flex !important;
        justify-content: center !important;
        align-items: center !important;
      }
      
      /* Note: .back-btn is left completely untouched here, keeping its native template placement intact */
    }
  `;
  document.head.appendChild(style);
})();


