// codeheartstub/game.js
//
// First attempt at this thing--falling tiles

///////////////////////////////////////////////////////////////
//													
//					CONSTANT STATE					

// DECLARE and INTIALIZE your constants here
var START_TIME = currentTime();
// amount of time, in seconds, before a tile falls down one slot
var FALL_TIME = 0.5;
// time, in seconds, until the next tile gets generated
var GEN_TIME = 1; 

// In tiles
var BOARD_SIZE	 = 4;

// In pixels
var TILE_SIZE	 = 150;
var KEY_SIZE	 = TILE_SIZE * 1.5;
var HEADER_SIZE = 200;

// Distance between adjacent tiles 
var ADJ_BUFFER = TILE_SIZE * 1.1;// * sqrt(2);

var BOARD_WIDTH = 8;
var BOARD_HEIGHT = 7;// visible height + 1 for the invisible "next tile" row
var COLORS = {"background": makeColor(245/256, 248/256, 253/256),
					"empty": makeColor(234/256, 240/256, 250/256), 
					"falling": makeColor(173/256, 194/256, 235/256), 
					"landed": makeColor(111/256, 148/256, 220/256),
					"selected": makeColor(56/256, 74/256, 110/256),
					"key": makeColor(173/256, 194/256, 235/256) };



// unicode symbols:
//var BACKSPACE = String.fromCharCode("0x232B");
//var ENTER = String.fromCharCode("0x23CE");

var LINE_COLOR	 = makeColor(.5, .4, .3, 0.4);
var GAME_NAME = "Binary Game" ;

///////////////////////////////////////////////////////////////
//													
//					 MUTABLE STATE					

// Most recently pressed key
var lastKeyCode;

// tiles with state and center points
var board;

// TODO: implement this
// use to make tiles more likely to fall in emptier cols
var numTilesInCol;

// time to set tiles falling
var nextFallTime;

// time to make new tile
var nextGenTime;

// (x, y) coordinates of the centers of the tiles that have been
// touched to create selectedTiles, in order
var selectedTiles;

var touchID;

var score;

///////////////////////////////////////////////////////////////
//													
//					 EVENT RULES					

// When setup happens...
function onSetup() {
	// INITIALIZE variables here
	lastKeyCode = 0;
	
	paused = true;
	score = 0;
	initializeBoard();
	drawScreen();
}

// When a key is pushed
function onKeyStart(key) {
	lastKeyCode = key;
	if (key == 32){
		togglePause();
	}
}

function togglePause(){
	if (paused){
		nextFallTime = currentTime();//+FALL_TIME;
		nextGenTime = currentTime();//+GEN_TIME;
	}
	paused = !paused;
}

// When a touch starts
function onTouchStart(x, y, id) {
	//onKeyStart(32);
	touchID = id;
	if (paused) {
		togglePause();
	} else {
		var bcoord = getBoardIndex(x,y);
		if (bcoord.x == -1){
			togglePause();
		} else {
			onTouchMove(x,y,id);
		}
	}
}

function onTouchMove(x, y, id) {
	var tile;
	
	var bcoord = getBoardIndex(x,y);

	if (touchID == id) {
		// getBoardIndex returns x=-1 if not on board
		if (bcoord.x>=0) {
	
		tile = board[bcoord.x][bcoord.y];
			
			// If the touch was moved really fast, or was due
			// to a mouse pointer that went outside the
			// window, the player could cheat and select two
			// tiles that aren't adjacent. verify that this
			// tile is adjacent to the previous one
			// horizontally, vertically, or diagonally.
			
			if ((length(selectedTiles) == 0) ||
				(distance(tile.center, selectedTiles[length(selectedTiles) - 1].center) < ADJ_BUFFER)) {
	
				// The click was on this tile
				tile.selected = true;
				tile.state="selected";
				//selectedTiles = selectedTiles + tile.number;
				insertBack(selectedTiles, tile);
				
				drawScreen();
				return;
			} // if adjacent
		} // if on a tile
	}
}

// When a touch ends, show key pad
function onTouchEnd(x, y, id) {
	// show key pad
	document.getElementById("show-key-pad").click();
}

// Called 30 times or more per second
function onTick() {
	
	if (!paused){
		if (nextFallTime < currentTime()){
			nextFallTime += FALL_TIME;
			onFall();
			//console.log(nextFallTime);
			drawScreen();
		}
		
		if (nextGenTime < currentTime()){
			nextGenTime += GEN_TIME;
			generateTile();	
		}
	}
}

