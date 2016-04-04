window.addEventListener("load", function common_onready() {
  // Check for appcache updates
  try {
    window.applicationCache.addEventListener('updateready', function updateReady(evt) {
      window.applicationCache.swapCache();
      console.log("Swapped cache");
    });
    window.applicationCache.update();
  } catch (ex) {}

  // setup the game
  Snake.setup();

  updateTweetButton();

  // start the game
  $("a#start-game").click(function startClick(e) {
    e.preventDefault();
    Snake.newGame(true);
  });

  if ("mozApps" in navigator) {
    var request = navigator.mozApps.getSelf();
    request.onsuccess = function() {
      if (request.result) {
        // we're installed
        console.log("Already installed");
      } else {
        // not installed
        console.log("Install the app");
        $('.installed').each(function(i, element) {
          element.classList.remove("installed");
        });
      }
    };
    request.onerror = function() {
      if ("log" in console)
        console.log('Error checking installation status: ' + this.error.message);
    };
  }
});

function install() {
  var request = navigator.mozApps.install(window.location.protocol + "//" + window.location.host + "/snake.webapp");
  request.onsuccess = function() {
    // great - display a message, or redirect to a launch page
    $('#installer').hide();
    $('.notInstalledYet').removeClass('notInstalledYet');
  };
  request.onerror = function() {
    // whoops - this.error.name has details
    console.log(this.error);
  };
}

function updateTweetButton() {
  if (Snake.score)
    $("#tweet-button").data('text', 'I just scored ' + Snake.score + ' points on Slithering. Can you beat my score?');
  var url = "//platform.twitter.com/widgets/tweet_button.html?count=none&dnt=true";
  // fallback to https when developing with file: URIs
  if (window.location.protocol == "file:") {
    url = "https:" + url;
  }
  var data = $("#tweet-button").data();
  for (var i in data) {
    url += "&" + i + "=" + encodeURIComponent(data[i]);
  }
  $("#tweet-button")[0].src = url;
}
