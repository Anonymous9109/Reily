(function () {
  const params = new URLSearchParams(window.location.search);
  const seriesId = params.get("id");
  const seasonNum = parseInt(params.get("season") || "1");
  const epNum = parseInt(params.get("ep") || "1");

  if (!seriesId || !window.getEpisodeData) return;

  const currentEp = window.getEpisodeData(seriesId, seasonNum, epNum);
  if (!currentEp) return;

  // Set page title for player.js progress display
  document.title = `${currentEp.seriesTitle} - S${currentEp.season}E${currentEp.episode}`;

  // Populate global window variables required by player.js
  window.videoData = {
    [currentEp.episode]: currentEp.streamUrl,
    [`${currentEp.episode}-subs`]: currentEp.subtitles
  };

  // Next / Previous Episode Routing
  if (currentEp.episode > 1) {
    window.backEpisodeLink = `player.html?id=${seriesId}&season=${seasonNum}&ep=${currentEp.episode - 1}`;
  }

  if (currentEp.episode < currentEp.totalEpisodesInSeason) {
    window.nextEpisodeLink = `player.html?id=${seriesId}&season=${seasonNum}&ep=${currentEp.episode + 1}`;
  }
})();
