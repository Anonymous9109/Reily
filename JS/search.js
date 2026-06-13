const movies = [
  { title: "The Hangover", genres: ["Action", "Comedy"], image: "images/TheHangover.jpg", link: "Movies/Movie?movie=the-hangover" },  
  { title: "Rush Hour ", genres: ["Action", "Comedy"], image: "images/RushHour.jpg", link: "Movies/Movie?movie=rush-hour" },  
  { title: "It ", genres: ["Action", "Horror"], image: "images/IT.jpg", link: "Movies/Movie?movie=it" },

  {
    title: "SAW",
    genres: ["Horror", "Crime"],
    image: "images/SAW.jpg",
    link: "Movies/Movie?movie=SAW"
  },
  {
    title: "Fast & Furious",
    genres: ["Action", "Crime"],
    image: "images/FastFurious2009.jpg",
    link: "Movies/Movie?movie=fast-and-furious-2009"
  },

  {
    title: "Good fortune",
    genres: ["Action","Comedy"],
    image: "images/good-fortune.jpg",
    link: "Movies/Movie?movie=good-fortune" },
  {
    title: "The Conjuring",
    genres: ["Horror", "Thriller"],
    image: "images/the-conjuring.jpg",
    link: "Movies/Movie?movie=the-conjuring"
  },

  {
    title: "The Fast And The Furious",
    genres: ["Action", "Crime"],
    image: "images/TheFastAndTheFurious.jpg",
    link: "Movies/Movie?movie=the-fast-and-the-furious"
  },
    {
    title: "Ride Along",
    genres: ["Action", "Comedy"],
    image: "images/RideAlong.jpg",
    link: "Movies/Movie?movie=RideAlong"
  },
  {
    title: "John Wick",
    genres: ["Action", "Thriller"],
    image: "images/JohnWick.jpg",
    link: "Movies/Movie?movie=john-wick-1"
  },
    {
    title: "2 Broke Girls",
    genres: ["Sitcom", "Comedy"],
    image: "images/2BrokeGirls.jpg",
    link: "Series/series?series=2BrokeGirls"
  },
  {
    title: "John Wick 2 ",
    genres: ["Action", "Thriller"],
    image: "images/JohnWick2.jpg",
    link: "Movies/Movie?movie=john-wick-2"
  },
  {
    title: "John Wick 3 ",
    genres: ["Action", "Thriller"],
    image: "images/JohnWick3.jpg",
    link: "Movies/Movie?movie=john-wick-3"
  },
  {
    title: "John Wick 4 ",
    genres: ["Action", "Thriller"],
    image: "images/JohnWick4.jpg",
    link: "Movies/Movie?movie=john-wick-4"
  },
  {
    title: "Catch Me If You Can",
    genres: ["Biography", "Crime", "Drama"],
    image: "images/CatchMeIfYouCan.jpg",
    link: "Movies/Movie?movie=catch-me-if-you-can"
  },
  {
    title: "Barbie",
    genres: ["Comedy", "Adventure"],
    image: "images/Barbie.jpg",
    link: "Movies/Movie?movie=barbie"
  },
  {
    title: "The Social Network",
    genres: ["Drama", "Biography"],
    image: "images/TheSocialNetwork.jpg",
    link: "Movies/Movie?movie=the-social-network"
  },

  {
    title: "The Blind Side",
    genres: ["Drama", "Biography"],
    image: "images/TheBlindSide.jpg",
    link: "Movies/Movie?movie=the-blind-side"
  },
  {
    title: "The Fast and the Furious: Tokyo Drift",
    genres: ["Action", "Crime", "Thriller"],
    image: "images/TokyoDrift.jpg",
    link: "Movies/Movie?movie=tokyo-drift"
  },
  {
    title: "Terrifier",
    genres: ["Horror", "Thriller"],
    image: "images/Terrifier.jpg",
    link: "Movies/Movie?movie=terrifier"
  },
  {
    title: "The Pursuit of Happyness",
    genres: ["Biography", "Drama"],
    image: "images/ThePursuitofHappyness.webp",
    link: "Movies/Movie?movie=the-pursuit-of-happyness"
  },
  {
    title: "500 Days of Summer",
    genres: ["Romance", "Comedy", "Drama"],
    image: "images/500DaysOfSummer.jpg",
    link: "Movies/Movie?movie=500daysofsummer"
  },
  {
    title: "The idea of you",
    genres: ["Romance", "Comedy", "Drama"],
    image: "images/TheIdeaOfYou.jpg",
    link: "Movies/Movie?movie=TheIdeaOfYou"
  },
  {
    title: "The Maze Runner",
    genres: ["Action", "Sci-Fi", "Adventure"],
    image: "images/TheMazeRunner.jpg",
    link: "Movies/Movie?movie=TheMazeRunner"
  },
  {
    title: "The Rebound",
    genres: ["Romance", "Comedy", "Drama"],
    image: "images/TheRebound.jpg",
    link: "Movies/Movie?movie=TheRebound"
  },
  {
    title: "The Perfect Find",
    genres: ["Romance", "Comedy", "Drama"],
    image: "images/ThePerfectFind.jpg",
    link: "Movies/Movie?movie=ThePerfectFind"
  },
  {
    title: "Bridge to Terabithia",
    genres: ["Adventure", "Drama", "Family"],
    image: "images/BridgetoTerabithia.jpg",
    link: "Movies/Movie?movie=BridgetoTerabithia"
  },
  {
    title: "Five Feet Apart",
    genres: ["Romance", "Drama"],
    image: "images/FiveFeetApart.jpg",
    link: "Movies/Movie?movie=FiveFeetApart"
  },
  {
    title: "Anyone But You",
    genres: ["Romance", "Comedy"],
    image: "images/AnyonebutYou.jpg",
    link: "Movies/Movie?movie=AnyonebutYou"
  },
  {
    title: "Jeepers Creepers",
    genres: [ "Horror"],
    image: "images/JeepersCreepers.jpg",
    link: "Movies/Movie?movie=JeepersCreepers"
  },
  {
    title: "Long Shot",
    genres: ["Comedy", "Romance"],
    image: "images/LongShot.jpg",
    link: "Movies/Movie?movie=LongShot"
  },
  {
    title: "Everything Everything",
    genres: ["Drama", "Romance"],
    image: "images/EverythingEverything.jpg",
    link: "Movies/Movie?movie=EverythingEverything"
  },
  {
    title: "The Book of Eli",
    genres: ["Action", "Drama"],
    image: "images/TheBookofEli.jpg",
    link: "Movies/Movie?movie=TheBookofEli"
  },
  {
    title: "Eli",
    genres: ["Horror","Drama"],
    image: "images/Eli.jpg",
    link: "Movies/Movie?movie=Eli"
  },
  {
    title: "Inside Out",
    genres: ["Animation", "Family", "Comedy", "Drama"],
    image: "images/InsideOut.jpg",
    link: "Movies/Movie?movie=InsideOut"
  },
  {
    title: "From",
    genres: ["Action", "Horror", "Drama"],
    image: "images/From.jpg",
    link: "Series/series?series=From"
  },
  {
    title: "Man on Fire",
    genres: ["Action", "Crime", "Drama","Thriller"],
    image: "images/ManonFire.jpg",
    link: "Series/series?series=ManonFire"
  },
  {
    title: "AlRawabi School for Girls",
    genres: ["Action", "Drama"],
    image: "images/AlrawabiSchoolforGirls.jpg",
    link: "Series/series?series=AlRawabiSchoolforGirls"
  },
  {
    title: "Big Mistakes",
    genres: ["Action", "Crime"],
    image: "images/BigMistakes.jpg",
    link: "Series/series?series=BigMistakes"
  },
  {
    title: "Margo's Got Money Troubles",
    genres: ["Comedy", "Drama"],
    image: "images/MargosGotMoneyTroubles.jpg",
    link: "Series/series?series=MargosGotMoneyTroubles"
  },
  {
    title: "Re:zero Kara Hajimeru Isekai Seikatsu 4th Season",
    genres: ["Anime","Drama"],
    image: "images/RezeroKaraHajimeru IsekaiSeikatsu.jpg",
    link: "Series/series?series=RezeroKaraHajimeruIsekaiSeikatsu"
  },
  {
    title: "Beef",
    genres: ["Comedy", "Drama"],
    image: "images/Beef.jpg",
    link: "Series/series?series=Beef"
  },
  {
    title: "Trust Me The False Prophet",
    genres: ["Documentary", "Drama"],
    image: "images/TrustMeTheFalseProphet.jpg",
    link: "Series/series?series=TrustMeTheFalseProphet"
  },
  {
    title: "The Pitt",
    genres: ["Drama"],
    image: "images/ThePitt.jpg",
    link: "Series/series?series=ThePitt"
  },
  {
    title: "Breaking Bad",
    genres: ["Drama"],
    image: "images/BreakingBad.jpg",
    link: "Series/series?series=BreakingBad"
  },
  {
    title: "Adventure Time",
    genres: ["Drama","Animation","Adventure"],
    image: "images/AdventureTime.jpg",
    link: "Series/series?series=AdventureTime"
  },
  {
    title: "Regular Show",
    genres: ["Drama","Animation","Adventure"],
    image: "images/RegularShow.jpg",
    link: "Series/series?series=RegularShow"
  },
  {
    title: "Regular Show: The Lost Tapes",
    genres: ["Drama","Animation","Adventure"],
    image: "images/RegularShowLostTapes.jpg",
    link: "Series/series?series=RegularShowLostTapes"
  },
  {
    title: "Adventure Time: Fionna and Cake",
    genres: ["Drama","Animation","Adventure"],
    image: "images/AdventureTimeFionnaandCake.jpg",
    link: "Series/series?series=AdventureTimeFionnaandCake"
  },
  {
    title: "The Boys",
    genres: ["Drama","Sci-Fi","Crime","Comedy","Action"],
    image: "images/TheBoys.jpg",
    link: "Series/series?series=TheBoys"
  },
  {
    title: "Unchosen",
    genres: ["Drama","psychological thriller"],
    image: "images/Unchosen.jpg",
    link: "Series/series?series=Unchosen"
  },
  {
    title: "invincible",
    genres: ["Action","Animation"],
    image: "images/invincible.jpg",
    link: "Series/series?series=Invincible"
  },
  {
    title: "Widow's Bay",
    genres: ["Horror","Comedy"],
    image: "images/WidowsBay.jpg",
    link: "Series/series?series=WidowsBay"
  },
  {
    title: "MOB PSYCHO 100",
    genres: ["Action","Comedy","Anime"],
    image: "images/MOBPSYCHO100.jpg",
    link: "Series/series?series=MOBPSYCHO100"
  },
  {
    title: "Virgin Territory",
    genres: ["Comedy", "Adventure"],
    image: "images/VirginTerritory.jpg",
    link: "Movies/Movie?movie=Virgin-Territory"
  },
  {
    title: "Michael",
    genres: ["Musical","Music"],
    image: "images/Michael.jpg",
    link: "Movies/Movie?movie=Michael"
  },
  {
    title: "Apex",
    genres: ["Action"],
    image: "images/Apex.jpg",
    link: "Movies/Movie?movie=Apex"
  },
  {
    title: "Escape from Alcatraz",
    genres: ["Thriller", "Action"],
    image: "images/EscapefromAlcatraz.jpg",
    link: "Movies/Movie?movie=EscapefromAlcatraz"
  },
  { title: "Diary of a Wimpy Kid: Rodrick Rules", genres: ["Comedy", "Family"], image: "images/DiaryofAWimpyKidRodrickRules.jpg", link: "Movies/Movie?movie=DiaryofAWimpyKidRodrickRules" },
  { title: "Diary of a Wimpy Kid: The Long Haul", genres: ["Comedy", "Family"], image: "images/DiaryOfAWimpyKidTheLongHaul.jpg", link: "Movies/Movie?movie=DiaryOfAWimpyKidTheLongHaul" },
  { title: "Diary of a Wimpy Kid", genres: ["Comedy", "Family"], image: "images/DiaryOfAWimpyKid.jpg", link: "Movies/Movie?movie=DiaryOfAWimpyKid" },
];

