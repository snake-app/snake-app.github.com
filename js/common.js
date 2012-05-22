/*
 *
 * Filename:	common.js
 * Developer:	Richard Willis
 *
 */

$(function(){
  // setup the game
  Snake.setup();

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
