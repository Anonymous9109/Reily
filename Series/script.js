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

  // Handle baseline sync tasks with Cloudflare API backend using normalized key
  checkContinueWatchingAndInitRatings(exactKey);
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
    
    // Create and Append the Interactive Star Rating System Layout Directly under Play Button
    const ratingContainer = document.createElement("div");
    ratingContainer.id = "movieRatingContainer";
    ratingContainer.innerHTML = `
      <span id="ratingCount">0 ratings</span>
      <div class="star-wrapper">
        <span class="star" data-value="1">★</span>
        <span class="star" data-value="2">★</span>
        <span class="star" data-value="3">★</span>
        <span class="star" data-value="4">★</span>
        <span class="star" data-value="5">★</span>
      </div>
    `;
    mainWrapper.appendChild(ratingContainer);
    
    document.body.insertBefore(mainWrapper, document.body.firstChild);
  }

  if (imagePath && posterImg) {
    posterImg.src = imagePath;
  }
}

// Kickoff loading engine
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
// 3. CLOUDFLARE D1 TRACKING & RATING SYNC BRIDGE (FIREBASE REMOVED)
// ==========================================================================

async function checkContinueWatchingAndInitRatings(normalizedId) {
  // Base endpoint location configuration for Cloudflare Worker
  const API_BASE = ""; 
  const token = localStorage.getItem("session_token") || "";

  // Always kick off rating engine with active credentials using sanitized key id
  initRatingSystem(normalizedId, token);

  // Sync playback tracking with Cloudflare D1 backend metrics
  if (token && normalizedId) {
    try {
      const res = await fetch(`${API_BASE}/api/get-progress`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        const progressMap = data.progress || {};
        const movieProgress = progressMap[normalizedId];

        if (movieProgress) {
          const left = movieProgress.left || 0;
          const duration = movieProgress.duration || 0;
          const currentTime = duration - left;

          // Check if user is in an active watch sequence window
          if (currentTime > 5 && currentTime < (duration - 15)) {
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
      }
    } catch (error) {
      console.error("Error reading continue watching status from D1:", error);
    }
  }
}

// ==========================================================================
// 4. FRONTEND INTERACTIVE STAR RATING SYSTEM LOGIC
// ==========================================================================

async function initRatingSystem(movieId, token) {
  if (!movieId) return;

  const API_BASE = ""; 
  const countEl = document.getElementById("ratingCount");
  const stars = document.querySelectorAll(".star");

  // Fetch data directly out of Cloudflare D1 JSON rating matrix engine
  try {
    const headers = token ? { "Authorization": `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/api/get-rating?movieId=${encodeURIComponent(movieId)}`, { headers });
    if (res.ok) {
      const data = await res.json();
      countEl.textContent = `${data.totalRatings || 0} ratings`;
      highlightStars(data.userRating || 0);
    }
  } catch (err) {
    console.error("Failed to sync structural rating data components:", err);
  }

  // Handle mapping star user engagement listeners
  stars.forEach(star => {
    star.onmouseenter = null;
    star.onclick = null;

    star.addEventListener("click", async () => {
      if (!token) {
        alert("Please log in to submit ratings!");
        return;
      }
      const ratingValue = parseInt(star.getAttribute("data-value"), 10);
      
      // Optimistic UI layout design update
      highlightStars(ratingValue);

      try {
        const response = await fetch(`${API_BASE}/api/rate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ movieId, rating: ratingValue })
        });
        
        if (response.ok) {
          const updatedData = await response.json();
          countEl.textContent = `${updatedData.totalRatings || 0} ratings`;
        } else {
          console.error("Server rejected rating tracking operation payload framework.");
        }
      } catch (err) {
        console.error("Failed communicating out to JSON rating database engine:", err);
      }
    });
  });

  function highlightStars(rating) {
    stars.forEach(star => {
      const val = parseInt(star.getAttribute("data-value"), 10);
      if (val <= rating) {
        star.classList.add("filled");
      } else {
        star.classList.remove("filled");
      }
    });
  }
}

// ==========================================================================
// 5. USER INTERACTIVE NAVIGATION CONTROLS
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
// 6. GLOBAL STYLE DECORATORS & FADING OVERLAYS (UI/UX)
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
    
    #title, #desc, .play-btn, .back-btn, .text-container-wrapper, .info-container, #movieRatingContainer {
      position: relative;
      z-index: 2;
    }

    /* STAR RATING COMPONENT CUSTOM STYLES */
    #movieRatingContainer {
      grid-column: 1 / span 2;
      grid-row: 4;
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: -5px;
    }

    #ratingCount {
      color: rgba(255, 255, 255, 0.7);
      font-family: sans-serif;
      font-size: 1rem;
      font-weight: 600;
      min-width: 75px;
    }

    .star-wrapper {
      display: flex;
      gap: 4px;
    }

    .star {
      font-size: 1.65rem;
      cursor: pointer;
      color: #000000;
      -webkit-text-stroke: 1.5px #ffffff;
      text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
      transition: transform 0.12s ease-in-out, color 0.12s ease-in-out;
      user-select: none;
    }

    .star:hover {
      transform: scale(1.15);
    }

    .star.filled {
      color: #ffffff;
      -webkit-text-stroke: 1.5px #000000;
    }

    /* ==========================================
     * LANDSCAPE ORIENTATION DESIGN MODIFICATIONS
     * ========================================== */
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

    /* ==========================================
     * PORTRAIT ORIENTATION STABILIZER 
     * ========================================== */
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

      #moviePosterContainer, #moviePosterImg, #ambientBg {
        display: none !important;
      }

      #title, #desc {
        text-align: center !important;
        margin-left: auto !important;
        margin-right: auto !important;
        width: 100%;
      }

      #title { margin: 0 0 16px 0 !important; }
      #desc { margin: 0 0 24px 0 !important; }

      .play-btn {
        margin: 0 auto !important;
        display: inline-flex !important;
        justify-content: center !important;
        align-items: center !important;
      }

      #movieRatingContainer {
        margin: 15px auto 0 auto !important;
        justify-content: center;
      }
    }
  `;
  document.head.appendChild(style);
})();

