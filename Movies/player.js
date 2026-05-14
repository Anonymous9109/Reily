/* Cyrene Player - Fixed Blank Screen Edition */
document.addEventListener("DOMContentLoaded", async () => {
  // 1. IMMEDIATE UI RENDER (Prevents blank screen)
  const css = `
    body { margin:0; background:#000; height:100vh; overflow:hidden; display:flex; align-items:center; justify-content:center; }
    #videoPlayer{ position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:#000; }
    video{ width:100%; height:100%; object-fit:contain; background:#000; opacity:0; transition:opacity .28s ease; }
    #loadingRing{ position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:52px; height:52px; border-radius:50%; border:6px solid rgba(255,0,0,0.25); border-top:6px solid red; animation:spin 1s linear infinite; z-index:60; }
    @keyframes spin { from{transform:translate(-50%,-50%) rotate(0deg);} to{transform:translate(-50%,-50%) rotate(360deg);} }
    /* ... rest of your original CSS ... */
    #subDisplay { position: absolute; bottom: 8%; left: 10%; right: 10%; text-align: center; z-index: 25; pointer-events: none; font-family: sans-serif; display: flex; justify-content: center; }
    .controls { position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); display:flex; gap:90px; align-items:center; z-index:30; opacity:0; visibility:hidden; transition:opacity .2s; }
    .controls button { width:100px; height:100px; background:transparent; border:none; cursor:pointer; }
    .controls svg { height:54px; width:54px; fill:#fff; }
    #backToPrev { position:absolute; top:14px; left:14px; width:46px; height:46px; border:none; border-radius:50%; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:40; opacity:0; }
    .progress-container { position:absolute; bottom:60px; left:5%; right:5%; height:20px; display:flex; align-items:center; cursor:pointer; z-index:25; opacity:0; }
    .progress-bg { width:100%; height:7px; background:rgba(255,255,255,0.2); border-radius:4px; position:relative; }
    .progress-bar { width:0%; height:100%; background:red; border-radius:4px; }
    .video-timer { position: absolute; bottom: 85px; left: 5%; color: #fff; font-family: sans-serif; font-size: 14px; opacity: 0; }
  `;
  const styleTag = document.createElement("style");
  styleTag.textContent = css;
  document.head.appendChild(styleTag);

  // 2. CONSTRUCT DOM IMMEDIATELY
  const root = document.createElement("div"); root.id = "videoPlayer";
  const video = document.createElement("video"); video.id = "videoElement";
  video.playsInline = true; video.crossOrigin = "anonymous";
  const loadingRing = document.createElement("div"); loadingRing.id = "loadingRing";
  const subDisplay = document.createElement("div"); subDisplay.id = "subDisplay";
  const timerDisplay = document.createElement("div"); timerDisplay.className = "video-timer";
  const backToPrev = document.createElement("button"); backToPrev.id = "backToPrev";
  backToPrev.innerHTML = `<svg viewBox="0 0 24 24"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="white"/></svg>`;
  
  const controls = document.createElement("div"); controls.className = "controls";
  controls.innerHTML = `
    <button id="rewindBtn"><svg viewBox="0 0 24 24"><path d="M12.5 10c-1 0-1.8.4-2.2 1.1-.4.7-.5 1.5-.5 2.4s.1 1.7.5 2.4c.4.7 1.2 1.1 2.2 1.1s1.8-.4 2.2-1.1c.4-.7.5-1.5.5-2.4s-.1-1.7-.5-2.4c-.4-.7-1.2-1.1-2.2-1.1zm-.5 3.5c0-.8.1-1.4.3-1.8.2-.4.5-.6 1-.6s.8.2 1 .6c.2.4.3 1 .3 1.8s-.1 1.4-.3 1.8c-.2.4-.5.6-1 .6s-.8-.2-1-.6c-.2-.4-.3-1-.3-1.8z" fill="white"/><path d="M7.5 10.1l-1.5 1v1l.7-.5v5.4h1v-6.9z" fill="white"/><path d="M13 3c-5 0-9.2 3.7-9.9 8.5H1l3.9 3.9 3.9-3.9H5.1c.6-3.1 3.4-5.5 6.7-5.5 3.8 0 7 3.1 7 7s-3.2 7-7 7c-1.8 0-3.4-.7-4.6-1.8l-1.4 1.4C7.3 19.1 9.5 20 12 20c4.4 0 8-3.6 8-8s-3.6-8-8-8z" fill="white"/></svg></button>
    <button id="playPauseBtn"><svg id="playIcon" viewBox="0 0 24 24"><path d="M6 4.359c0-.938 1.013-1.523 1.825-1.054l13.088 7.556a1.218 1.218 0 0 1 0 2.108l-13.088 7.556c-.812.469-1.825-.116-1.825-1.054V4.359Z" fill="white"/></svg></button>
    <button id="skipBtn"><svg viewBox="0 0 24 24"><path d="M12.5 10c-1 0-1.8.4-2.2 1.1-.4.7-.5 1.5-.5 2.4s.1 1.7.5 2.4c.4.7 1.2 1.1 2.2 1.1s1.8-.4 2.2-1.1c.4-.7.5-1.5.5-2.4s-.1-1.7-.5-2.4c-.4-.7-1.2-1.1-2.2-1.1zm-.5 3.5c0-.8.1-1.4.3-1.8.2-.4.5-.6 1-.6s.8.2 1 .6c.2.4.3 1 .3 1.8s-.1 1.4-.3 1.8c-.2.4-.5.6-1 .6s-.8-.2-1-.6c-.2-.4-.3-1-.3-1.8z" fill="white"/><path d="M7.5 10.1l-1.5 1v1l.7-.5v5.4h1v-6.9z" fill="white"/><path d="M11 3c5 0 9.2 3.7 9.9 8.5H24l-3.9 3.9-3.9-3.9h3.7c-.6-3.1-3.4-5.5-6.7-5.5-3.8 0-7 3.1-7 7s3.2 7 7 7c1.8 0 3.4-.7 4.6-1.8l1.4 1.4c-1.5 1.5-3.7 2.4-6.2 2.4-4.4 0-8-3.6-8-8s3.6-8 8-8z" fill="white"/></svg></button>
  `;

  const progressContainer = document.createElement("div"); progressContainer.className = "progress-container";
  const progressBg = document.createElement("div"); progressBg.className = "progress-bg";
  const progressBar = document.createElement("div"); progressBar.id = "pBar"; progressBar.className = "progress-bar";
  progressBg.appendChild(progressBar); progressContainer.appendChild(progressBg);

  root.append(video, subDisplay, controls, progressContainer, timerDisplay, loadingRing, backToPrev);
  document.body.appendChild(root);

  // 3. SAFE FIRESTORE LOGIC (Only runs if Firebase exists)
  const params = new URLSearchParams(window.location.search);
  const contentId = params.get("id") || window.location.pathname;

  async function saveProgress() {
    if (typeof db === 'undefined' || !video.duration) return;
    const userEmail = window.firebaseUser?.email || (typeof auth !== 'undefined' ? auth.currentUser?.email : null);
    if (!userEmail) return;

    const isWatched = (video.duration - video.currentTime) < 300;
    try {
      // Use dynamic imports or check window for Firestore functions
      const { doc, setDoc, serverTimestamp } = window.FirebaseFirestore || {}; 
      if (!setDoc) return;

      await setDoc(doc(db, "users", userEmail, "watching", contentId), {
        position: isWatched ? 0 : video.currentTime,
        duration: video.duration,
        status: isWatched ? "watched" : "ongoing",
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) { console.error("Save error:", e); }
  }

  async function loadProgress() {
    if (typeof db === 'undefined' || !video.duration) return;
    const userEmail = window.firebaseUser?.email || (typeof auth !== 'undefined' ? auth.currentUser?.email : null);
    if (!userEmail) return;

    try {
      const { doc, getDoc } = window.FirebaseFirestore || {};
      if (!getDoc) return;
      const docSnap = await getDoc(doc(db, "users", userEmail, "watching", contentId));
      if (docSnap.exists() && docSnap.data().status === "ongoing") {
        video.currentTime = docSnap.data().position;
      }
    } catch (e) { console.error("Load error:", e); }
  }

  // 4. PLAYER CONTROLS (Restored Original Logic)
  const playPause = () => {
    if (video.paused) { video.play(); } else { video.pause(); }
    saveProgress();
  };

  playPauseBtn.onclick = (e) => { e.stopPropagation(); playPause(); };
  rewindBtn.onclick = (e) => { e.stopPropagation(); video.currentTime -= 10; };
  skipBtn.onclick = (e) => { e.stopPropagation(); video.currentTime += 10; };
  backToPrev.onclick = () => history.back();

  // 5. VIDEO LOADING
  const ep = params.get("ep") || "1";
  let src = (window.videoData && window.videoData[ep]) ? window.videoData[ep] : decodeURIComponent(params.get("src") || "");
  
  if (src) {
    if (/\.m3u8($|\?)/i.test(src)) {
      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls(); hls.loadSource(src); hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, loadProgress);
      } else { video.src = src; video.onloadedmetadata = loadProgress; }
    } else { video.src = src; video.onloadedmetadata = loadProgress; }
  }

  // UI Updates
  video.addEventListener("timeupdate", () => {
    progressBar.style.width = (video.currentTime / video.duration) * 100 + "%";
    timerDisplay.textContent = `${Math.floor(video.currentTime / 60)}:${Math.floor(video.currentTime % 60).toString().padStart(2, '0')}`;
  });

  video.addEventListener("playing", () => { video.style.opacity = "1"; loadingRing.style.display = "none"; });
  video.addEventListener("waiting", () => { loadingRing.style.display = "block"; });

  // Auto-save
  setInterval(saveProgress, 10000);
  window.addEventListener("beforeunload", saveProgress);
});