// Convert Arabic characters to English-sound equivalents
function arabicToEnglish(str) {
  const map = {
    "ÃÂÃÂ§":"a","ÃÂÃÂ£":"a","ÃÂÃÂ¥":"e","ÃÂÃÂ¢":"aa",
    "ÃÂÃÂ¨":"b","ÃÂÃÂª":"t","ÃÂÃÂ«":"th","ÃÂÃÂ¬":"j","ÃÂÃÂ­":"h","ÃÂÃÂ®":"kh",
    "ÃÂÃÂ¯":"d","ÃÂÃÂ°":"th","ÃÂÃÂ±":"r","ÃÂÃÂ²":"z","ÃÂÃÂ³":"s","ÃÂÃÂ´":"sh",
    "ÃÂÃÂµ":"s","ÃÂÃÂ¶":"d","ÃÂÃÂ·":"t","ÃÂÃÂ¸":"th","ÃÂÃÂ¹":"a","ÃÂÃÂº":"gh",
    "ÃÂÃÂ":"f","ÃÂÃÂ":"q","ÃÂÃÂ":"k","ÃÂÃÂ":"l","ÃÂÃÂ":"m","ÃÂÃÂ":"n",
    "ÃÂÃÂ":"h","ÃÂÃÂ":"w","ÃÂÃÂ":"y",
    "ÃÂÃÂ©":"h","ÃÂÃÂ":"a"
  };
  return str.split("").map(ch => map[ch] || ch).join("");
}

