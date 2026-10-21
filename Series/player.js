/* Cyrene Player (Auto Fullscreen Landscape on Load) */
document.addEventListener("DOMContentLoaded", async () => {

  /********** Immediate Auto Fullscreen & Landscape Trigger **********/
  function forceFullscreenLandscape() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(() => {});
      }
    } catch (e) {
      console.error("Fullscreen/Orientation lock error:", e);
    }
  }

  forceFullscreenLandscape();
  window.addEventListener("load", forceFullscreenLandscape);

  /********** 1) Inject CSS **********/
  const css = `
    @font-face {
      font-family: 'CyreneCustom';
      src: url('/fonts/your-font.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
    }

    :root { -webkit-tap-highlight-color: transparent; }
    body { margin:0; background:#000; height:100vh; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    #videoPlayer{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:#000; }
    video{ width:100%; height:100%; object-fit:contain; background:#000; opacity:1; transition:opacity .28s ease; }

    video::cue { visibility: hidden !important; opacity: 0 !important; background: transparent !important; }

    #videoPlayer::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 20%, transparent 50%),
                  linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%);
      z-index: 20;
      pointer-events: none;
      opacity: 0;
      transition: opacity .4s ease;
    }
    #videoPlayer.show-ui::after { opacity: 1; }

    #subDisplay {
      position: absolute;
      bottom: 8%; 
      left: 10%;
      right: 10%;
      text-align: center;
      z-index: 25;
      pointer-events: none;
      font-family: 'CyreneCustom', sans-serif;
      transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      justify-content: center;
    }
    #subDisplay span {
        padding: 0.2em 0.5em;
        border-radius: 0.2em;
        line-height: 1.2;
        color: #ffffff; 
        font-size: 4.5vmin;
        text-align: center;
        transition: all 0.2s ease;
    }
    #videoPlayer.show-ui #subDisplay { bottom: 20%; }

    .controls {  
      position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); 
      display:flex; gap:0px; align-items:center; z-index:30;  
      opacity:0; visibility:hidden; transition:opacity .2s, visibility .2s;  
    }  

    .controls button {  
      width:100px; height:100px; border-radius:50%; border:none;  
      background:transparent; display:flex; align-items:center; justify-content:center;  
      cursor:pointer; transition:background .25s;
    }
    .controls svg { height:54px; width:54px; fill:#fff; pointer-events:none; }  

    #ccBtn {
      position: absolute; bottom: 25px; left: 5%; 
      background: none; border: none; cursor: pointer; 
      z-index: 35; opacity: 0; visibility: hidden; 
      transition: opacity .2s, visibility .2s; display: none; align-items: center;
    }
    #ccBtn svg { width:32px; height:32px; fill:#fff; }
    #ccBtn.active svg { fill: red; }

    #sub-menu {
      position: absolute; bottom: 65px; left: 5%; 
      background: rgba(15, 15, 15, 0.95); border: 1px solid #444; 
      border-radius: 4px; padding: 5px 0; display: none; 
      flex-direction: column; z-index: 50; min-width: 120px;
    }
    .sub-option {
      color: white; background: none; border: none; 
      text-align: left; padding: 8px 15px; cursor: pointer; 
      font-family: sans-serif; font-size: 13px;
    }
    .sub-option:hover { background: rgba(255, 255, 255, 0.1); }
    .sub-option.active { color: red; font-weight: bold; }

    #backToPrev {  
      position:absolute; top:14px; left:14px; width:46px; height:46px;  
      border:none; border-radius:50%; background:rgba(0,0,0,.55);  
      display:flex; align-items:center; justify-content:center;  
      cursor:pointer; transition:background .25s, opacity .2s, visibility .2s;  
      z-index:40; opacity:0; visibility:hidden;  
    }  
    #backToPrev:hover { background:rgba(255,0,0,0.65); }  
    #backToPrev svg { width:28px; height:28px; fill:#fff; }  

    #downloadBtn {  
      position:absolute; top:14px; left:70px; width:46px; height:46px;  
      border:none; border-radius:50%; background:rgba(0,0,0,.55);  
      display:flex; align-items:center; justify-content:center;  
      cursor:pointer; transition:background .25s, opacity .2s, visibility .2s;  
      z-index:40; opacity:0; visibility:hidden;  
    }  
    #downloadBtn:hover { background:rgba(255,0,0,0.65); }  
    #downloadBtn svg { width:24px; height:24px; fill:#fff; }  

    .progress-container {  
      position:absolute; bottom:60px; left:5%; right:5%;  
      height:20px; display:flex; align-items:center; cursor:pointer; 
      z-index:25; opacity:0; visibility:hidden; transition:opacity .2s, visibility .2s;  
    }  
    .progress-bg { width:100%; height:7px; background:rgba(255,255,255,0.2); border-radius:4px; position:relative; }
    .progress-bar { width:0%; height:100%; background:red; border-radius:4px; position:relative; pointer-events:none; } 
    
    .progress-bar::after {
      content: ""; position: absolute; right: -8px; top: 50%;
      transform: translateY(-50%) scale(0);
      width: 16px; height: 16px; background: red; border-radius: 50%;
      transition: transform 0.1s ease;
    }
    .progress-container.dragging .progress-bar::after { transform: translateY(-50%) scale(1); }

    .video-timer {
      position: absolute; bottom: 85px; left: 5%;
      color: #fff; font-family: sans-serif; font-size: 14px; font-weight: 600;
      z-index: 25; opacity: 0; visibility: hidden;
      transition: opacity .2s, visibility .2s; text-shadow: 0 0 4px rgba(0,0,0,0.7);
    }

    .nav-btn {  
      position:absolute; top:16px; background:transparent; color:#fff;  
      border:none; font-size:22px; padding:8px 12px; cursor:pointer; z-index:30;  
      opacity:0; visibility:hidden; transition:opacity .2s, visibility .2s;  
    }  
    .back-btn { left:12px; }  
    .next-btn { right:12px; }  

    #nextEpOverlay {
      position: absolute;
      bottom: 30px;
      right: 5%;
      display: flex;
      gap: 12px;
      z-index: 45;
      opacity: 0;
      visibility: hidden;
      transition: bottom 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s, visibility 0.2s;
    }
    #nextEpOverlay.show-controls {
      opacity: 1;
      visibility: visible;
    }
    #nextEpOverlay.near-end {
      bottom: 95px !important;
      opacity: 1 !important;
      visibility: visible !important;
    }
    .action-prompt-btn {
      position: relative;
      border: none;
      padding: 12px 22px;
      border-radius: 8px;
      font-family: sans-serif;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      transition: transform 0.15s ease;
    }
    .action-prompt-btn:hover {
      transform: scale(1.05);
    }
    #watchCreditsBtn {
      background: rgba(30, 30, 30, 0.85);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
      display: none;
    }
    #nextEpTimerBtn {
      background: #444444;
      color: #ffffff;
    }
    #nextEpTimerBtn .timer-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: #ffffff;
      z-index: 1;
      pointer-events: none;
      transition: width 0.1s linear;
    }
    #nextEpTimerBtn span {
      position: relative;
      z-index: 2;
      color: #ffffff;
    }

    #loadingRing{  
      position:absolute; left:50%; top:50%; transform:translate(-50%,-50%);  
      width:52px; height:52px; border-radius:50%;  
      border:6px solid rgba(255,0,0,0.25); border-top:6px solid red;  
      animation:spin 1s linear infinite; display:none; z-index:60;  
    }  
    @keyframes spin {  
      from{transform:translate(-50%,-50%) rotate(0deg);}  
      to{transform:translate(-50%,-50%) rotate(360deg);}  
    }

    #imaAdContainer {
      position: absolute;
      inset: 0;
      z-index: 55;
      pointer-events: auto;
    }
  `;
  const styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /********** 2) Build DOM **********/
  const root = document.createElement("div");
  root.id = "videoPlayer";

  const video = document.createElement("video");
  video.id = "videoElement";
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("webkit-playsinline", "");
  video.crossOrigin = "anonymous"; 

  const subDisplay = document.createElement("div");
  subDisplay.id = "subDisplay";

  const controls = document.createElement("div");
  controls.className = "controls";
  controls.innerHTML = `
    <button id="rewindBtn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.99805 3.5C2.99805 3.22386 3.2219 3 3.49805 3C3.77419 3 3.99805 3.22386 3.99805 3.5V5.70632C4.91067 4.67184 6.08199 3.88382 7.40447 3.43107C9.2407 2.80243 11.2429 2.86309 13.0377 3.60171C14.8325 4.34033 16.2974 5.7065 17.1593 7.44549C17.2819 7.69291 17.1808 7.9929 16.9333 8.11552C16.6859 8.23815 16.3859 8.13698 16.2633 7.88956C15.5092 6.36804 14.2275 5.17272 12.6571 4.52646C11.0868 3.88021 9.33496 3.82714 7.72837 4.37716C6.31508 4.861 5.09908 5.78248 4.25184 7H7.49805C7.77419 7 7.99805 7.22386 7.99805 7.5C7.99805 7.77614 7.77419 8 7.49805 8H3.49805C3.2219 8 2.99805 7.77614 2.99805 7.5V3.5ZM8.00005 10.5C8.00005 10.3156 7.89856 10.1462 7.73598 10.0592C7.5734 9.97215 7.37613 9.98169 7.2227 10.084L5.7227 11.084C5.49294 11.2372 5.43085 11.5476 5.58403 11.7774C5.7372 12.0071 6.04764 12.0692 6.2774 11.916L7.00005 11.4343V16.5C7.00005 16.7761 7.22391 17 7.50005 17C7.7762 17 8.00005 16.7761 8.00005 16.5V10.5ZM12.5029 10C11.568 10 10.9058 10.4367 10.5071 11.1292C10.1306 11.7833 10.0029 12.6366 10.0029 13.5C10.0029 14.3634 10.1306 15.2167 10.5071 15.8708C10.9058 16.5633 11.568 17 12.5029 17C13.4379 17 14.1001 16.5633 14.4988 15.8708C14.8753 15.2167 15.0029 14.3634 15.0029 13.5C15.0029 12.6366 14.8753 11.7833 14.4988 11.1292C14.1001 10.4367 13.4379 10 12.5029 10ZM11.0029 13.5C11.0029 12.7065 11.1253 12.0598 11.3738 11.6281C11.6001 11.2349 11.9379 11 12.5029 11C13.068 11 13.4058 11.2349 13.6321 11.6281C13.8806 12.0598 14.0029 12.7065 14.0029 13.5C14.0029 14.2935 13.8806 14.9402 13.6321 15.3719C13.4058 15.7651 13.068 16 12.5029 16C11.9379 16 11.6001 15.7651 11.3738 15.3719C11.1253 14.9402 11.0029 14.2935 11.0029 13.5Z" fill="white"/>
</svg>
</button>
<button id="playPauseBtn" style="background: none; border: none; cursor: pointer; color: white;">
  <svg id="playIcon" viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
    <path d="M6 4.359c0-.938 1.013-1.523 1.825-1.054l13.088 7.556a1.218 1.218 0 0 1 0 2.108l-13.088 7.556c-.812.469-1.825-.116-1.825-1.054V4.359Z" />
  </svg>
  <svg id="pauseIcon" viewBox="0 0 24 24" width="32" height="32" fill="currentColor" style="display:none">
    <path d="M5.25 4.5A1.25 1.25 0 0 0 4 5.75v12.5c0 .69.56 1.25 1.25 1.25h3.5c.69 0 1.25-.56 1.25-1.25V5.75c0-.69-.56-1.25-1.25-1.25h-3.5ZM14.25 4.5a1.25 1.25 0 0 0-1.25 1.25v12.5c0 .69.56 1.25 1.25 1.25h3.5c.69 0 1.25-.56 1.25-1.25V5.75c0-.69-.56-1.25-1.25-1.25h-3.5Z" />
  </svg>
</button>
<button id="skipBtn"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M17 3.5C17 3.22386 16.7761 3 16.5 3C16.2239 3 16 3.22386 16 3.5V5.70245C15.0879 4.66988 13.9178 3.88325 12.597 3.43107C10.7608 2.80243 8.75857 2.86309 6.96376 3.60171C5.16895 4.34033 3.70403 5.7065 2.84215 7.44549C2.71953 7.69291 2.82069 7.9929 3.06812 8.11552C3.31554 8.23815 3.61552 8.13698 3.73815 7.88956C4.49224 6.36804 5.77396 5.17272 7.34432 4.52646C8.91469 3.88021 10.6665 3.82714 12.2731 4.37716C13.6864 4.861 14.9024 5.78248 15.7496 7H12.5C12.2239 7 12 7.22386 12 7.5C12 7.77614 12 8 12.5 8H16.5C16.7761 8 17 7.77614 17 7.5V3.5ZM10.5071 11.1292C10.9058 10.4367 11.568 10 12.5029 10C13.4379 10 14.1001 10.4367 14.4988 11.1292C14.8753 11.7833 15.0029 12.6366 15.0029 13.5C15.0029 14.3634 14.8753 15.2167 14.4988 15.8708C14.1001 16.5633 13.4379 17 12.5029 17C11.568 17 10.9058 16.5633 10.5071 15.8708C10.1306 15.2167 10.0029 14.3634 10.0029 13.5C10.0029 12.6366 10.1306 11.7833 10.5071 11.1292ZM11.3738 11.6281C11.1253 12.0598 11.0029 12.7065 11.0029 13.5C11.0029 14.2935 11.1253 14.9402 11.3738 15.3719C11.6001 15.7651 11.9379 16 12.5029 16C13.068 16 13.4058 15.7651 13.6321 15.3719C13.8806 14.9402 14.0029 14.2349 14.0029 13.5C14.0029 12.7065 13.8806 12.0598 13.6321 11.6281C13.4058 11.2349 13.068 11 12.5029 11C11.9379 11 11.6001 11.2349 11.3738 11.6281ZM8.00005 10.5C8.00005 10.3156 7.89856 10.1462 7.73598 10.0592C7.5734 9.97215 7.37613 9.98169 7.2227 10.084L5.7227 11.084C5.49294 11.2372 5.43085 11.5476 5.58403 11.7774C5.7372 12.0071 6.04764 12.0692 6.2774 11.916L7.00005 11.4343V16.5C7.00005 16.7761 7.22391 17 7.50005 17C7.7762 17 8.00005 16.7761 8.00005 16.5V10.5Z" fill="white"/>
</svg>
</button>
  `;

  const ccBtn = document.createElement("button");
  ccBtn.id = "ccBtn";
  ccBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55 0-.45 1-1h3c.55 0 1 .45 1 1v1z"/></svg>`;

  const subMenu = document.createElement("div");
  subMenu.id = "sub-menu";

  const backToPrev = document.createElement("button");
  backToPrev.id = "backToPrev";
  backToPrev.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
  backToPrev.onclick = () => {
    if (window.seriesPageLink) {
      location.href = window.seriesPageLink;
    } else {
      try {
        const baseSeriesId = movieParamId.replace(/-S\d+E\d+$/i, "");
        location.href = `series.html?series=${baseSeriesId}`;
      } catch (err) {
        history.back();
      }
    }
  };

  const params = new URLSearchParams(window.location.search);
  const ep = params.get("ep") || "1";
  const movieParamId = params.get("movie") || params.get("series") || params.get("id") || ep; 
  let activeMovieTitle = document.title && document.title !== "Player" ? document.title : movieParamId;

  async function getAbsolutePosterUrl(id) {
    if (!id) return `https://rinolski.online/images/default.jpg`;
    try {
      const res = await fetch("/JS/search.js");
      const text = await res.text();
      const cleanText = text.replace(/const\s+movies\s*=/, "return ");
      const searchItems = new Function(cleanText)();

      const matched = searchItems.find(m => {
        if (!m.link) return false;
        const urlPart = m.link.includes('?') ? m.link.split('?')[1] : m.link;
        const p = new URLSearchParams(urlPart);
        const idInLink = p.get('movie') || p.get('series');
        return idInLink && idInLink.toLowerCase() === id.toLowerCase();
      });

      if (matched && matched.image) {
        const filename = matched.image.split('/').pop();
        return `https://rinolski.online/images/${filename}`;
      }
    } catch (e) {
      console.error("Poster resolution error:", e);
    }
    return `https://rinolski.online/images/${id}.jpg`;
  }

  let resolvedPoster = "";
  getAbsolutePosterUrl(movieParamId).then(url => { resolvedPoster = url; });

  const downloadBtn = document.createElement("button");
  downloadBtn.id = "downloadBtn";
  downloadBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;
  
  downloadBtn.onclick = async (e) => {
    e.stopPropagation();
    if (src) {
      let cleanTitle = (activeMovieTitle && activeMovieTitle !== "Unknown Media") ? activeMovieTitle : movieParamId;
      cleanTitle = cleanTitle.replace(/[\\/:*?"<>|]/g, "_").trim();
      const finalFileName = `${cleanTitle}.mp4`;

      if (!resolvedPoster || resolvedPoster.includes("default.jpg")) {
        resolvedPoster = await getAbsolutePosterUrl(movieParamId);
      }

      if (window.AndroidBridge && typeof window.AndroidBridge.downloadVideo === "function") {
        window.AndroidBridge.downloadVideo(src, movieParamId, cleanTitle, resolvedPoster);
        return;
      }

      const a = document.createElement("a");
      a.href = src;
      a.download = finalFileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const progressContainer = document.createElement("div");
  progressContainer.className = "progress-container";
  const progressBg = document.createElement("div");
  progressBg.className = "progress-bg";
  const progressBar = document.createElement("div");
  progressBar.id = "pBar";
  progressBar.className = "progress-bar";
  progressBg.appendChild(progressBar);
  progressContainer.appendChild(progressBg);

  const timerDisplay = document.createElement("div");
  timerDisplay.className = "video-timer";
  timerDisplay.textContent = "0:00 / 0:00";

  const backBtn = document.createElement("button");
  backBtn.className = "nav-btn back-btn";
  backBtn.innerHTML = "◀";

  const nextBtn = document.createElement("button");
  nextBtn.className = "nav-btn next-btn";
  nextBtn.innerHTML = "▶";

  const loadingRing = document.createElement("div");
  loadingRing.id = "loadingRing";

  const nextEpOverlay = document.createElement("div");
  nextEpOverlay.id = "nextEpOverlay";

  const watchCreditsBtn = document.createElement("button");
  watchCreditsBtn.id = "watchCreditsBtn";
  watchCreditsBtn.className = "action-prompt-btn";
  watchCreditsBtn.textContent = "Watch Credits";

  const nextEpTimerBtn = document.createElement("button");
  nextEpTimerBtn.id = "nextEpTimerBtn";
  nextEpTimerBtn.className = "action-prompt-btn";
  nextEpTimerBtn.innerHTML = `
    <div class="timer-fill" id="timerFill"></div>
    <span>Next Episode</span>
  `;

  nextEpOverlay.append(watchCreditsBtn, nextEpTimerBtn);
  root.append(video, subDisplay, controls, progressContainer, timerDisplay, ccBtn, subMenu, backBtn, nextBtn, loadingRing, backToPrev, downloadBtn, nextEpOverlay);
  document.body.appendChild(root);

  /********** 3) Smart Source Detection **********/
  let src = null;
  if (window.videoData && ep && window.videoData[ep]) src = window.videoData[ep];
  if (!src && params.get("src")) src = decodeURIComponent(params.get("src"));

  if (!src) {
    document.body.innerHTML = `<p style="color:white;text-align:center;font-family:sans-serif;margin-top:20vh;">No video found.</p>`;
    return;
  }

  async function fallbackDirectToMovie(movieUrl) {
    await attachSourceToVideo(movieUrl);
  }
  
  async function attachSourceToVideo(url) {
    const isM3u8 = /\.m3u8($|\?)/i.test(url);
    if (isM3u8) {
      if (!window.Hls) {
        await new Promise(res => {
          const s = document.createElement("script");
          s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.4.0/dist/hls.min.js";
          s.onload = res;
          document.head.appendChild(s);
        });
      }
      if (window.Hls && window.Hls.isSupported()) {
        const h = new Hls();
        h.loadSource(url);
        h.attachMedia(video);
      } else video.src = url;
    } else video.src = url;
  }
  
  fallbackDirectToMovie(src);

  /********** D1 CLOUDFLARE TRACKER SYSTEM CONFIG **********/
  const CONFIG = {
    API_BASE_URL: "https://rinolski.misty-fog-201e.workers.dev",
    AUTH_TOKEN: localStorage.getItem("session_token") || ""
  };

  let isResuming = true; 
  let lastSavedTime = 0;
  let serverTimestamp = null; 

  function getSavePayload(overrideKey = null, overrideLeft = null) {
    const targetKey = overrideKey || params.get("ep") || movieParamId;
    return {
      movieId: targetKey,
      movieTitle: activeMovieTitle,
      left: overrideLeft !== null ? overrideLeft : video.currentTime,
      duration: video.duration || 100
    };
  }

  function saveWatchProgress(isBeacon = false, overrideKey = null, overrideLeft = null) {
    if (!CONFIG.AUTH_TOKEN || !video.duration && overrideLeft === null) return;
    if (overrideLeft === null && (video.currentTime < 3)) return;

    const payload = JSON.stringify(getSavePayload(overrideKey, overrideLeft));

    if (isBeacon && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${CONFIG.API_BASE_URL}/api/save-progress?token=${encodeURIComponent(CONFIG.AUTH_TOKEN)}`, blob);
      return;
    }

    return fetch(`${CONFIG.API_BASE_URL}/api/save-progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.AUTH_TOKEN}`
      },
      body: payload,
      keepalive: true
    }).catch(err => console.error("Failed to save progress:", err));
  }

  window.addEventListener("pagehide", () => saveWatchProgress(true));
  window.addEventListener("beforeunload", () => saveWatchProgress(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveWatchProgress(false);
  });

  const rewindBtn = document.getElementById("rewindBtn");
  const playPauseBtn = document.getElementById("playPauseBtn");
  const skipBtn = document.getElementById("skipBtn");
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  let controlsVisible = false, hideTimer, isDragging = false;

  const formatTime = (seconds) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2,'0')}`;
  };

  const showControls = (timeout = 3000) => {
    root.classList.add("show-ui");
    for (const el of [controls, progressContainer, backToPrev, downloadBtn, timerDisplay, ccBtn]) {
      el.style.opacity = "1"; el.style.visibility = "visible";
    }
    nextEpOverlay.style.opacity = "1";
    nextEpOverlay.style.visibility = "visible";
    nextEpOverlay.classList.add("show-controls");
    controlsVisible = true;
    clearTimeout(hideTimer);
    if (timeout > 0 && !isDragging) hideTimer = setTimeout(hideControls, timeout);
  };

  const hideControls = () => {
    if (isDragging) return;
    root.classList.remove("show-ui");
    for (const el of [controls, progressContainer, backToPrev, downloadBtn, backBtn, nextBtn, timerDisplay, ccBtn]) {
      el.style.opacity = "0"; el.style.visibility = "hidden";
    }
    nextEpOverlay.style.opacity = "0";
    nextEpOverlay.style.visibility = "hidden";
    nextEpOverlay.classList.remove("show-controls");
    controlsVisible = false;
  };

  // --- Next Episode & Watch Credits Logic (Cloudflare Sync Only) ---
  let countdownInterval = null;
  let isTimerRunning = false;
  let creditsCancelled = false;
  const timerFill = document.getElementById("timerFill");

  function getNextEpisodeTargetKey() {
    const currentEpParam = params.get("ep") || "1";
    const match = currentEpParam.match(/^(.*-S\d+E)(\d+)$/i);
    if (match) {
      const prefix = match[1];
      const nextEpNum = parseInt(match[2], 10) + 1;
      return `${prefix}${nextEpNum}`;
    } else {
      const numericEp = parseInt(currentEpParam, 10);
      if (!isNaN(numericEp)) {
        return String(numericEp + 1);
      }
    }
    return null;
  }

  async function triggerNextEpisodeAction() {
    const nextKey = getNextEpisodeTargetKey();
    if (nextKey) {
      // Forcefully send progress update to Cloudflare for the next episode before navigating
      if (CONFIG.AUTH_TOKEN) {
        try {
          await saveWatchProgress(false, nextKey, 1); // Save start position of next episode to Cloudflare D1
        } catch (e) {
          console.error("Cloudflare sync failed on auto-next:", e);
        }
      }
      location.replace(`videoplayer.html?ep=${nextKey}`);
    }
  }

  function startTenSecAutoNextTimer() {
    if (isTimerRunning || creditsCancelled) return;
    isTimerRunning = true;

    let timeLeft = 10;
    const intervalMs = 100;
    const totalSteps = (timeLeft * 1000) / intervalMs;
    let currentStep = 0;

    countdownInterval = setInterval(() => {
      currentStep++;
      const percentage = (currentStep / totalSteps) * 100;
      timerFill.style.width = `${Math.min(percentage, 100)}%`;

      if (currentStep >= totalSteps) {
        clearInterval(countdownInterval);
        triggerNextEpisodeAction();
      }
    }, intervalMs);
  }

  watchCreditsBtn.onclick = (e) => {
    e.stopPropagation();
    if (countdownInterval) clearInterval(countdownInterval);
    isTimerRunning = false;
    creditsCancelled = true;
    timerFill.style.width = "0%";
    watchCreditsBtn.style.display = "none";
    nextEpOverlay.classList.remove("near-end");
  };

  nextEpTimerBtn.onclick = (e) => {
    e.stopPropagation();
    triggerNextEpisodeAction();
  };

  video.addEventListener("timeupdate", () => {
    if (isFinite(video.duration) && !isDragging && !isResuming) {
      progressBar.style.width = (video.currentTime / video.duration) * 100 + "%";
      timerDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
      
      const timeRemaining = video.duration - video.currentTime;
      if (timeRemaining <= 120 && timeRemaining > 0 && !creditsCancelled) {
        watchCreditsBtn.style.display = "block";
        nextEpOverlay.classList.add("near-end");
        if (!isTimerRunning) startTenSecAutoNextTimer();
      }

      if (Math.abs(video.currentTime - lastSavedTime) >= 5) {
        saveWatchProgress(false);
      }
    }
  });

  video.addEventListener("loadedmetadata", async () => {
    if (serverTimestamp && serverTimestamp < video.duration - 15) {
      video.currentTime = serverTimestamp;
      lastSavedTime = serverTimestamp;
    }
    isResuming = false;
    try { await video.play(); } catch { video.pause(); showControls(5000); }
  });

  const targetMovieParamId = params.get("ep") || movieParamId;
  (async function fetchSavedProgress() {
    if (CONFIG.AUTH_TOKEN) {
      try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/api/get-progress`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${CONFIG.AUTH_TOKEN}` }
        });
        if (response.ok) {
          const data = await response.json();
          const progressMap = data.progress || {};
          if (progressMap[targetMovieParamId]) {
            serverTimestamp = parseFloat(progressMap[targetMovieParamId].left);
          }
        }
      } catch (err) { console.error(err); }
    }
  })();

  function rotateIfPortrait() {
    const isPortrait = window.innerHeight > window.innerWidth;
    const vw = window.innerWidth, vh = window.innerHeight;
    if (isPortrait) {
      root.style.position = "fixed";
      root.style.top = "50%"; root.style.left = "50%";
      root.style.transform = `translate(-50%, -50%) rotate(90deg)`;
      root.style.transformOrigin = "center center";
      root.style.width = `${vh}px`; root.style.height = `${vw}px`;
    } else {
      root.style.position = "fixed";
      root.style.top = "0"; root.style.left = "0";
      root.style.transform = "none";
      root.style.width = "100%"; root.style.height = "100%";
    }
  }
  rotateIfPortrait();
  window.addEventListener("resize", rotateIfPortrait);
  root.addEventListener("click", () => { if(!isDragging) controlsVisible ? hideControls() : showControls(); });
});
