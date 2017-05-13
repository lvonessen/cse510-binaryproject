// take1/game.js
//
// First attempt at this thing

///////////////////////////////////////////////////////////////
//														   //
//					CONSTANT STATE						 //

// TODO: DECLARE and INTIALIZE your constants here
var START_TIME = currentTime();
// amount of time, in seconds, before a cell falls down one slot
var FALL_TIME = 0.5; 

// In tiles
var BOARD_SIZE	 = 4;

// In pixels
var TILE_SIZE	  = 150;
var HEADER_SIZE  = 200;

var BOARD_WIDTH = 8;
var BOARD_HEIGHT = 7;// visible height + 1 for the invisible "next tile" row
var EMPTY = -1;
var LANDED = 2;
var COLORS = {"background": makeColor(245/256, 248/256, 253/256),
					"empty": makeColor(234/256, 240/256, 250/256), 
					"falling": makeColor(173/256, 194/256, 235/256), 
					"landed": makeColor(111/256, 148/256, 220/256) };
var GAME_NAME = "Binary Game" ;

///////////////////////////////////////////////////////////////
//														   //
//					 MUTABLE STATE						 //

// TODO: DECLARE your variables here
var lastKeyCode;
var board;
var numTilesInCol;
var nextFallTime;
var setUp = false;

///////////////////////////////////////////////////////////////
//														   //
//					  EVENT RULES						  //

// When setup happens...
function onSetup() {
	// TODO: INITIALIZE your variables here
	lastKeyCode = 0;
	nextFallTime = currentTime();
	
	initializeBoard();
	drawScreen();
}


// When a key is pushed
function onKeyStart(key) {
	lastKeyCode = key;
	generateTile();
	setUp = true;
}

function onTouchStart(x, y, id) {
    onKeyStart(32);
}


// Called 30 times or more per second
function onTick() {
	// Some sample drawing 
	if (setUp && nextFallTime < currentTime()){
		nextFallTime += FALL_TIME;
		fall();
		//console.log(nextFallTime);
		drawScreen();
	}	
	
	/*clearRectangle(0, 0, screenWidth, screenHeight);

	fillText("hello world",
			 screenWidth / 2, 
			 screenHeight / 2,			 
			 makeColor(0.5, 0.0, 1.0, 1.0), 
			 "300px Times New Roman", 
			 "center", 
			 "middle");

	fillText(round(currentTime() - START_TIME) + " seconds since start",
			 screenWidth / 2, 
			 screenHeight / 2 + 300,   
			 makeColor(1.0, 1.0, 1.0, 1.0), 
			 "100px Arial", 
			 "center", 
			 "middle");

	fillText("last key code: " + lastKeyCode,
			 screenWidth / 2, 
			 screenHeight / 2 + 500,			 
			 makeColor(0.7, 0.7, 0.7, 1.0), 
			 "100px Arial", 
			 "center", 
			 "middle");*/
}


///////////////////////////////////////////////////////////////
//														   //
//					  HELPER RULES						 //

function fall(){
	var x;
	var y;

	x = 0;
	while (x < BOARD_WIDTH) {
		
		y = BOARD_HEIGHT-1;
		while (y > 0) {
			
			// check if cell above is falling
			// so it can either fall further or be marked as landed
			// (or both if it's falling into the final row)
			if (board[x][y-1].state == "falling"){
				// if this cell is empty, swap
				if (board[x][y].state == "empty"){
					board[x][y].state = "falling";
					board[x][y].binary = board[x][y-1].binary;
					board[x][y-1].state="empty";
					board[x][y-1].binary="";
					// if it's in the bottom row, mark it as landed
					if (y==BOARD_HEIGHT-1){
						board[x][y].state = "landed";
					}
				} 
				// else if this cell is landed, the cell above has also landed				
				else if (board[x][y].state == "landed" ) {
					board[x][y-1].state = "landed";
				}
			}
			
			y = y - 1;
		}  
		x = x + 1;
	}
}

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
			tile.upleft = makeObject();
			// SW-TS*BW is the sum of horizontal margins (in pixels)
			tile.upleft.x = (screenWidth - TILE_SIZE * BOARD_WIDTH) / 2 + (x ) * TILE_SIZE;
			// (SH-HS)...+HS leaves vertical space for a title
			// BH-1, y-1 hides row 0
			tile.upleft.y = ((screenHeight - HEADER_SIZE) - TILE_SIZE * (BOARD_HEIGHT-1) ) / 2 
									+ (y-1) * TILE_SIZE + HEADER_SIZE;
			
			board[x][y] = tile;
			
			y = y + 1;
		}  
		x = x + 1;
	}
}

//
function drawScreen() {
	var BORDER = 10;
	var BORDER_COLOR = makeColor(0.6, 0.6, 0.6);
	var THICKNESS = 16;
	// corner radius, in pixels
	var CORNER = 2;

	var x;
	var y;
	var tile;
	var bx;
	var by;
	var sideLength;

	// Background
	fillRectangle(0, 0, screenWidth, screenHeight, COLORS["background"]);
	fillText(GAME_NAME, screenWidth / 2, 100, makeColor(0.5, 0.5, 0.5),
			 "100px Arial", "center", "top");

	/*if (phase == SHOW_GOOD_WORD) {
		fillText(toUpperCase(activeWord), screenWidth / 2, 130, makeColor(0.1, 0.6, 0.3),
				 "bold 115px Times New Roman", "center", "top");
	}*/

	// Board
	bx = 0;
	while (bx < BOARD_WIDTH) {

		by = 1;
		while (by < BOARD_HEIGHT) {
			tile = board[bx][by];
			x = tile.upleft.x + BORDER;
			y = tile.upleft.y + BORDER;
			sideLength = TILE_SIZE - 2*BORDER ;//- 7;

			// top
			// fillRectangle(x0, y0, w, h, color, <cornerRadius>)
			// strokeRectangle(x0, y0, w, h, color, thickness, <cornerRadius>)
			fillRectangle(x, y, sideLength, sideLength, COLORS[tile.state], CORNER);
			strokeRectangle(x, y, sideLength, sideLength, BORDER_COLOR, BORDER, CORNER);

			// label
			fillText(tile.binary, x + sideLength/2, y + sideLength/2,	   
					 makeColor(0.2, 0.2, 0.2), 
					 "" + round(TILE_SIZE * 0.65) + "px Times New Roman", 
					 "center", 
					 "middle");

			by = by + 1;
		}
		bx = bx + 1;
	}

	/*// Draw the touch line
	i = 0;
	while (i < length(activeWordLine) - 1) {
		strokeLine(activeWordLine[i].x, activeWordLine[i].y,
				   activeWordLine[i + 1].x, activeWordLine[i + 1].y,
				   LINE_COLOR, 40);
				   
		i = i + 1;
	}*/
}
















