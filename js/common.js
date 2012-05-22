/*
 *
 * Filename:	common.js
 * Developer:	Richard Willis
 *
 */

$(function(){
  // setup the game
  Snake.setup();

  updateTweetButton();

  // start the game
  $("a#start-game").click(function(e){
    e.preventDefault();
    Snake.newGame(true);
  });

  var timer = 0;

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
    $('.installer').hide();
    $('.notInstalledYet').removeClass('notInstalledYet');
  };
  request.onerror = function() {
    // whoops - this.error.name has details
    console.log(this.error.name);
  };
}

var verifier = new OWAVerifier();
verifier.verify(function (verifier) {
  if (verifier.error) {
    if (verifier.error.NEED_INSTALL) {
      console.log('Install needed: ' + verifier.error);
      $('body').addClass('purchaseNow');
    } else if (verifier.error.INTERNAL_ERROR) {
      // The verifier library itself got messed up; this shouldn't happen!
      // It's up to you if you want to reject the user at this point
      console.log('Internal error verifying app purchase: ' + verifier.error);
    } else if (verifier.error.NETWORK_ERROR) {
      // it was some kind of network or server error
      // i.e., not the fault of the user
      // you may want to let the user in, but for a limited time
      console.log('Network error while verifying app purchase. Will try again later.');
    } else if (verifier.error.REFUNDED) {
      console.log('Application purchase has been refunded: ' + verifier.error);
      $('body').addClass('purchaseNow');
    } else {
      // Some other error occurred; maybe it was never a valid receipt, maybe
      // the receipt is corrupted, or someone is trying to mess around.
      // It would not be a bad idea to log this.
      if (verifier.app)
        console.log('Unknown error: ' + verifier.app.receipts + ' ' + verifier.error);
      $('body').addClass('purchaseNow');
    }
  }
});

function updateTweetButton() {
  if (Snake.score)
    $("#tweet-button").data('text', 'I just scored ' + Snake.score + ' points on Slithering. Can you beat my score?');
  var url = "//platform.twitter.com/widgets/tweet_button.html?count=none&dnt=true";
  var data = $("#tweet-button").data();
  for (var i in data) {
    url += "&" + i + "=" + encodeURIComponent(data[i]);
  }
  $("#tweet-button")[0].src = url;
}
