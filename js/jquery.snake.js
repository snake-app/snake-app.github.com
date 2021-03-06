/**
 * jquery.snake.js - a nibbles clone
 * Copyright (c) 2008 Richard Willis
 * MIT license  : http://www.opensource.org/licenses/mit-license.php
 * Project      : http://jquery-snakey.googlecode.com/
 * Contact      : willis.rh@gmail.com
 */

var Snake = {

  // jQuery objects
  $map: {}, $cherry: {}, $overlay: {}, statEls: {},

  seg: {}, wallseg: {}, cache: {},
  cacheimages: ['img/snake/cherry.jpg'],
  animateTimer: 0, score: 0, bonus: 0, initialBonus: 500, grid: 0, level: 1, lives: 3,
  paused: false, speed: 0, speedMultiplier: 1, cherriesEaten: 0, debug: false,
  gameStarted: false,
  wall: true, // are the outer map walls an obstacle?

  // Map directions to keyboard codes.
  direction: {
    left: 37,
    up: 38,
    right: 39,
    down: 40,
  },

  setup: function() {
    // pre-cache images
    for(var i in Snake.cacheimages) {
      var img = new Image();
      img.src = Snake.cacheimages[i];
    }

    Snake.statEls = {
      $bonus: $("#stats-bonus"),
      $eaten: $("#stats-eaten"),
      $level: $("#stats-level"),
      $lives: $("#stats-lives"),
      $score: $("#stats-score"),
      $totcherries: $("#stats-totcherries")
    };

    // build map
    Snake.$map = $("#map1");
    Snake.$map.width = Snake.$map.innerWidth();
    Snake.$map.height = Snake.$map.innerHeight();

    // build and prepend overlay to map
    Snake.$overlay = $('<div id="overlay"></div>').hide().prependTo(Snake.$map);

    // build and append cherry to map
    Snake.$cherry = $('<div id="cherry"></div>').appendTo(Snake.$map);

    // The mobile touch controls are slower to use than a keyboard so slow the game for touch only devices.
    if ('ontouchstart' in document.documentElement && $(window).width() < 1024) {
      Snake.speedMultiplier = 1.5;
    }

    // listen for key press, store keycode
    Snake.cache.keyCode = [0,0];
    document.onkeydown = function(e) {
      switch (e.keyCode) {
        case 71:
          e.preventDefault();
          Snake.toggleGrid();
          break;
        case 80:
          e.preventDefault();
          Snake.pause();
          break;
        case 78:
          e.preventDefault();
          Snake.newGame(true);
          break;
        case 75:
          $('.purchaseNow').removeClass('purchaseNow');
          $('.hidden').removeClass('hidden');
          break;
        case Snake.direction.left:
        case Snake.direction.up:
        case Snake.direction.right:
        case Snake.direction.down:
          e.preventDefault();
          Snake.changeDirection(e.keyCode);
          break;
        default:
          break;
      }
    };
  },

  /**
   * directionKeyCode - direction to start heading.
   * lastDirectionKeyCode is optional. Useful to reset state.
   */
  changeDirection: function(directionKeyCode, lastDirectionKeyCode) {
    if (directionKeyCode == Snake.direction.left
        || directionKeyCode == Snake.direction.right) {
      Snake.$map[0].parentElement.className = 'horizontalHeading';
    } else {
      Snake.$map[0].parentElement.className = 'verticalHeading';
    }
    if (typeof lastDirectionKeyCode === "undefined") {
      Snake.cache.keyCode[0] = Snake.cache.keyCode[1];
    } else {
      Snake.cache.keyCode[0] = lastDirectionKeyCode;
    }
    Snake.cache.keyCode[1] = directionKeyCode;
  },

  start: function(resume) {
    this.log("start: resume:", resume, "paused:", Snake.paused);
    if (!resume || !Snake.speed) {
      // set initial speed
      Snake.speed = Level[Snake.level][0].speed;
    }

    // show the cherry, and start the animation
    Snake.$cherry.fadeIn(function() {
      if (Snake.paused && !resume) {
        return;
      }
      Snake.animateTimer = setInterval(Snake.animate, Snake.speed * Snake.speedMultiplier);
    });
  },

  /**
   * Reset the level and show the level intro.
   * @param reset  Whether to start again at the first level. (e.g. New Game button pressed)
   */
  newGame: function(reset) {
    this.log("newGame: reset:", !!reset);

    function cleanBoard() {
      // reset and generate wall
      Snake.wallseg = {};
      Snake.Wall.generate();

      // generate cherry
      Snake.Cherry.generate(false);

      // reset, remove and re-append snake segments to map
      Snake.seg = {length: Level[Snake.level][0].length};
      for(var i = 0; i < Snake.seg.length; i++) {
        Snake.seg[i] = $('<span class="snake ' + i + '"></span>').appendTo(Snake.$map);
        Snake.seg[i].top = Snake.seg[i].left = 0;
      }

      // reset direction
      Snake.changeDirection(Snake.direction.right, 0);
    }

    if (reset) {
      Snake.$map.css("transition", "background-color 500ms");
      Snake.$map.css("background-color", "white");
      Snake.cherriesEaten = 0;
    }
    Snake.gameStarted = true;

    // reset animation timer
    clearInterval(Snake.animateTimer);
    Snake.animateTimer = 0;

    // reset bonus
    Snake.bonus = Snake.initialBonus;
    Snake.statEls.$bonus.text(Snake.bonus);

    // reset score
    Snake.score = reset ? 0 : Snake.score;
    Snake.statEls.$score.text(Snake.score + "");

    // reset level
    Snake.level = reset ? 1 : Snake.level;
    Snake.statEls.$level.text(Snake.level);

    // reset lives
    Snake.lives = reset ? 3 : Snake.lives;
    Snake.statEls.$lives.text(Snake.lives);

    // reset level cherries eaten and total
    Snake.statEls.$eaten.text(Snake.cherriesEaten + "");
    Snake.statEls.$totcherries.text(Level[Snake.level][0].cherries);

    // remove any wall & snake segments
    $(".wall, .snake").remove();

    // hide the cherry
    Snake.$cherry.hide();

    // update map message
    $("#map-msg").hide().html('Level ' + Snake.level + ' <br/>Eat <strong>' + Level[Snake.level][0].cherries + '</strong> cherries<small><br/>' +
                              '<small style="font-size:80%"><strong>(' + Snake.lives + '</strong> ' + (Snake.lives > 1 ? 'lives' : 'life') + ' remaining)</small></small>')
                        .fadeIn(500, function() {

                          setTimeout(function() {

                            if (Snake.paused) {
                              cleanBoard();
                            } else {
                              // hide map message
                              $("#map-msg").fadeOut(500, function() {
                                // hide overlay
                                Snake.$overlay.hide();

                                cleanBoard();

                                // start snake animation
                                setTimeout(function() {
                                  Snake.start();
                                }, 1000);

                              });
                            }
                          }, 2500);
                        });
  },

  animate: function() {
    // decrease bonus until 0
    Snake.bonus = Math.max(0, Snake.bonus -= 1);
    Snake.statEls.$bonus.text(Snake.bonus);

    // adjust segment position list
    for(var i = 1; i < Snake.seg.length; i++) {
      Snake.seg[i].top = Snake.seg[(i == Snake.seg.length - 1 ? 0 : i+1)].top;
      Snake.seg[i].left = Snake.seg[(i == Snake.seg.length - 1 ? 0 : i+1)].left;
    }

    var keycode = Snake.cache.keyCode;
    if (
      // if key pressed is opposite of current direction
        keycode[0] == Snake.direction.left && keycode[1] == Snake.direction.right ||
        keycode[0] == Snake.direction.right && keycode[1] == Snake.direction.left ||
        keycode[0] == Snake.direction.up && keycode[1] == Snake.direction.down ||
        keycode[0] == Snake.direction.down && keycode[1] == Snake.direction.up
    ) {
      // reset the keyCode
      Snake.cache.keyCode[1] = Snake.cache.keyCode[0];
    }

    keycode = Snake.cache.keyCode[1];
    // adjust leading segment properties
    if (keycode == Snake.direction.right) {
      Snake.seg[0].left += 10;
      if (Snake.seg[0].left > Snake.$map.width - 10) {
        Snake.wall && Snake.gameOver();
        Snake.seg[0].left = 0;
      }
    } else if (keycode == Snake.direction.down) {
      Snake.seg[0].top += 10;
      if (Snake.seg[0].top > Snake.$map.height - 10) {
        Snake.wall && Snake.gameOver();
        Snake.seg[0].top = 0;
      }
    } else if (keycode == Snake.direction.up) {
      Snake.seg[0].top -= 10;
      if (Snake.seg[0].top < 0) {
        Snake.wall && Snake.gameOver();
        Snake.seg[0].top = Snake.$map.height - 10;
      }
    } else if (keycode == Snake.direction.left) {
      Snake.seg[0].left -= 10;
      if (Snake.seg[0].left < 0) {
        Snake.wall && Snake.gameOver();
        Snake.seg[0].left = Snake.$map.width - 10;
      }
    }
    // check if snake has eaten a cherry
    (Snake.seg[0].left == Snake.Cherry.left && Snake.seg[0].top == Snake.Cherry.top) &&
      Snake.advance();

    // unset Snake.seg[0], gotta be an easier way!
    var seg = {};
    for (var s = 1; s < Snake.seg.length; s++) {
      seg[s - 1] = Snake.seg[s];
    }

    // check if snake has slithered into itself
    (Snake.in_obj(Snake.seg[0], seg)) &&
      Snake.gameOver();

    // check if snake has slithered into a wall obstacle
    (Snake.in_obj(Snake.seg[0], Snake.wallseg)) &&
      Snake.gameOver();

    // check if cherries eaten match total: finished level.. advance to next level
    (Snake.cherriesEaten == Level[Snake.level][0].cherries) &&
      Snake.advanceLevel();

    // reposition snake segments on map
    for (var segm = 0; segm < Snake.seg.length; segm++) {
      Snake.seg[segm].css({
        top: Snake.seg[segm].top + "px",
        left: Snake.seg[segm].left + "px",
        display: "block",
      });
    }
  },

  // Called when a cherry is eaten
  advance: function(val) {
    // increase snake segments
    Snake.seg.length++;

    var x = Snake.seg.length - 1;
    Snake.seg[x] =
      $('<span class="snake ' + x + '"></span>')
      .css({
          left: Snake.seg[1].left + "px",
          top: Snake.seg[1].top + "px",
          display: "block",
      })
      .appendTo(Snake.$map);

    // position new snake segment
    Snake.seg[x].top = Snake.seg[x - 1].top;
    Snake.seg[x].left = Snake.seg[x - 1].left;

    // reposition cherry
    Snake.Cherry.generate();

    // adjust score
    Snake.score += 50;
    Snake.statEls.$score.text(Snake.score);

    // update cherries eaten
    Snake.cherriesEaten++;
    Snake.statEls.$eaten.text(Snake.cherriesEaten);

    // adjust speed
    Snake.speed -= 1;
    this.log("Speed:", Snake.speed);

    clearInterval(Snake.animateTimer);
    Snake.animateTimer = setInterval(Snake.animate, Snake.speed * Snake.speedMultiplier);
    return false;
  },

  advanceLevel: function() {
    if (Snake.level == Level.length - 1) {
      Snake.finishedGame();
    } else {
      Snake.level++;
      Snake.cherriesEaten = 0;
      Snake.speed = Level[Snake.level][0].speed;
      Snake.score += Snake.bonus;
      Snake.newGame();
    }
  },

  toggleGrid: function() {
    var background;
    if (!Snake.grid) {
      background = "url(img/snake/grid_bg.gif)";
      Snake.grid = 1;
    } else {
      background = "none";
      Snake.grid = 0;
    }
    Snake.$map.css({backgroundImage: background});
  },

  pause: function() {
    if (!Snake.gameStarted)
      return;
    if (Snake.paused) {
      Snake.start(true);
      Snake.$overlay.hide();
      $("#map-msg").fadeOut();
    } else {
      // Pause
      clearInterval(Snake.animateTimer);
      Snake.animateTimer = 0;
      Snake.$overlay.show();
      $("#map-msg").html("<br/>Paused").fadeIn();
    }
    Snake.paused = (Snake.paused + 1) % 2;
    this.log("paused:", Snake.paused);
  },

  gameOver: function() {
    if (Snake.lives - 1) {
      Snake.lives--;
      Snake.newGame();
    } else {
      Snake.pause();
      Snake.gameStarted = false;
      $("#map-msg").html('<br/>Game over<small><br/><a class="button" href="javascript:Snake.newGame(true)">Play again?</a></small>');
      updateTweetButton();
    }
  },

  finishedGame: function() {
    Snake.pause();
    Snake.gameStarted = false;
    $("#map-msg").html('<br/>Well Done! You finished.<small><br/><a class="button" href="javascript:Snake.newGame(true)">Play again?</a></small>');
    updateTweetButton();
  },

  Cherry: {
    left: 0,
    top: 0,
    generate: function(show) {
      do {
        Snake.Cherry.left = Math.round((Math.random() * (Snake.$map.width - 10)) / 10) * 10;
        Snake.Cherry.top = Math.round((Math.random() * (Snake.$map.height - 10)) / 10) * 10;
      } while (Snake.in_obj(Snake.Cherry, Snake.wallseg) || Snake.in_obj(Snake.Cherry, Snake.seg));

      Snake.$cherry.css({
        left: Snake.Cherry.left + "px",
        top: Snake.Cherry.top + "px"
      });
      show == undefined && Snake.$cherry.hide().fadeIn();
    }
  },

  // wall obstacles
  Wall: {
    generate: function() {

      var walls = Level[Snake.level],
          c = 0, t, l, i, n;

      // append multiple walls
      for(i = 1; i < walls.length; i++) {
        t = walls[i].top;
        l = walls[i].left;
        // append wall segments to map
        for(n=0; n < walls[i].seg; n++) {
          Snake.wallseg[c] = $('<span class="wall ' + c + '"></span>').css({top: t + "px", left:l + "px"}).appendTo(Snake.$map);
          Snake.wallseg[c].left = l;
          Snake.wallseg[c].top = t;
          c++;
          t += 10;
        }
      }
    }
  },

  // check for an object in an object collection
  in_obj: function(obj_needle, obj_haystack) {
    for(var i in obj_haystack) {
      if (obj_haystack[i].left === obj_needle.left && obj_haystack[i].top === obj_needle.top) {
        return true;
      }
    }
    return false;
  },

  log: function(message /*, message2, ...*/) {
    if (!this.debug)
      return;
    if (!("log" in console))
      return;
    console.log(Array.prototype.slice.call(arguments).join(' '));
  }

};

