import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCExki28m1NNepVQEIjmcQzR8z8O68LqIc",
  authDomain: "rinolski-notifications.firebaseapp.com",
  databaseURL: "https://rinolski-notifications-default-rtdb.firebaseio.com",
  projectId: "rinolski-notifications",
  storageBucket: "rinolski-notifications.firebasestorage.app",
  messagingSenderId: "355554579853",
  appId: "1:355554579853:web:3caa961653c0cdc0a359c4",
  measurementId: "G-WZ84970GST"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* Cyrene Player (Full Integrated Build) */
document.addEventListener("DOMContentLoaded", async () => {

  /********** 1) Styles **********/
  const css = `
    @font-face { font-family: 'CyreneCustom'; src: url('/fonts/your-font.woff2') format('woff2'); }
    :root { -webkit-tap-highlight-color: transparent; }
    body { margin:0; background:#000; height:100vh; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    #videoPlayer{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:#000; }
    video{ width:100%; height:100%; object-fit:contain; background:#000; opacity:0; transition:opacity .28s ease; }
    video::cue { visibility: hidden !important; }
    #videoPlayer::after {
      content: ""; position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 20%, transparent 50%),
                  linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%);
      z-index: 20; pointer-events: none; opacity: 0; transition: opacity .4s ease;
    }
    #videoPlayer.show-ui::after { opacity: 1; }
    #subDisplay {
      position: absolute; bottom: 8%; left: 10%; right: 10%; text-align: center;
      z-index: 25; pointer-events: none; font-family: 'CyreneCustom', sans-serif;
      transition: bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; justify-content: center;
    }
    #subDisplay span { padding: 0.2em 0.5em; border-radius: 0.2em; line-height: 1.2; color: #fff; font-size: 4.5vmin; }
    #videoPlayer.show-ui #subDisplay { bottom: 20%; }
    .controls { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); display:flex; gap:90px; align-items:center; z-index:30; opacity:0; visibility:hidden; transition:opacity .2s; }  
    .controls button { width:100px; height:100px; border-radius:50%; border:none; background:transparent; display:flex; align-items:center; justify-content:center; cursor:pointer; }
    .controls svg { height:54px; width:54px; fill:#fff; }
    #ccBtn { position: absolute; bottom: 25px; left: 5%; background: none; border: none; z-index: 35; opacity: 0; visibility: hidden; display: none; }
    #ccBtn svg { width:32px; height:32px; fill:#fff; }
    #ccBtn.active svg { fill: red; }
    #sub-menu { position: absolute; bottom: 65px; left: 5%; background: rgba(15, 15, 15, 0.95); border: 1px solid #444; border-radius: 4px; display: none; flex-direction: column; z-index: 50; min-width: 120px; }
    .sub-option { color: white; background: none; border: none; text-align: left; padding: 8px 15px; cursor: pointer; font-size: 13px; }
    .sub-option.active { color: red; font-weight: bold; }
    #backToPrev { position:absolute; top:14px; left:14px; width:46px; height:46px; border:none; border-radius:50%; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:40; opacity:0; visibility:hidden; }  
    #backToPrev svg { width:28px; height:28px; fill:#fff; }  
    .progress-container { position:absolute; bottom:60px; left:5%; right:5%; height:20px; display:flex; align-items:center; cursor:pointer; z-index:25; opacity:0; visibility:hidden; }  
    .progress-bg { width:100%; height:7px; background:rgba(255,255,255,0.2); border-radius:4px; position:relative; }
    .progress-bar { width:0%; height:100%; background:red; border-radius:4px; position:relative; } 
    .progress-bar::after { content: ""; position: absolute; right: -8px; top: 50%; transform: translateY(-50%) scale(0); width: 16px; height: 16px; background: red; border-radius: 50%; transition: transform 0.1s; }
    .progress-container.dragging .progress-bar::after { transform: translateY(-50%) scale(1); }
    .video-timer { position: absolute; bottom: 85px; left: 5%; color: #fff; font-size: 14px; font-weight: 600; z-index: 25; opacity: 0; visibility: hidden; }
    .nav-btn { position:absolute; top:16px; background:transparent; color:#fff; border:none; font-size:22px; cursor:pointer; z-index:30; opacity:0; visibility:hidden; }  
    .back-btn { left:12px; } .next-btn { right:12px; }  
    #loadingRing { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:52px; height:52px; border-radius:50%; border:6px solid rgba(255,0,0,0.25); border-top:6px solid red; animation:spin 1s linear infinite; display:none; z-index:60; }  
    @keyframes spin { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(360deg);} }
  `;
  const styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  /********** 2) DOM **********/
  const root = document.createElement("div"); root.id = "videoPlayer";
  const video = document.createElement("video"); video.id = "videoElement"; video.playsInline = true; video.crossOrigin = "anonymous";
  const subDisplay = document.createElement("div"); subDisplay.id = "subDisplay";
  const loadingRing = document.createElement("div"); loadingRing.id = "loadingRing";
  
  const controls = document.createElement("div");
  controls.className = "controls";
  controls.innerHTML = `
    <button id="rewindBtn"><svg viewBox="0 0 20 20"><path d="M2.99805 3.5C2.99805 3.22386 3.2219 3 3.49805 3C3.77419 3 3.99805 3.22386 3.99805 3.5V5.70632C4.91067 4.67184 6.08199 3.88382 7.40447 3.43107C9.2407 2.80243 11.2429 2.86309 13.0377 3.60171C14.8325 4.34033 16.2974 5.7065 17.1593 7.44549C17.2819 7.69291 17.1808 7.9929 16.9333 8.11552C16.6859 8.23815 16.3859 8.13698 16.2633 7.88956C15.5092 6.36804 14.2275 5.17272 12.6571 4.52646C11.0868 3.88021 9.33496 3.82714 7.72837 4.37716C6.31508 4.861 5.09908 5.78248 4.25184 7H7.49805C7.77419 7 7.99805 7.22386 7.99805 7.5C7.99805 7.77614 7.77419 8 7.49805 8H3.49805C3.2219 8 2.99805 7.77614 2.99805 7.5V3.5ZM8.00005 10.5C8.00005 10.3156 7.89856 10.1462 7.73598 10.0592C7.5734 9.97215 7.37613 9.98169 7.2227 10.084L5.7227 11.084C5.49294 11.2372 5.43085 11.5476 5.58403 11.7774C5.7372 12.0071 6.04764 12.0692 6.2774 11.916L7.00005 11.4343V16.5C7.00005 16.7761 7.22391 17 7.50005 17C7.7762 17 8.00005 16.7761 8.00005 16.5V10.5ZM12.5029 10C11.568 10 10.9058 10.4367 10.5071 11.1292C10.1306 11.7833 10.0029 12.6366 10.0029 13.5C10.0029 14.3634 10.1306 15.2167 10.5071 15.8708C10.9058 16.5633 11.568 17 12.5029 17C13.4379 17 14.1001 16.5633 14.4988 15.8708C14.8753 15.2167 15.0029 14.3634 15.0029 13.5C15.0029 12.6366 14.8753 11.7833 14.4988 11.1292C14.1001 10.4367 13.4379 10 12.5029 10ZM11.0029 13.5C11.0029 12.7065 11.1253 12.0598 11.3738 11.6281C11.6001 11.2349 11.9379 11 12.5029 11C13.068 11 13.4058 11.2349 13.6321 11.6281C13.8806 12.0598 14.0029 12.7065 14.0029 13.5C14.0029 14.2935 13.8806 14.9402 13.6321 15.3719C13.4058 15.7651 13.068 16 12.5029 16C11.9379 16 11.6001 15.7651 11.3738 15.3719C11.1253 14.9402 11.0029 14.2935 11.0029 13.5Z" fill="white"/></svg></button>
    <button id="playPauseBtn">
      <svg id="playIcon" viewBox="0 0 24 24"><path d="M6 4.359c0-.938 1.013-1.523 1.825-1.054l13.088 7.556a1.218 1.218 0 0 1 0 2.108l-13.088 7.556c-.812.469-1.825-.116-1.825-1.054V4.359Z" /></svg>
      <svg id="pauseIcon" style="display:none" viewBox="0 0 24 24"><path d="M5.25 4.5A1.25 1.25 0 0 0 4 5.75v12.5c0 .69.56 1.25 1.25 1.25h3.5c.69 0 1.25-.56 1.25-1.25V5.75c0-.69-.56-1.25-1.25-1.25h-3.5ZM14.25 4.5a1.25 1.25 0 0 0-1.25 1.25v12.5c0 .69.56 1.25 1.25 1.25h3.5c.69 0 1.25-.56 1.25-1.25V5.75c0-.69-.56-1.25-1.25-1.25h-3.5Z" /></svg>
    </button>
    <button id="skipBtn"><svg viewBox="0 0 20 20"><path d="M17 3.5C17 3.22386 16.7761 3 16.5 3C16.2239 3 16 3.22386 16 3.5V5.70245C15.0879 4.66988 13.9178 3.88325 12.597 3.43107C10.7608 2.80243 8.75857 2.86309 6.96376 3.60171C5.16895 4.34033 3.70403 5.7065 2.84215 7.44549C2.71953 7.69291 2.82069 7.9929 3.06812 8.11552C3.31554 8.23815 3.61552 8.13698 3.73815 7.88956C4.49224 6.36804 5.77396 5.17272 7.34432 4.52646C8.91469 3.88021 10.6665 3.82714 12.2731 4.37716C13.6864 4.861 14.9024 5.78248 15.7496 7H12.5C12.2239 7 12 7.22386 12 7.5C12 7.77614 12.2239 8 12.5 8H16.5C16.7761 8 17 7.77614 17 7.5V3.5ZM10.5071 11.1292C10.9058 10.4367 11.568 10 12.5029 10C13.4379 10 14.1001 10.4367 14.4988 11.1292C14.8753 11.7833 15.0029 12.6366 15.0029 13.5C15.0029 14.3634 14.8753 15.2167 14.4988 15.8708C14.1001 16.5633 13.4379 17 12.5029 17C11.568 17 10.9058 16.5633 10.5071 15.8708C10.1306 15.2167 10.0029 14.3634 10.0029 13.5C10.0029 12.6366 10.1306 11.7833 10.5071 11.1292ZM11.3738 11.6281C11.1253 12.0598 11.0029 12.7065 11.0029 13.5C11.0029 14.2935 11.1253 14.9402 11.3738 15.3719C11.6001 15.7651 11.9379 16 12.5029 16C13.068 16 13.4058 15.7651 13.6321 15.3719C13.8806 14.9402 14.0029 14.2935 14.0029 13.5C14.0029 12.7065 13.8806 12.0598 13.6321 11.6281C13.4058 11.2349 13.068 11 12.5029 11C11.9379 11 11.6001 11.2349 11.3738 11.6281ZM8.00005 10.5C8.00005 10.3156 7.89856 10.1462 7.73598 10.0592C7.5734 9.97215 7.37613 9.98169 7.2227 10.084L5.7227 11.084C5.49294 11.2372 5.43085 11.5476 5.58403 11.7774C5.7372 12.0071 6.04764 12.0692 6.2774 11.916L7.00005 11.4343V16.5C7.00005 16.7761 7.22391 17 7.50005 17C7.7762 17 8.00005 16.7761 8.00005 16.5V10.5Z" fill="white"/></svg></button>
  `;

  const ccBtn = document.createElement("button"); ccBtn.id = "ccBtn";
  ccBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z"/></svg>`;

  const subMenu = document.createElement("div"); subMenu.id = "sub-menu";
  const timerDisplay = document.createElement("div"); timerDisplay.className = "video-timer"; timerDisplay.textContent = "0:00 / 0:00";
  const progressContainer = document.createElement("div"); progressContainer.className = "progress-container";
  progressContainer.innerHTML = `<div class="progress-bg"><div id="pBar" class="progress-bar"></div></div>`;
  const backToPrev = document.createElement("button"); backToPrev.id = "backToPrev"; backToPrev.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`;
  backToPrev.onclick = () => history.back();

  root.append(video, subDisplay, controls, progressContainer, timerDisplay, ccBtn, subMenu, loadingRing, backToPrev);
  document.body.appendChild(root);

  /********** 3) Logic **********/
  const params = new URLSearchParams(window.location.search);
  const ep = params.get("ep") || "1";
  const src = (window.videoData && window.videoData[ep]) || decodeURIComponent(params.get("src") || "");

  if (!src) {
    document.body.innerHTML = `<p style="color:white;text-align:center;">No source provided.</p>`;
    return;
  }

  // --- Progress Sync ---
  const videoId = ep ? `ep-${ep}` : btoa(src).substring(0, 10);
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid, "videoProgress", videoId);
    const snap = await getDoc(docRef);
    if (snap.exists()) video.currentTime = snap.data().seconds;
    
    let lastSaved = 0;
    video.addEventListener("timeupdate", async () => {
      const cur = Math.floor(video.currentTime);
      if (cur > 0 && Math.abs(cur - lastSaved) >= 5) {
        lastSaved = cur;
        await setDoc(docRef, { seconds: cur, lastUpdated: serverTimestamp() }, { merge: true });
      }
    });
  });

  // --- Source Loader ---
  const isM3u8 = /\.m3u8/i.test(src);
  if (isM3u8) {
    const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/hls.js@1.4.0";
    s.onload = () => { if(Hls.isSupported()){ const h = new Hls(); h.loadSource(src); h.attachMedia(video); } };
    document.head.appendChild(s);
  } else video.src = src;

  // --- Controls ---
  const playPauseBtn = document.getElementById("playPauseBtn");
  const playIcon = document.getElementById("playIcon");
  const pauseIcon = document.getElementById("pauseIcon");
  const pBar = document.getElementById("pBar");

  const format = (s) => {
    if(!isFinite(s)) return "0:00";
    const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sc = Math.floor(s%60);
    return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sc.toString().padStart(2,'0')}` : `${m}:${sc.toString().padStart(2,'0')}`;
  };

  const show = () => {
    root.classList.add("show-ui");
    [controls, progressContainer, backToPrev, timerDisplay, ccBtn].forEach(el => { el.style.opacity = "1"; el.style.visibility = "visible"; });
    clearTimeout(window.hT); window.hT = setTimeout(hide, 3000);
  };
  const hide = () => {
    root.classList.remove("show-ui");
    [controls, progressContainer, backToPrev, timerDisplay, ccBtn].forEach(el => { el.style.opacity = "0"; el.style.visibility = "hidden"; });
  };

  video.oncanplay = () => { loadingRing.style.display="none"; video.style.opacity="1"; };
  video.onplaying = () => { playIcon.style.display="none"; pauseIcon.style.display="block"; };
  video.onpause = () => { playIcon.style.display="block"; pauseIcon.style.display="none"; };
  video.onwaiting = () => { loadingRing.style.display="block"; };
  video.ontimeupdate = () => {
    pBar.style.width = (video.currentTime / video.duration * 100) + "%";
    timerDisplay.textContent = `${format(video.currentTime)} / ${format(video.duration)}`;
  };

  playPauseBtn.onclick = (e) => { e.stopPropagation(); video.paused ? video.play() : video.pause(); };
  root.onclick = show;

  /********** 4) Portrait Support **********/
  const rotate = () => {
    const isP = window.innerHeight > window.innerWidth;
    if(isP) {
      root.style.transform = "translate(-50%, -50%) rotate(90deg)";
      root.style.width = window.innerHeight + "px"; root.style.height = window.innerWidth + "px";
      root.style.top = "50%"; root.style.left = "50%";
    } else {
      root.style.transform = "none"; root.style.width = "100%"; root.style.height = "100%";
      root.style.top = "0"; root.style.left = "0";
    }
  };
  window.onresize = rotate; rotate();
});
