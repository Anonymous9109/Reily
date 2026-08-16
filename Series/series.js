/**
 * Global Series & Data Definitions
 */
window.seriesData = {
  "steven-universe": {
    id: "steven-universe",
    title: "Steven Universe",
    description: "A young boy named Steven Universe lives with the Crystal Gems—magical humanoid aliens—and helps protect the universe from threats.",
    poster: "https://via.placeholder.com/400x600/111827/ffffff?text=Steven+Universe",
    banner: "https://via.placeholder.com/1280x720/1f2937/ffffff?text=Steven+Universe+Banner",
    seasons: [
      {
        seasonNumber: 1,
        totalEpisodes: 52,
        // Base stream URL template; replaces {ep} dynamically
        streamUrlTemplate: "https://pub-b29f478625e4425287b674aad515a2ee.r2.dev/Movies/73177607.mp4",
        subtitles: [
          { lang: "en", label: "English", src: "/subs/su_s1_en.vtt" }
        ]
      },
      {
        seasonNumber: 2,
        totalEpisodes: 26,
        streamUrlTemplate: "https://example.com/cdn/steven-universe/s2/ep_{ep}.mp4"
      }
    ]
  }
};

/**
 * Helper to fetch a specific episode stream & metadata
 */
window.getEpisodeData = function(seriesId, seasonNum, epNum) {
  const series = window.seriesData[seriesId];
  if (!series) return null;

  const season = series.seasons.find(s => s.seasonNumber === parseInt(seasonNum));
  if (!season || epNum < 1 || epNum > season.totalEpisodes) return null;

  const streamUrl = season.streamUrlTemplate.replace("{ep}", String(epNum).padStart(2, "0"));
  
  return {
    seriesId: series.id,
    seriesTitle: series.title,
    season: season.seasonNumber,
    episode: parseInt(epNum),
    totalEpisodesInSeason: season.totalEpisodes,
    streamUrl: streamUrl,
    subtitles: season.subtitles || []
  };
};
