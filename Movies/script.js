// ==========================================================================
// 1. DYNAMIC DATA ARCHITECTURE & DEPENDENCY LOADING (SAFE PARSING)
// ==========================================================================

async function loadDataFiles() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");

  if (!id) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>No video ID provided.</div>";
    return;
  }

  try {
    // Check if global objects are already loaded via script tags
    if (window.movies && typeof window.movies === "object") {
      window.movieDetailsDict = window.movies;
    } else {
      const moviesResponse = await fetch("/Movies/movies.js");
      if (!moviesResponse.ok) throw new Error("Failed to fetch movies.js: " + moviesResponse.statusText);
      const moviesText = await moviesResponse.text();
      
      // Safe parsing: extract object content directly
      const cleanMoviesText = moviesText.replace(/const\s+movies\s*=/, "return ");
      const parseMovies = new Function(cleanMoviesText);
      window.movieDetailsDict = parseMovies();
    }

    if (window.searchArray && Array.isArray(window.searchArray)) {
      // Already loaded globally
    } else {
      try {
        const searchResponse = await fetch("/JS/search.js");
        if (searchResponse.ok) {
          const searchText = await searchResponse.text();
          const cleanSearchText = searchText.replace(/const\s+movies\s*=/, "return ");
          const parseSearch = new Function(cleanSearchText);
          window.searchArray = parseSearch();
        }
      } catch (e) {
        console.warn("search.js fetch skipped or failed, using fallback images.", e);
        window.searchArray = [];
      }
    }

    renderPage(id);

  } catch (error) {
    console.error("Critical error while loading data engines:", error);
    
    // Fallback: If global 'movies' object exists, proceed anyway
    if (window.movies) {
      window.movieDetailsDict = window.movies;
      renderPage(id);
    } else {
      document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Failed to load media details. Please refresh.</div>";
    }
  }
}

function renderPage(id) {
  const dict = window.movieDetailsDict || window.movies || {};
  const exactKey = Object.keys(dict).find(key => key.toLowerCase() === id.toLowerCase());
  const movieData = exactKey ? dict[exactKey] : null;

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

  const titleEl = document.getElementById("title");
  if (titleEl) titleEl.textContent = movieData.title;

  const descEl = document.getElementById("desc");
  if (descEl) {
    const textContent = movieData.desc || "";
    descEl.textContent = textContent;

    descEl.classList.remove("clamped");
    descEl.onclick = null;

    if (textContent.trim()) {
      descEl.classList.add("clamped");

      const isOverflowing = descEl.scrollHeight > descEl.clientHeight;

      if (isOverflowing) {
        descEl.style.cursor = "pointer";
        descEl.onclick = function () {
          descEl.classList.toggle("clamped");
        };
      } else {
        descEl.classList.remove("clamped");
        descEl.style.cursor = "default";
      }
    }
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

  if (typeof checkContinueWatchingStatus === "function") {
    checkContinueWatchingStatus();
  }

  initReviewsSystem(targetId);
  window.scrollTo(0, 0);
}

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

// Execute when DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadDataFiles);
} else {
  loadDataFiles();
}

// ==========================================================================
// 2. REVIEWS SYSTEM ENGINE & DOM INJECTION
// ==========================================================================

function toggleReviewComposer() {
  const zone = document.getElementById("reviewInputZone");
  if (!zone) return;
  const isHidden = zone.style.display === "none" || zone.style.display === "";
  zone.style.display = isHidden ? "block" : "none";
}

function initReviewsSystem(seriesId) {
  let container = document.querySelector(".reviews-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "reviews-container";
    container.innerHTML = `
      <div class="header-zone">
        <h2>Reviews</h2>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn-primary toggle-add-btn" onclick="toggleReviewComposer()">+ Add a Review</button>
          <span class="series-badge" id="displaySeriesName">${escapeHtml(seriesId.replace(/-/g, ' ').toUpperCase())}</span>
        </div>
      </div>

      <div id="adSlotZone" style="margin-bottom: 16px; display: flex; justify-content: center; align-items: center; width: 100%;"></div>

      <div id="statusBanner" class="status-banner"></div>

      <div class="modal-box" id="usernameModal" style="display: none;">
        <p>Please enter a display name to participate in discussions:</p>
        <div class="modal-input-group">
          <input type="text" id="usernameInput" placeholder="Enter username" />
          <button class="btn-secondary" onclick="saveUsername()">Set Name</button>
        </div>
      </div>

      <div class="review-input-zone" id="reviewInputZone" style="display: none;">
        <textarea id="mainReviewText" placeholder="Write your thoughts..."></textarea>
        <button class="btn-primary" onclick="submitReview()">Post Review</button>
      </div>

      <div id="reviewsList">
        <div class="empty-state">Loading reviews...</div>
      </div>
    `;

    const mainWrapper = document.getElementById("movieContentWrapper");
    if (mainWrapper) {
      mainWrapper.appendChild(container);
    } else {
      document.body.appendChild(container);
    }

    injectAdScript();
  }

  loadReviews(seriesId);
}

