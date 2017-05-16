// codeheartstub/game.js
//
// First attempt at this thing--falling tiles

///////////////////////////////////////////////////////////////
//														   //
//					CONSTANT STATE						 //

// DECLARE and INTIALIZE your constants here
var START_TIME = currentTime();
// amount of time, in seconds, before a tile falls down one slot
var FALL_TIME = 0.5;
// time, in seconds, until the next tile gets generated
var GEN_TIME = 1; 

// In tiles
var BOARD_SIZE	 = 4;

// In pixels
var TILE_SIZE	  = 150;
var HEADER_SIZE  = 200;

var BOARD_WIDTH = 8;
var BOARD_HEIGHT = 7;// visible height + 1 for the invisible "next tile" row
var COLORS = {"background": makeColor(245/256, 248/256, 253/256),
					"empty": makeColor(234/256, 240/256, 250/256), 
					"falling": makeColor(173/256, 194/256, 235/256), 
					"landed": makeColor(111/256, 148/256, 220/256),
					"active": makeColor(56/256, 74/256, 110/256) };

var LINE_COLOR     = makeColor(.5, .4, .3, 0.4);
var GAME_NAME = "Binary Game" ;

///////////////////////////////////////////////////////////////
//														   //
//					 MUTABLE STATE						 //

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
// touched to create activeNumber, in order
var activeNumberLine;

// The number that is currently being selected
var activeNumber;

var touchID;

///////////////////////////////////////////////////////////////
//														   //
//					  EVENT RULES						  //

// When setup happens...
function onSetup() {
	// TODO: INITIALIZE your variables here
	lastKeyCode = 0;
	
	paused = true;
	initializeBoard();
	drawScreen();
}

function onUnPause(){
	nextFallTime = currentTime();//+FALL_TIME;
	nextGenTime = currentTime();//+GEN_TIME;
}

// When a key is pushed
function onKeyStart(key) {
	lastKeyCode = key;
	if (key == 32){
		if (paused){
			onUnPause();
		}
		paused = !paused;
	}
}

// When a touch starts
function onTouchStart(x, y, id) {
    //onKeyStart(32);
    touchID = id;
    onTouchMove(x,y,id);
}

// Called 30 times or more per second
function onTick() {
	// Some sample drawing 
	
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


///////////////////////////////////////////////////////////////
//														   //
//					  HELPER RULES						 //


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

function onTouchMove(x, y, id) {
    var tile;
    
    var bcoord = getBoardIndex(x,y);

    var point;
    point = makeObject();
    point.x = x;
    point.y = y;

    if (touchID == id) {
        // See which tile was touched
        
                
                // getBoardIndex returns x=-1 if not on board
                if (bcoord.x>=0) {

                tile = board[bcoord.x][bcoord.y];
                    
                    // If the touch was moved really fast, or was due
                    // to a mouse pointer that went outside the
                    // window, the player could cheat and select two
                    // tiles that aren't adjacent.  verify that this
                    // tile is adjacent to the previous one
                    // horizontally, vertically, or diagonally.
                    
                    if ((length(activeNumberLine) == 0) ||
                        (distance(tile.center, activeNumberLine[length(activeNumberLine) - 1]) < TILE_SIZE * sqrt(2) * 1.1)) {

                        // The click was on this tile
                        tile.active = true;
                        tile.state="active";
                        activeNumber = activeNumber + tile.number;
                        insertBack(activeNumberLine, tile.center);
                        
                        drawScreen();
                        return;
                    } // if adjacent
                } // if on a tile
        
    }
}

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
				if (y==BOARD_HEIGHT-1 || board[x][y+1].state=="landed" || board[x][y+1].state=="active"){
					board[x][y].state = "landed";
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
	var boardTL = boardTopLeft();
	
	
   activeNumberLine = [];

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
	while (i < length(activeNumberLine) - 1) {
		strokeLine(activeNumberLine[i].x, activeNumberLine[i].y,
				   activeNumberLine[i + 1].x, activeNumberLine[i + 1].y,
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