// called by onTick at appropriate intervals
function onFall(){
	var x;
	var y;

	x = 0;
	while (x < BOARD_WIDTH) {
		
		// we need to check y in direction 
		// BOARD_HEIGHT to 0 
		// to avoid having to track whether a 
		// tile has already fallen this turn or not
		y = BOARD_HEIGHT-1;
		while (y > 0) {
			
			// check if the tile above should fall into this slot
			if (board[x][y-1].state == "falling" && board[x][y].state == "empty"){
				board[x][y].state = "falling";
				board[x][y].binary = board[x][y-1].binary;
				board[x][y-1].state="empty";
				board[x][y-1].binary="";
				
				// if it's in the bottom row or the tile below it 
				// has landed, mark the current tile as landed
				if (y==BOARD_HEIGHT-1 || board[x][y+1].state=="landed" || board[x][y+1].state=="selected"){
					board[x][y].state = "landed";
				}
			}
			
			y = y - 1;
		} 
		x = x + 1;
	}
}

///////////////////////////////////////////////////////////////
//														 						//
//					 BOARD METHODS 					 					//

function generateTile(){
	// choose a column for the tile
	var x = randomInteger(0,BOARD_WIDTH-1);
	
	// set text 0 or 1 and state falling
	board[x][0].binary=randomInteger(0,1);
	board[x][0].state="falling";
	
	drawScreen();
}

// Generates a random board.
function initializeBoard() {
	var x;
	var y;
	var tile;
	var boardTL = boardTopLeft();
	
	
	selectedTiles = [];

	// Create an array of columns
	board = [];
	numTilesInCol = [];

	x = 0;
	while (x < BOARD_WIDTH) {
		// Create this column
		board[x] = [];
		numTilesInCol[x]=0;
		
		y = 0;
		while (y < BOARD_HEIGHT) {
			tile = makeObject();
			tile.binary = ""; //could be 0, 1, or ""
			tile.state = "empty";
			
			// Center of the tile in pixels
			tile.center = makeObject();			
			tile.center.x = boardTL.x + (x+.5) * TILE_SIZE;
			// y-1 hides row 0
			tile.center.y = boardTL.y + (y-1+.5) * TILE_SIZE;
			
			board[x][y] = tile;
			
			y = y + 1;
		} 
		x = x + 1;
	}
}

//////////////////////////////////////////////////////////////
//														 						//
//					 GAME LOGIC 					 						//

// jQuery keypad in play.html calls this method 
function checkAns(decimal){
// var binaryPrompt = "Enter in your decimal conversion for: " + toUpperCase(selectedTiles);
//	var binaryBadPrompt = "That is incorrect. Enter in a new conversion for: " + toUpperCase(selectedTiles);

	score = score + parseInt(decimal, 10);
	drawScreen();

	/*if (touchID == id) {
		touchID = NONE;

		// Was there a number entered?
		if (length(selectedTiles) > 0) {
			// Was it a good conversion?
			if (length(selectedTiles) >= minLength) {
				if (isCorrect(selectedTiles, decimal)) {
					SHOW_BAD_NUMBER = 0;
					nextPhaseTime = currentTime() + SHOW_NUMBER_TIME;
					phase		 = SHOW_GOOD_NUMBER;
					score = score + parseInt(decimal, 10);
					if (minLength < maxLength) {
						minLength = minLength + 1;
					}
				}
				else {
					SHOW_BAD_NUMBER = 1;
					while (SHOW_BAD_NUMBER == 1) {
						// Give player another chance to enter good guess
						selectedDecimal = window.prompt(binaryBadPrompt);
						decimal = selectedDecimal;
						if (isCorrect(selectedTiles, decimal)) {
							SHOW_BAD_NUMBER = 0;
							nextPhaseTime = currentTime() + SHOW_NUMBER_TIME;
							phase		 = SHOW_GOOD_NUMBER;
							score = score + length(selectedTiles);
						}
					}
				}
			}
			else {
				alert("You need to select a number that is " + minLength + " tiles long.");
				resetBoard();
			} 
		}
		drawScreen();
	}*/
}

// Returns true iff the decimal entered is the correct translation of the binary value
function isCorrect(selectedTiles,decimal) {
	console.log(selectedTiles);
	var l = length(selectedTiles);
	var current = l - 1;
	var currentValue = 1;
	var totalValue = 0;
	while (current > -1) {
		if (selectedTiles[current].binary == "1") {
			totalValue = totalValue + currentValue;
		}
		current = current - 1;
		currentValue = currentValue * 2;

	}
	return totalValue == decimal;
}

