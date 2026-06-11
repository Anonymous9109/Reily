const params = new URLSearchParams(window.location.search);
const id = params.get("movie");

const movie = movies[id];

if (!movie) {
  document.body.innerHTML = "Movie not found";
}

document.getElementById("title").textContent = movie.title;
document.getElementById("desc").textContent = movie.desc;

const video = document.getElementById("bgVideo");
video.innerHTML = `<source src="${movie.video}" type="video/mp4">`;

function play() {
  window.location.href = `videoplayer?ep=${movie.play}`;
}

function goBack() {
  window.history.back();
}

(function () {
  const style = document.createElement('style');
  style.innerHTML = `
    * {
      -webkit-tap-highlight-color: transparent !important;
      -webkit-touch-callout: none !important;
    }

    button, a {
      outline: none !important;
      border: none;
    }

    button:focus,
    button:focus-visible,
    a:focus,
    a:focus-visible {
      outline: none !important;
    }

    button:active,
    a:active {
      background-color: transparent !important;
    }
  `;
  document.head.appendChild(style);
})();
