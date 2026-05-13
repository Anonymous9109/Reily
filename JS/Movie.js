// ======================
// VIDEO + CONTROLS
// ======================
const video = document.querySelector('#video');
const playPauseButton = document.querySelector('#play-pause');
const playIcon = document.querySelector('#play-icon');
const pauseIcon = document.querySelector('#pause-icon');
const progressBar = document.querySelector('#progress-bar');
const customControls = document.querySelector('#custom-controls');
const videoContainer = document.querySelector('#video-container');

let controlsVisible = false;
let hideControlsTimeout;

// Start video muted
video.muted = true;
video.volume = 1;

// Try autoplay
video.play().catch(() => {
    // Autoplay blocked — pause and show overlay
    video.pause();
    showTapToPlayOverlay();
});

// ======================
// TAP TO PLAY WITH SOUND OVERLAY
// ======================
function showTapToPlayOverlay() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'tap-to-play-overlay';
    overlay.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        font-size: 24px;
        font-weight: bold;
        z-index: 9999;
        cursor: pointer;
        text-align: center;
    `;
    overlay.textContent = "Tap to play with sound";
    videoContainer.appendChild(overlay);

    overlay.addEventListener('click', () => {
        video.muted = false;
        video.volume = 1;
        video.play();
        overlay.remove();
    });
}

// ======================
// CONTROLS
// ======================
function showControls() {
    customControls.classList.add('visible');
    controlsVisible = true;

    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => {
        customControls.classList.remove('visible');
        controlsVisible = false;
    }, 3000);
}

// Play / Pause button
playPauseButton.addEventListener('click', () => {
    video.muted = false;
    video.volume = 1;

    if (video.paused) {
        video.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    } else {
        video.pause();
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }

    showControls();
});

// Progress bar
video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const progress = (video.currentTime / video.duration) * 100;
    progressBar.style.width = progress + '%';
});

// Tap video to show controls
videoContainer.addEventListener('click', showControls);

// Initial UI state
pauseIcon.style.display = 'block';
playIcon.style.display = 'none';
customControls.classList.remove('visible');

// ======================
// VISIBILITY AUTOPLAY (IntersectionObserver)
// ======================
document.addEventListener("DOMContentLoaded", () => {
    if (!video) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.5 });

    observer.observe(video);
});