///////////////////////////////////////////////////////////////
//																		
//					 DISPLAY								

//
function drawScreen() {
	var BORDER = 10;
	var BORDER_COLOR = makeColor(0.8, 0.8, 0.8);
	var THICKNESS = 16;
	// corner radius, in pixels
	var CORNER = 10;

	var x;
	var y;
	var tile;
	var bx;
	var by;
	var sideLength;
	var i;

	// Background
	fillRectangle(0, 0, screenWidth, screenHeight, COLORS["background"]);
	fillText(GAME_NAME, screenWidth / 2, 100, makeColor(0.5, 0.5, 0.5),
			 "100px Arial", "center", "top");
	fillText("Score: "+score, screenWidth / 2, 190, makeColor(0.5, 0.5, 0.5),
			 "80px Arial", "center", "top");

	// Board background
	
	var boardTL = boardTopLeft();
	fillRectangle(boardTL.x-BORDER, boardTL.y-BORDER,2*BORDER+ BOARD_WIDTH*TILE_SIZE, 2*BORDER+(BOARD_HEIGHT-1)*TILE_SIZE, BORDER_COLOR, CORNER);

	// Board
	bx = 0;
	while (bx < BOARD_WIDTH) {

		by = 1;
		while (by < BOARD_HEIGHT) {
			tile = board[bx][by];
			dim = convertxyCentered(tile.center.x,tile.center.y,TILE_SIZE,BORDER);

			// top
			// fillRectangle(x0, y0, w, h, color, <cornerRadius>)
			// strokeRectangle(x0, y0, w, h, color, thickness, <cornerRadius>)
			fillRectangle(dim.x, dim.y, dim.sideLength, dim.sideLength, COLORS[tile.state], CORNER);
			//strokeRectangle(dim.x, dim.y, dim.sideLength, dim.sideLength, BORDER_COLOR, BORDER, CORNER);

			// label
			fillText(tile.binary, tile.center.x , tile.center.y ,	 
					 makeColor(0.2, 0.2, 0.2), 
					 "" + round(TILE_SIZE * 0.65) + "px Times New Roman", 
					 "center", 
					 "middle");

			by = by + 1;
		}
		bx = bx + 1;
	}

	// Draw the touch line
	i = 0;
	while (i < length(selectedTiles) - 1) {
		strokeLine(selectedTiles[i].center.x, selectedTiles[i].center.y,
				 selectedTiles[i + 1].center.x, selectedTiles[i + 1].center.y,
				 LINE_COLOR, 40);
				 
		i = i + 1;
	}
}

// top left x,y, width, and border
function convertxyCentered(x,y,w,b) {
	var obj = {
		x: x-w/2+b,
		y: y-w/2+b,
		sideLength: w - 2*b 
	}
	return obj;
}

function boardTopLeft(){
	var obj = {
		// SW-TS*BW is the sum of horizontal margins (in pixels)
		x: (screenWidth - TILE_SIZE * BOARD_WIDTH) / 2,
		// (SH-HS)...+HS leaves vertical space for a title
		// BH-1 ignores row 0
		y: ((screenHeight - HEADER_SIZE) - TILE_SIZE * (BOARD_HEIGHT-1) ) / 2 + HEADER_SIZE
	}
	return obj;
}

///////////////////////////////////////////////////////////////
//													
//					 MISC. HELPER METHODS					


// converts touch to board index
// sets both to -1 if off board
function getBoardIndex(x,y){
	var boardTL = boardTopLeft();
	// top left corner of displayed board
	x -= boardTL.x;
	y -= boardTL.y;
	// tile width
	x /= TILE_SIZE;
	y /= TILE_SIZE;
	x = Math.floor(x);
	y = Math.floor(y);
	// hidden row
	y += 1;
	
	if (y<=0 || x<0 || x>= BOARD_WIDTH || y>=BOARD_HEIGHT){
		x=-1;
		y=-1;
	}
	
	var obj = {
		x: x,
		y: y
	}
	return obj;
}

// Returns the distance between P1 and P2, which must each have
// x and y properties.
function distance(P1, P2) {
	return sqrt(pow(P1.x - P2.x, 2) + pow(P1.y - P2.y, 2));
}










