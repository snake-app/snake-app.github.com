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
});