// Shuffle function (Fisher-Yates) - returns a shuffled copy or shuffles in place safely
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function searchMovies() {
  const searchInputEl = document.getElementById("searchInput");
  if (!searchInputEl) return;

  const rawInput = searchInputEl.value.toLowerCase();
  const searchTerm = arabicToEnglish(rawInput); // Arabic ÃÂ¢ÃÂÃÂ English matching

  const filteredMovies = movies.filter(movie =>  
    movie.title.toLowerCase().includes(searchTerm) ||  
    movie.genres.some(genre => genre.toLowerCase().includes(searchTerm))  
  );  

  const initialSections = document.getElementById("initialSections");  
  const searchResults = document.getElementById("searchResults");  

  if (rawInput) {  
    initialSections.style.display = "none";  
    searchResults.style.display = "block";  
  } else {  
    initialSections.style.display = "block";  
    searchResults.style.display = "none";  
    return; // Stop execution early if input is empty
  }  

  const moviesByGenre = {};  
  filteredMovies.forEach(movie => {  
    movie.genres.forEach(genre => {  
      if (!moviesByGenre[genre]) moviesByGenre[genre] = [];  
      moviesByGenre[genre].push(movie);  
    });  
  });  

  searchResults.innerHTML = "";  

  for (const genre in moviesByGenre) {  
    // FIX: Using the spread operator [...] creates a separate array instance to prevent mutating the original database
    const randomizedMovies = shuffleArray([...moviesByGenre[genre]]);  

    const genreSection = document.createElement("div");  
    genreSection.className = "section";  
    genreSection.innerHTML = `  
      <h2 class="section-title">${genre}</h2>  
      <div class="movie-section">  
        ${randomizedMovies.map(movie => `  
          <div class="movie-item">  
            <a href="${movie.link}">  
              <img src="${movie.image}" alt="${movie.title}" class="${movie.image ? '' : 'no-image'}">  
            </a>  
          </div>  
        `).join('')}  
      </div>  
    `;  
    searchResults.appendChild(genreSection);  
}

}
