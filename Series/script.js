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
    const cleanSearchText = searchText.replace(/const\s+movies\s*=/, "return ");
    const parseSearch = new Function(cleanSearchText);
    window.searchArray = parseSearch();

    // 2. Fetch and parse movies.js safely
    const moviesResponse = await fetch("/Movies/movies.js");
    const moviesText = await moviesResponse.text();
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
  const exactKey = Object.keys(window.movieDetailsDict).find(key => key.toLowerCase() === id.toLowerCase());
  const movieData = exactKey ? window.movieDetailsDict[exactKey] : null;

  if (!movieData) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Movie data not found.</div>";
    return;
  }

  window.currentMovie = movieData;

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

  setupLandscapeDOMArchitecture(imagePath);

  document.getElementById("title").textContent = movieData.title;
  
  const descEl = document.getElementById("desc");
  if (descEl) {
    descEl.textContent = movieData.desc || "";
  }

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

  checkContinueWatchingStatus(targetId);
}

/**
 * Builds non-intrusive container wrappers needed for the landscape layout modifications
 */
function setupLandscapeDOMArchitecture(imagePath) {
  let mainWrapper = document.getElementById("movieContentWrapper");
  let posterContainer = document.getElementById("moviePosterContainer");
  let posterImg = document.getElementById("moviePosterImg");
  let ambientBg = document.getElementById("ambientBg");

  if (!ambientBg) {
    ambientBg = document.createElement("div");
    ambientBg.id = "ambientBg";
    document.body.insertBefore(ambientBg, document.body.firstChild);
  }
  if (imagePath) {
    ambientBg.style.backgroundImage = `url('${imagePath}')`;
  }

  if (!mainWrapper) {
    mainWrapper = document.createElement("div");
    mainWrapper.id = "movieContentWrapper";
    
    posterContainer = document.createElement("div");
    posterContainer.id = "moviePosterContainer";
    
    posterImg = document.createElement("img");
    posterImg.id = "moviePosterImg";
    
    posterContainer.appendChild(posterImg);
    mainWrapper.appendChild(posterContainer);
    
    const titleEl = document.getElementById("title");
    const descEl = document.getElementById("desc");
    const playBtn = document.querySelector(".play-btn");
    
    if (titleEl) mainWrapper.appendChild(titleEl); 
    if (descEl) mainWrapper.appendChild(descEl);   
    if (playBtn) mainWrapper.appendChild(playBtn); 
    
    document.body.insertBefore(mainWrapper, document.body.firstChild);
  }

  if (imagePath && posterImg) {
    posterImg.src = imagePath;
  }
}

// Kickoff loading immediately
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

  const matchedSearchItem = window.searchArray ? window.searchArray.find(m => {
    if (!m.link) return false;
    const urlPart = m.link.includes('?') ? m.link.split('?')[1] : m.link;
    const movieUrlParams = new URLSearchParams(urlPart);
    const movieId = movieUrlParams.get('movie') || movieUrlParams.get('series');
    return movieId && movieId.toLowerCase() === targetId.toLowerCase();
  }) : null;

  if (matchedSearchItem && matchedSearchItem.image) {
    const filename = matchedSearchItem.image.split('/').pop();
    const absoluteImagePath = `/images/${filename}`;
    
    bgContainer.style.backgroundImage = `url('${absoluteImagePath}')`;
    bgContainer.style.backgroundSize = "cover";
    bgContainer.style.backgroundPosition = "center";
    bgContainer.style.backgroundRepeat = "no-repeat";
    bgContainer.style.backgroundAttachment = "fixed";
  } else {
    bgContainer.style.backgroundColor = "#000000";
    bgContainer.style.backgroundImage = "none";
  }
}

// ==========================================================================
// 3. CLOUDFLARE D1 TRACKER INTEGRATION (REPLACED FIRESTORE)
// ==========================================================================

async function checkContinueWatchingStatus(movieId) {
  const token = localStorage.getItem("token");
  if (!token || !movieId) return;

  try {
    const response = await fetch("/api/get-progress", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) return;

    const result = await response.json();
    const progressMap = result.progress || {};
    const mediaProgress = progressMap[movieId];

    if (mediaProgress) {
      const left = parseFloat(mediaProgress.left) || 0;
      const duration = parseFloat(mediaProgress.duration) || 0;
      const watched = duration - left;

      // Only prompt continuation if progress lies within valid middle viewing margins
      if (watched > 5 && left > 15) {
        const timeLeftMinutes = Math.ceil(left / 60);
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
  } catch (error) {
    console.error("Error reading continue watching status from API:", error);
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
  const overlay = document.createElement('div');
  overlay.id = "bottomFadeOverlay";
  
  Object.assign(overlay.style, {
    position: "fixed",
    bottom: "0",
    left: "0",
    width: "100%",
    height: "55vh",
    background: "linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.2) 50%, rgba(0, 0, 0, 0) 100%)",
    pointerEvents: "none",
    zIndex: "1"
  });
  
  document.body.appendChild(overlay);

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
    
    #title, #desc, .play-btn, .back-btn, .text-container-wrapper, .info-container {
      position: relative;
      z-index: 2;
    }

    @media (orientation: landscape) {
      body {
        display: block !important;
        overflow-y: auto !important;
        min-height: 10vh;
        margin: 0 !important;
        padding: 0 !important;
      }

      .text-container-wrapper, .info-container {
        display: none !important;
      }

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

      #movieContentWrapper {
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 24px;
        width: 800px;
        max-width: 75vw;
        margin: 0px 0 80px 60px !important;
        padding-top: 10px !important;
        position: relative;
        z-index: 3;
      }

      #moviePosterContainer {
        grid-column: 1;
        grid-row: 1;
        display: block !important;
        width: 100%;
        aspect-ratio: 2 / 3;
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

      #title {
        grid-column: 2;
        grid-row: 1;
        align-self: center;
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

    @media (orientation: portrait) {
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
        display: none !important;
      }

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
    }
  `;
  document.head.appendChild(style);
})();
