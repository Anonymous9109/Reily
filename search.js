const searchInput = document.querySelector('.search-box input');
const noResults = document.querySelector('.no-results');

// Wait until videos are loaded before searching
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase().trim();
  const videos = document.querySelectorAll('.video');
  let matches = 0;

  videos.forEach(video => {
    const title = video.querySelector('.title').textContent.toLowerCase();
    if (title.includes(query)) {
      video.style.display = '';
      matches++;
    } else {
      video.style.display = 'none';
    }
  });

  noResults.style.display = matches === 0 ? 'block' : 'none';
});