var Level = [
  ,
  [
    {cherries: 5, length: 10, speed: 100},
    {seg: 30, top: 50, left: 200}
  ],
  [
    {cherries: 5, length: 15, speed: 95},
    {seg: 30, top: 50, left: 100},
    {seg: 30, top: 50, left: 300}
  ],
  [

    {cherries: 5, length: 20, speed: 90},
    {seg: 12, top: 10, left: 50},
    {seg: 12, top: 0, left: 350},
    {seg: 12, top: 270, left: 350},
    {seg: 12, top: 280, left: 50},
    {seg: 24, top: 80, left: 200}
  ],
  [
    {cherries: 5, length: 25, speed: 85},
    {seg: 19, top: 0, left: 200},
    {seg: 20, top: 200, left: 200},
    {seg: 40, top: 0, left: 0},
    {seg: 40, top: 0, left: 390}
  ],
  [
    {cherries: 5, length: 30, speed: 80},
    {seg: 20, top: 10, left: 50},
    {seg: 20, top: 0, left: 150},
    {seg: 20, top: 10, left: 250},
    {seg: 20, top: 0, left: 350},
    {seg: 20, top: 200, left: 20},
    {seg: 20, top: 200, left: 120},
    {seg: 20, top: 200, left: 220},
    {seg: 20, top: 200, left: 320}
  ],
  [
    {cherries: 5, length: 35, speed: 75},
    {seg: 2, top: 10, left: 200},
    {seg: 2, top: 40, left: 200},
    {seg: 2, top: 70, left: 200},
    {seg: 2, top: 100, left: 200},
    {seg: 2, top: 130, left: 200},
    {seg: 2, top: 160, left: 200},
    {seg: 2, top: 190, left: 200},
    {seg: 2, top: 220, left: 200},
    {seg: 2, top: 250, left: 200},
    {seg: 2, top: 280, left: 200},
    {seg: 2, top: 310, left: 200},
    {seg: 2, top: 340, left: 200},
    {seg: 2, top: 370, left: 200},
    {seg: 20, top: 100, left: 280},
    {seg: 20, top: 100, left: 120},
    {seg: 30, top: 50, left: 60},
    {seg: 30, top: 50, left: 340},
    {seg: 40, top: 0, left: 0},
    {seg: 40, top: 0, left: 390}
  ]
];
