fetch('videos.json')
.then(response => response.json())
.then(data => {
const grid = document.querySelector('.video-grid');
grid.innerHTML = '';

data.forEach(video => {  
  const div = document.createElement('div');  
  div.className = 'video';  
  div.innerHTML = `  
    <a href="${video.link}">  
      <img src="${video.thumbnail}" alt="${video.title}" class="thumbnail">  
    </a>  
    <div class="title">${video.title}</div>  
  `;  
  grid.appendChild(div);  
});

})
.catch(error => {
console.error('Error loading videos:', error);
});
//

