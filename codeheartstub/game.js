// take1/game.js
//
// First attempt at this thing

///////////////////////////////////////////////////////////////
//														   //
//					CONSTANT STATE						 //

// TODO: DECLARE and INTIALIZE your constants here
var START_TIME = currentTime();

// In tiles
var BOARD_SIZE	 = 4;

// In pixels
var TILE_SIZE	  = 150;
var HEADER_SIZE  = 200;

var BOARD_WIDTH = 8;
var BOARD_HEIGHT = 7;// visible height + 1 for the invisible "next tile" row
var EMPTY = -1;
var LANDED = 2;
var COLORS = {"empty": makeColor(234, 240, 250), 
				"falling": makeColor(173, 194, 235), 
				 "landed": makeColor(111, 148, 220) };
var GAME_NAME = "Binary Game" ;

///////////////////////////////////////////////////////////////
//														   //
//					 MUTABLE STATE						 //

// TODO: DECLARE your variables here
var lastKeyCode;
var board;
var numTilesInCol;

///////////////////////////////////////////////////////////////
//														   //
//					  EVENT RULES						  //

// When setup happens...
function onSetup() {
	// TODO: INITIALIZE your variables here
	lastKeyCode = 0;
	
	initializeBoard();
	drawScreen();
}


// When a key is pushed
function onKeyStart(key) {
	lastKeyCode = key;
	generateTile();
}


// Called 30 times or more per second
function onTick() {
	// Some sample drawing 

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
function drawCell(row, col){
	
}

function generateTile(){
	txt = randomInteger(0,1);
	row = randomInteger(0,BOARD_WIDTH-1);
	col = randomInteger(0,BOARD_HEIGHT-1);
	board[row][col].binary=txt;
	board[row][col].state="falling";
	drawScreen();
}

// Generates a random board.
function initializeBoard() {
	var x;
	var y;
	var tile;

	var numVowels;

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
	var BORDER = 4;
	var BORDER_COLOR = makeColor(0.4, 0.4, 0.4);
	var THICKNESS = 16;
	// corner radius, in pixels
	var CORNER = 2;

	var x;
	var y;
	var tile;
	var bx;
	var by;
	var offset;
	var color;
	var i;
	var sideLength;

	// Background
	fillRectangle(0, 0, screenWidth, screenHeight, makeColor(1, 1, 1));
	fillText(GAME_NAME, screenWidth / 2, 20, makeColor(0.5, 0.5, 0.5),
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
			sideLength = TILE_SIZE - 2*BORDER - 7;

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
















