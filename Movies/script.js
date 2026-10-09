// ==========================================================================
// 1. DYNAMIC DATA ARCHITECTURE & DEPENDENCY LOADING
// ==========================================================================

async function loadDataFiles() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("movie") || params.get("series");

  if (!id) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>No video ID provided.</div>";
    return;
  }

  try {
    const moviesResponse = await fetch("/Movies/movies.js");
    if (!moviesResponse.ok) throw new Error("Failed to fetch movies.js");
    const moviesText = await moviesResponse.text();

    const cleanMoviesText = moviesText.replace(/const\s+movies\s*=/, "return ");
    const parseMovies = new Function(cleanMoviesText);
    window.movieDetailsDict = parseMovies();

    try {
      const searchResponse = await fetch("/JS/search.js");
      if (searchResponse.ok) {
        const searchText = await searchResponse.text();
        const cleanSearchText = searchText.replace(/const\s+movies\s*=/, "return ");
        const parseSearch = new Function(cleanSearchText);
        window.searchArray = parseSearch();
      }
    } catch (e) {
      console.warn("search.js fetch skipped or failed.", e);
      window.searchArray = [];
    }

    renderPage(id);

  } catch (error) {
    console.error("Critical error loading data files:", error);
    if (window.movies) {
      window.movieDetailsDict = window.movies;
      renderPage(id);
    } else {
      document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Failed to load movie data. Please refresh the page.</div>";
    }
  }
}

function renderPage(id) {
  const dict = window.movieDetailsDict || window.movies || {};
  
  let movieData = null;
  if (Array.isArray(dict)) {
    movieData = dict.find(m => {
      if (!m.link) return false;
      const urlPart = m.link.includes('?') ? m.link.split('?')[1] : m.link;
      const urlParams = new URLSearchParams(urlPart);
      const mId = urlParams.get('movie') || urlParams.get('series');
      return mId && mId.toLowerCase() === id.toLowerCase();
    });
  } else {
    const exactKey = Object.keys(dict).find(key => key.toLowerCase() === id.toLowerCase());
    movieData = exactKey ? dict[exactKey] : null;
  }

  if (!movieData) {
    document.body.innerHTML = "<div style='color:white; text-align:center; margin-top:20%; font-family:sans-serif;'>Movie details not found.</div>";
    return;
  }

  window.currentMovie = movieData;

  let imagePath = movieData.image || "";
  if (!imagePath && window.searchArray) {
    const searchList = Array.isArray(window.searchArray) ? window.searchArray : Object.values(window.searchArray);
    const matched = searchList.find(m => m.title && m.title.toLowerCase() === (movieData.title || "").toLowerCase());
    if (matched && matched.image) imagePath = matched.image;
  }

  setupLandscapeDOMArchitecture(imagePath);

  const titleEl = document.getElementById("title");
  if (titleEl) titleEl.textContent = movieData.title || id;

  const descEl = document.getElementById("desc");
  if (descEl) {
    const textContent = movieData.desc || movieData.description || "";
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

  initReviewsSystem(id);
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

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadDataFiles);
} else {
  loadDataFiles();
}

// ==========================================================================
// 2. REVIEWS SYSTEM ENGINE
// ==========================================================================

const API_BASE = "https://rinolski.misty-fog-201e.workers.dev";
const token = localStorage.getItem("session_token") || localStorage.getItem("token") || "";

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
        <p>Please enter a display name to write reviews:</p>
        <div class="modal-input-group">
          <input type="text" id="usernameInput" placeholder="Enter username" />
          <button class="btn-secondary" onclick="saveUsername()">Set Name</button>
        </div>
      </div>

      <div class="review-input-zone" id="reviewInputZone" style="display: none;">
        <textarea id="mainReviewText" placeholder="Write your review..."></textarea>
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
  }

  loadReviews(seriesId);
}

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
      listEl.innerHTML = `<div class="empty-state">No reviews yet. Be the first to leave one!</div>`;
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
      showStatus("Username saved!");
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

  if (!text) return showStatus("Please write something before submitting.", true);

  try {
    const res = await fetch(`${API_BASE}/api/add-review`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ movie: currentSeries, series: currentSeries, reviewText: text, text: text })
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
    showStatus("Connection error.", true);
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
      body: JSON.stringify({ movie: currentSeries, series: currentSeries, targetEmail: targetEmail, replyText: replyText, text: replyText })
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
    showStatus("Connection error.", true);
  }
}

function escapeHtml(str) {
  return str ? String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
}

// ==========================================================================
// 3. FALLBACK BACKGROUND ENGINE
// ==========================================================================

function applyFallbackBackground(id) {
  const video = document.getElementById("bgVideo");
  if (video) video.style.display = "none";

  const bgContainer = document.body;
  const targetId = id || new URLSearchParams(window.location.search).get("movie") || new URLSearchParams(window.location.search).get("series");

  const searchList = window.searchArray || window.movies || [];
  const matchedSearchItem = Array.isArray(searchList) ? searchList.find(m => {
    if (!m.link) return false;
    const urlPart = m.link.includes('?') ? m.link.split('?')[1] : m.link;
    const urlParams = new URLSearchParams(urlPart);
    const movieId = urlParams.get('movie') || urlParams.get('series');
    return movieId && movieId.toLowerCase() === targetId.toLowerCase();
  }) : null;

  if (matchedSearchItem && matchedSearchItem.image) {
    bgContainer.style.backgroundImage = `url('${matchedSearchItem.image}')`;
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
// 4. NAVIGATION CONTROLS & DOWNLOAD TRIGGER
// ==========================================================================

function triggerDownload() {
  const movie = window.currentMovie;
  const params = new URLSearchParams(window.location.search);
  const movieId = params.get("movie") || params.get("series");

  if (movie && typeof window.AndroidBridge !== "undefined") {
    const videoUrl = movie.play || movie.video;
    const videoTitle = movie.title || movieId;
    
    // Calls Android Bridge with clean video parameters
    window.AndroidBridge.downloadVideo(videoUrl, movieId, videoTitle);
  }
}

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