function injectAdScript() {
  const adZone = document.getElementById("adSlotZone");
  if (!adZone || document.getElementById("reynScriptTag")) return;

  const script = document.createElement("script");
  script.id = "reynScriptTag";
  script.async = true;
  script.referrerPolicy = "no-referrer-when-downgrade";
  script.src = "//shameful-farm.com/bVX/V-s.dvGJl_0FYyW/cL/CermS9iuhZLUYlfk/PiThc/xuMrzLgRx/NGD-EjtTNLzcE/zEOYDhEQ0/NeQE";

  adZone.appendChild(script);
}

const API_BASE = "https://rinolski.misty-fog-201e.workers.dev";
const token = localStorage.getItem("session_token") || "";

function showStatus(message, isError = false) {
  const banner = document.getElementById("statusBanner");
  if (!banner) return;
  banner.className = `status-banner ${isError ? 'error' : ''}`;
  banner.innerText = message;
  banner.style.display = "block";
  setTimeout(() => { banner.style.display = "none"; }, 4000);
}

function toggleReplyInput(id) {
  const el = document.getElementById(`reply-box-${id}`);
  if (el) {
    el.style.display = el.style.display === "none" ? "flex" : "none";
  }
}

async function loadReviews(seriesId) {
  const currentSeries = seriesId || new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series") || "rush-hour";
  const listEl = document.getElementById("reviewsList");
  if (!listEl) return;

  try {
    const res = await fetch(`${API_BASE}/api/get-reviews?movie=${encodeURIComponent(currentSeries)}&series=${encodeURIComponent(currentSeries)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();

    const reviewsArr = data.reviews || data.data || [];

    if (!reviewsArr || reviewsArr.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No reviews yet. Be the first to publish one!</div>`;
      return;
    }

    const sortedReviews = [...reviewsArr].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    listEl.innerHTML = sortedReviews.map(r => {
      const authorEmail = r.authorEmail || r.email || "user";
      const safeEmailId = authorEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const reviewContent = r.reviewText || r.text || r.content || "";
      const username = r.authorUsername || r.username || "Anonymous";

      return `
        <div class="review-card">
          <div class="review-header">
            <span class="review-author">@${escapeHtml(username)}</span>
            <span class="review-date">${r.timestamp ? new Date(r.timestamp).toLocaleDateString() : ''}</span>
          </div>

          <div class="review-body">${escapeHtml(reviewContent)}</div>

          <div class="review-actions">
            <button class="btn-secondary" onclick="toggleReplyInput('${safeEmailId}')">Reply</button>
          </div>

          <div class="replies-zone">
            ${(r.replies || []).map(rep => `
              <div class="reply-card">
                <strong>@${escapeHtml(rep.replierUsername \vert{}\vert{} rep.username \vert{}\vert{} 'User')}:</strong>${escapeHtml(rep.text || rep.replyText || '')}
                <div class="reply-time">${rep.timestamp ? new Date(rep.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</div>
              </div>
            `).join('')}

            <div class="reply-input-group" id="reply-box-${safeEmailId}" style="display: none;">
              <input type="text" id="reply-input-${safeEmailId}" placeholder="Reply..." />
              <button class="btn-secondary" onclick="submitReply('${authorEmail}')">Send</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch(err) {
    listEl.innerHTML = `<div class="empty-state">Unable to load reviews right now.</div>`;
  }
}

async function saveUsername() {
  const username = document.getElementById("usernameInput").value.trim();
  if (!username) return showStatus("Username cannot be empty.", true);

  try {
    const res = await fetch(`${API_BASE}/api/set-username`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ username })
    });
    const data = await res.json();

    if (res.ok) {
      showStatus("Username saved successfully!");
      document.getElementById("usernameModal").style.display = "none";
    } else {
      showStatus(data.error || "Failed to save username.", true);
    }
  } catch (err) {
    showStatus("Connection error. Please try again.", true);
  }
}

async function submitReview() {
  const currentSeries = new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series") || "rush-hour";
  const textareaEl = document.getElementById("mainReviewText");
  const text = textareaEl ? textareaEl.value.trim() : "";

  if (!text) return showStatus("Please write something before publishing.", true);

  try {
    const res = await fetch(`${API_BASE}/api/add-review`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        movie: currentSeries, 
        series: currentSeries, 
        reviewText: text,
        text: text
      })
    });
    const data = await res.json();

    if (data.requireUsername) {
      document.getElementById("usernameModal").style.display = "block";
    } else if (res.ok) {
      textareaEl.value = "";
      toggleReviewComposer();
      loadReviews(currentSeries);
    } else {
      showStatus(data.error || "Could not publish review.", true);
    }
  } catch (err) {
    showStatus("Connection error. Please try again.", true);
  }
}

async function submitReply(targetEmail) {
  const currentSeries = new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series") || "rush-hour";
  const safeEmailId = targetEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const inputEl = document.getElementById(`reply-input-${safeEmailId}`);
  const replyText = inputEl ? inputEl.value.trim() : "";

  if (!replyText) return showStatus("Reply cannot be empty.", true);

  try {
    const res = await fetch(`${API_BASE}/api/add-reply`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        movie: currentSeries, 
        series: currentSeries, 
        targetEmail: targetEmail, 
        replyText: replyText,
        text: replyText
      })
    });
    const data = await res.json();

    if (data.requireUsername) {
      document.getElementById("usernameModal").style.display = "block";
    } else if (res.ok) {
      loadReviews(currentSeries);
    } else {
      showStatus(data.error || "Could not post reply.", true);
    }
  } catch (err) {
    showStatus("Connection error. Please try again.", true);
  }
}

function escapeHtml(str) {
  return str ? String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
}

// ==========================================================================
// 3. BACKGROUND FALLBACK
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
// 4. FIRESTORE INTEGRATION & USER PROGRESS
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
// 5. USER INTERACTIVE NAVIGATION CONTROLS
// ==========================================================================

function play() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");
  const movie = window.currentMovie; 

  if (movie && id) {
    const encodedTitle = encodeURIComponent(movie.title || id);
    window.location.href = `videoplayer?ep=${movie.play || ''}&movie=${id}&title=${encodedTitle}`;
  }
}

function goBack() {
  window.history.back();
}

// ==========================================================================
// 6. GLOBAL STYLES & LAYOUT DECORATORS
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

    .back-btn {
      position: fixed !important;
      top: 20px !important;
      left: 10px !important;
      right: auto !important;
      z-index: 10 !important;
      cursor: pointer;
    }

    #title, #desc, .play-btn, .text-container-wrapper, .info-container {
      position: relative;
      z-index: 2;
    }

    #desc {
      user-select: none;
      transition: max-height 0.3s ease;
    }

    #desc.clamped {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :root {
      --rev-bg: transparent;
      --rev-card-bg: #0a0a0a;
      --rev-panel-bg: #141414;
      --rev-input-bg: #0f0f0f;
      --rev-border: #262626;
      --rev-border-accent: #404040;
      --rev-text-main: #ffffff;
      --rev-text-muted: #888888;
    }

    .reviews-container {
      width: 100%;
      background-color: var(--rev-bg) !important;
      border: none;
      border-radius: 12px;
      padding: 10px 0;
      margin-top: 16px;
      color: var(--rev-text-main);
      box-sizing: border-box;
      text-align: left !important;
      position: relative;
      z-index: 4;
    }

    .reviews-container .header-zone {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--rev-border);
      padding-bottom: 10px;
      margin-bottom: 16px;
    }

    .reviews-container .header-zone h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--rev-text-main);
      letter-spacing: -0.5px;
      margin: 0;
    }

    .reviews-container .series-badge {
      background-color: #0a0a0a;
      color: var(--rev-text-main);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      border: 1px solid var(--rev-border-accent);
    }

    .reviews-container .status-banner {
      display: none;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 0.875rem;
      margin-bottom: 16px;
      font-weight: 500;
      background-color: #0a0a0a;
      border: 1px solid #888888;
      color: #ffffff;
    }

    .reviews-container .modal-box {
      background-color: #0a0a0a;
      border: 1px solid var(--rev-border-accent);
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .reviews-container .modal-box p {
      color: var(--rev-text-main);
      margin-bottom: 10px;
      font-size: 0.9rem;
    }

    .reviews-container .modal-input-group {
      display: flex;
      gap: 8px;
    }

    .reviews-container .modal-input-group input {
      flex: 1;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--rev-border-accent);
      background-color: var(--rev-input-bg);
      color: #fff;
      font-size: 0.85rem;
    }

    .reviews-container .review-input-zone {
      background-color: #0a0a0a;
      border: 1px solid var(--rev-border);
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .reviews-container .review-input-zone textarea {
      width: 100%;
      height: 90px;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid var(--rev-border-accent);
      background-color: var(--rev-input-bg);
      color: var(--rev-text-main);
      font-family: inherit;
      resize: vertical;
      margin-bottom: 10px;
    }

    .reviews-container .btn-primary {
      padding: 8px 16px;
      background-color: #ffffff;
      color: #000000;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.85rem;
      transition: background 0.2s;
    }

    .reviews-container .review-card {
      background-color: #0a0a0a !important;
      border: 1px solid var(--rev-border);
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    }

    .reviews-container .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .reviews-container .review-author {
      color: #ffffff !important;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .reviews-container .review-date {
      color: var(--rev-text-muted);
      font-size: 0.75rem;
    }

    .reviews-container .review-body {
      width: 100%;
      font-size: 0.9rem;
      line-height: 1.4;
      color: #eeeeee;
      white-space: pre-line;
      word-break: break-word;
    }

    .reviews-container .review-actions {
      display: flex;
      justify-content: flex-end;
      width: 100%;
      margin-top: 2px;
    }

    .reviews-container .replies-zone {
      margin-left: 8px;
      border-left: 2px solid var(--rev-border-accent);
      padding-left: 10px;
      margin-top: 6px;
    }

    .reviews-container .reply-card {
      background-color: #141414;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 6px;
      font-size: 0.8rem;
      border: 1px solid var(--rev-border);
    }

    .reviews-container .reply-card strong {
      color: #ffffff;
    }

    .reviews-container .reply-time {
      font-size: 0.7rem;
      color: var(--rev-text-muted);
      text-align: right;
      margin-top: 2px;
    }

    .reviews-container .reply-input-group {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }

    .reviews-container .reply-input-group input {
      flex: 1;
      padding: 6px 10px;
      border-radius: 4px;
      border: 1px solid var(--rev-border-accent);
      background-color: var(--rev-input-bg);
      color: #fff;
      font-size: 0.8rem;
    }

    .reviews-container .btn-secondary {
      padding: 6px 12px;
      background-color: #262626;
      color: #ffffff;
      border: 1px solid var(--rev-border-accent);
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .reviews-container .empty-state {
      text-align: center;
      color: var(--rev-text-muted);
      padding: 20px 0;
      font-size: 0.85rem;
      background-color: #0a0a0a;
      border-radius: 8px;
      border: 1px solid var(--rev-border);
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

      .reviews-container {
        grid-column: 1 / span 2;
        grid-row: 4;
      }
    }

    @media (orientation: portrait) {
      html, body {
        overflow-y: auto !important;
        height: auto !important;
        min-height: 50vh !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      #movieContentWrapper {
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-start !important;
        align-items: center !important;
        text-align: center !important;
        position: relative !important;
        top: 0 !important;
        transform: none !important;
        margin-top: 50vh !important; 
        padding-bottom: 80px !important;
        width: 100% !important;
        max-width: 90vw !important;
        margin-left: auto !important;
        margin-right: auto !important;
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
        margin: 0 auto 24px auto !important;
        display: inline-flex !important;
        justify-content: center !important;
        align-items: center !important;
      }
    }
  `;
  document.head.appendChild(style);
})();
