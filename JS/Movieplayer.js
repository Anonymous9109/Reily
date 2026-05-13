document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('videoElement');
  const playPauseButton = document.getElementById('playPauseButton');
  const rewindButton = document.getElementById('rewindButton');
  const skipButton = document.getElementById('skipButton');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const controls = document.querySelector('.controls');
  const backButton = document.querySelector('.back-button');
  const controlsText = document.querySelector('.controls-text');
  const countdownTimer = document.getElementById('countdownTimer');

  let controlsVisible = false;
  let idleTimer;

  video.addEventListener('playing', () => {
    video.style.visibility = 'visible';
    video.style.opacity = '1';
  });

  function showControls() {
    controls.style.opacity = 1;
    controls.style.visibility = 'visible';
    backButton.style.opacity = 1;
    backButton.style.visibility = 'visible';
    controlsText.style.opacity = 1;
    controlsText.style.visibility = 'visible';
    progressContainer.style.opacity = 1;
    progressContainer.style.visibility = 'visible';
    countdownTimer.style.opacity = 1;
    countdownTimer.style.visibility = 'visible';
    controlsVisible = true;
  }

  function hideControls() {
    controls.style.opacity = 0;
    controls.style.visibility = 'hidden';
    backButton.style.opacity = 0;
    backButton.style.visibility = 'hidden';
    controlsText.style.opacity = 0;
    controlsText.style.visibility = 'hidden';
    progressContainer.style.opacity = 0;
    progressContainer.style.visibility = 'hidden';
    countdownTimer.style.opacity = 0;
    countdownTimer.style.visibility = 'hidden';
    controlsVisible = false;
  }

  function updateCountdownTimer() {
    const remainingTime = video.duration - video.currentTime;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = Math.floor(remainingTime % 60);
    countdownTimer.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  function toggleControls() {
    if (controlsVisible) {
      hideControls();
    } else {
      showControls();
      resetIdleTimer();
    }
  }

  function resetIdleTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(hideControls, 3000);
  }

  playPauseButton.addEventListener('click', () => {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  rewindButton.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 10);
  });

  skipButton.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration, video.currentTime + 10);
  });

  video.addEventListener('timeupdate', () => {
    const percentage = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${percentage}%`;
    updateCountdownTimer();
  });

  progressContainer.addEventListener('click', (e) => {
    const offsetX = e.offsetX;
    const width = progressContainer.offsetWidth;
    video.currentTime = (offsetX / width) * video.duration;
  });

  // Touch detection for controls
  document.addEventListener('touchstart', (e) => {
    if (!e.target.closest('.controls') && !e.target.closest('.back-button')) {
      toggleControls();
    }
  });

  video.addEventListener('play', () => {
    playPauseButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z"/>
      </svg>`;
  });

  video.addEventListener('pause', () => {
    playPauseButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M5 3L19 12L5 21V3Z"/>
      </svg>`;
  });

  backButton.addEventListener('click', () => {
    if (window.backEpisodeLink) location.href = window.backEpisodeLink;
  });

  const loadingRing = document.createElement('div');
  loadingRing.id = 'loadingRing';
  document.body.appendChild(loadingRing);

  function centerLoadingRing() {
    const videoRect = video.getBoundingClientRect();
    loadingRing.style.left = `${videoRect.left + videoRect.width / 2}px`;
    loadingRing.style.top = `${videoRect.top + videoRect.height / 2}px`;
  }

  const showLoadingRing = () => {
    centerLoadingRing();
    loadingRing.style.display = 'block';
  };

  const hideLoadingRing = () => {
    loadingRing.style.display = 'none';
  };

  video.addEventListener('waiting', showLoadingRing);
  video.addEventListener('playing', hideLoadingRing);
  video.addEventListener('pause', () => {
    if (!video.ended) hideLoadingRing();
  });
  video.addEventListener('ended', hideLoadingRing);
  window.addEventListener('resize', centerLoadingRing);
  window.addEventListener('orientationchange', centerLoadingRing);

  // Resume from IndexedDB
  const videoSrc = video.querySelector("source").src;
  const videoKey = "videoProgress_" + encodeURIComponent(videoSrc);
  const request = indexedDB.open("VideoProgressDB", 1);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains("progress")) {
      db.createObjectStore("progress", { keyPath: "videoKey" });
    }
  };

  request.onsuccess = (event) => {
    const db = event.target.result;
    const transaction = db.transaction("progress", "readonly");
    const store = transaction.objectStore("progress");
    const getRequest = store.get(videoKey);

    getRequest.onsuccess = () => {
      if (getRequest.result && !isNaN(getRequest.result.time)) {
        video.currentTime = parseFloat(getRequest.result.time);
      }
    };

    video.addEventListener("timeupdate", () => {
      const saveTransaction = db.transaction("progress", "readwrite");
      const saveStore = saveTransaction.objectStore("progress");
      saveStore.put({ videoKey, time: video.currentTime });
    });

    video.addEventListener("ended", () => {
      const deleteTransaction = db.transaction("progress", "readwrite");
      const deleteStore = deleteTransaction.objectStore("progress");
      deleteStore.delete(videoKey);
    });
  };

  request.onerror = () => {
    console.error("Error opening IndexedDB.");
  };

  // Early video load and autoplay fallback
  video.load();
  video.muted = false;
  video.play().catch(() => {
    video.muted = true;
    video.play();
  });

  hideControls();
});