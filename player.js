document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const ep = params.get("ep");
  let videoSrc = null;

  // --- Try from window.videoData ---
  if (window.videoData && ep && window.videoData[ep]) {
    videoSrc = window.videoData[ep];
  }

  // --- Try from ?src= ---
  if (!videoSrc && params.get("src")) {
    videoSrc = decodeURIComponent(params.get("src"));
  }

  // --- Try existing <video> element ---
  let player = document.querySelector("video");
  if (player && !videoSrc) {
    videoSrc = player.querySelector("source")?.src || player.src;
  }

  // --- Handle missing video ---
  if (!videoSrc) {
    const msg = document.createElement("p");
    msg.textContent = "No video found.";
    msg.style.color = "white";
    msg.style.textAlign = "center";
    msg.style.fontFamily = "sans-serif";
    msg.style.marginTop = "20vh";
    document.body.style.background = "black";
    document.body.appendChild(msg);
    return;
  }

  // --- Page layout ---
  document.body.style.margin = "0";
  document.body.style.height = "100vh";
  document.body.style.display = "flex";
  document.body.style.justifyContent = "center";
  document.body.style.alignItems = "center";
  document.body.style.backgroundColor = "black";
  document.body.style.flexDirection = "column";
  document.body.style.position = "relative";

  // --- Create or reuse video ---
  if (!player) {
    player = document.createElement("video");
    player.src = videoSrc;
  }

  player.id = "videoElement";
  player.style.width = "100%";
  player.style.maxWidth = "900px";
  player.style.borderRadius = "12px";
  player.style.backgroundColor = "black";
  player.controls = false;
  player.autoplay = false;
  player.muted = true;

  document.body.appendChild(player);

  // --- Ad container ---
  const adContainer = document.createElement("div");
  adContainer.id = "adContainer";
  adContainer.style.position = "absolute";
  adContainer.style.inset = "0";
  adContainer.style.zIndex = "9999";
  adContainer.style.pointerEvents = "none";
  document.body.appendChild(adContainer);

  // --- Loading spinner ---
  const loadingRing = document.createElement("div");
  loadingRing.style.width = "50px";
  loadingRing.style.height = "50px";
  loadingRing.style.border = "6px solid rgba(255,255,255,0.2)";
  loadingRing.style.borderTop = "6px solid purple";
  loadingRing.style.borderRadius = "50%";
  loadingRing.style.position = "absolute";
  loadingRing.style.top = "50%";
  loadingRing.style.left = "50%";
  loadingRing.style.transform = "translate(-50%, -50%)";
  loadingRing.style.animation = "spin 1s linear infinite";
  loadingRing.style.display = "none";
  document.body.appendChild(loadingRing);

  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin { 
      from { transform: rotate(0deg); } 
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // --- Custom Controls ---
  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.alignItems = "center";
  controls.style.justifyContent = "space-between";
  controls.style.width = "100%";
  controls.style.maxWidth = "900px";
  controls.style.background = "#111";
  controls.style.padding = "10px 15px";
  controls.style.marginTop = "5px";
  controls.style.borderRadius = "0 0 12px 12px";

  const playPauseBtn = document.createElement("button");
  playPauseBtn.style.background = "none";
  playPauseBtn.style.border = "none";
  playPauseBtn.style.cursor = "pointer";
  playPauseBtn.style.outline = "none";

  const playSVG = `<svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>`;
  const pauseSVG = `<svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
  playPauseBtn.innerHTML = playSVG;

  const progress = document.createElement("input");
  progress.type = "range";
  progress.min = 0;
  progress.max = 100;
  progress.value = 0;
  progress.style.width = "100%";
  progress.style.cursor = "pointer";
  progress.style.accentColor = "purple";

  controls.appendChild(playPauseBtn);
  controls.appendChild(progress);
  document.body.appendChild(controls);

  const showLoading = () => (loadingRing.style.display = "block");
  const hideLoading = () => (loadingRing.style.display = "none");

  player.addEventListener("waiting", showLoading);
  player.addEventListener("playing", hideLoading);
  player.addEventListener("canplay", hideLoading);
  player.addEventListener("ended", hideLoading);

  playPauseBtn.addEventListener("click", () => {
    if (player.paused) {
      player.play();
      playPauseBtn.innerHTML = pauseSVG;
      player.muted = false;
    } else {
      player.pause();
      playPauseBtn.innerHTML = playSVG;
    }
  });

  player.addEventListener("timeupdate", () => {
    progress.value = (player.currentTime / player.duration) * 100 || 0;
  });

  progress.addEventListener("input", () => {
    player.currentTime = (progress.value / 100) * player.duration;
  });

  // --- Google IMA SDK integration ---
  const vastTagUrl = "https://welldocumented-interview.com/d/m.FJz/dgGeNjvqZGG/Uq/meYmN9OuYZcUkl/kuPNT/YB2uODTJUg4/NTTAQjtNNMjLYu5/NyTlgQ1lN/S-ZOs/aoWj1dpjd/Dz0/xn";

  let adsLoader, adsManager, adDisplayContainer;
  let adsInitialized = false;

  function initAds() {
    adDisplayContainer = new google.ima.AdDisplayContainer(adContainer, player);
    adDisplayContainer.initialize();
    adsLoader = new google.ima.AdsLoader(adDisplayContainer);

    adsLoader.addEventListener(
      google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
      onAdsManagerLoaded,
      false
    );

    adsLoader.addEventListener(
      google.ima.AdErrorEvent.Type.AD_ERROR,
      onAdError,
      false
    );

    const adsRequest = new google.ima.AdsRequest();
    adsRequest.adTagUrl = vastTagUrl;
    adsRequest.linearAdSlotWidth = player.clientWidth;
    adsRequest.linearAdSlotHeight = player.clientHeight;
    adsRequest.nonLinearAdSlotWidth = player.clientWidth;
    adsRequest.nonLinearAdSlotHeight = player.clientHeight / 3;

    adsLoader.requestAds(adsRequest);
  }

  function onAdsManagerLoaded(adsManagerLoadedEvent) {
    adsManager = adsManagerLoadedEvent.getAdsManager(player);
    try {
      adsManager.init(player.clientWidth, player.clientHeight, google.ima.ViewMode.NORMAL);
      adsManager.start();
    } catch (adError) {
      console.error("Ad playback failed:", adError);
      startMainVideo();
    }
  }

  function onAdError(adErrorEvent) {
    console.error("Ad error:", adErrorEvent.getError());
    if (adsManager) adsManager.destroy();
    startMainVideo();
  }

  function startMainVideo() {
    adContainer.style.display = "none";
    player.play().catch(() => {
      player.muted = true;
      player.play();
    });
  }

  // Start ads when user first interacts
  document.addEventListener("click", () => {
    if (!adsInitialized) {
      adsInitialized = true;
      initAds();
    }
  }, { once: true });
});