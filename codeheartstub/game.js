// codeheartstub/game.js
//
// First attempt at this thing--falling tiles

///////////////////////////////////////////////////////////////
//													
//					CONSTANT STATE					

// DECLARE and INTIALIZE your constants here
// start
var START_TIME = currentTime();
// amount of time, in seconds, before a tile falls down one slot
var FALL_TIME = .1; //0.5;
// time, in seconds, until the next tile gets generated
var GEN_TIME = .3; //1; 
var BONUS_DELAY = 2;

// In tiles
var BOARD_SIZE	 = 4;

// In pixels
var TILE_SIZE	 = 175;
var KEY_SIZE	 = TILE_SIZE * 1.5;
var HEADER_SIZE = 200;

// Distance between adjacent tiles 
var ADJ_BUFFER = TILE_SIZE * 1.1;// * sqrt(2);

var BOARD_WIDTH = 6;
var BOARD_HEIGHT = 7;// visible height + 1 for the invisible "next tile" row
var COLORS = {"background": makeColor(245/256, 248/256, 253/256),
					"empty": makeColor(234/256, 240/256, 250/256), 
					"falling": makeColor(173/256, 194/256, 235/256), 
					"landed": makeColor(111/256, 148/256, 220/256),
					"selected": makeColor(56/256, 74/256, 110/256),
					"bonusFound": makeColor(0,1,0),
					"bonusMissing": makeColor(1,0,0) };



// unicode symbols:
//var BACKSPACE = String.fromCharCode("0x232B");
//var ENTER = String.fromCharCode("0x23CE");

var LINE_COLOR	 = makeColor(.5, .4, .3, 0.4);
var GAME_NAME = "Binary Game" ;
var TITLE_IMAGE_NAME = "title.png";


var CONVERSION_PROMPT = "Enter decimal conversion for:";
var CONVERSION_REPROMPT = "Incorrect. Please try again:";

///////////////////////////////////////////////////////////////
//													
//					 MUTABLE STATE					

// Most recently pressed key
var lastKeyCode;

// tiles with state and center points
var board;

// used by generate tiles
var numTilesInCol; // number visible tiles per column
var visTiles; // total number visible tiles

// time to set tiles falling
var nextFallTime;

// time to make new tile
var nextGenTime;

var nextBonusTime;

// (x, y) coordinates of the centers of the tiles that have been
// touched to create selectedTiles, in order
var selectedTiles;

var touchID;

var score;

// used by keypad
var conversionPrompt = "";
var binaryString;

// set up game (and make vertical)
// "V" means vertical
defineGame(GAME_NAME, "Laura Vonessen & Emilia Gan", TITLE_IMAGE_NAME, "V", false);

var gameHistory;

var oneThreshold = 0.5;

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
	initializeGameHistory();
	drawScreen();
}

// When a key is pushed
function onKeyStart(key) {
	lastKeyCode = key;
	if (key == 32){
		togglePause();
	}
}

function setPaused(newPause){
	if (paused != newPause ){
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
		onTouchMove(x,y,id);
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
			
			if ((selectedTiles.length == 0) ||
				(distance(tile.center, selectedTiles[selectedTiles.length - 1].center) < ADJ_BUFFER)) {
					
				// can only select landed tiles
				if (tile.state == "landed") {
					// The click was on this tile
					tile.selected = true;
					tile.state="selected";
					//selectedTiles = selectedTiles + tile.number;
					
					// insert it only if it's not in the list
					insertNoDup(selectedTiles, tile);
					
					drawScreen();
					return;
				}
			} // if adjacent
		} // if on a tile
	}
}

// When a touch ends, show key pad
function onTouchEnd(x, y, id) {
	// condition to show key pad
	if (touchID == id && selectedTiles.length > 0) {
		touchID = -1;
		setPaused(true);
		showKeyPad();
	}
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
			console.log(nextBonusTime+" and "+currentTime());
		}
		
		if (gameHistory.bonusComplete && nextBonusTime < currentTime()){
			gameHistory.numBonusDigits ++;
			setUpBonus(gameHistory.numBonusDigits);
		}
	}
}

// called by onTick at appropriate intervals
function onFall(){
	var x;
	var y;

	for (x = 0; x < BOARD_WIDTH; x++) {
		
		// we need to check y in direction 
		// BOARD_HEIGHT to 0 
		// to avoid having to track whether a 
		// tile has already fallen this turn or not
		for (y = BOARD_HEIGHT-1; y > 0; y --) {
			
			// check if the tile above should fall into this slot
			if (board[x][y-1].state == "falling" && board[x][y].state == "empty"){
				board[x][y].state = "falling";
				board[x][y].binary = board[x][y-1].binary;
				board[x][y-1].state="empty";
				board[x][y-1].binary="";
				
				// add one visible tile to that col
				if (y==1){
					numTilesInCol[x]++;
					visTiles++;
				}
				
				// if it's in the bottom row or the tile below it 
				// has landed, mark the current tile as landed
				if (y==BOARD_HEIGHT-1 || board[x][y+1].state=="landed" || board[x][y+1].state=="selected"){
					board[x][y].state = "landed";
				}
			}
		} 
	}
}

///////////////////////////////////////////////////////////////
//														 						//
//					 BOARD METHODS 					 					//

function generateTile(){
	// choose a column for the tile
	// includes invisible header tiles
	var freeSpaces = BOARD_HEIGHT * BOARD_WIDTH - visTiles;
	// don't need to keep generating tiles if the board is full
	if (freeSpaces<BOARD_WIDTH){
		return;
	}
	
	// choose column
	// prefer emptier columns
	var rand = randomInteger(0, freeSpaces - 1);
	var x=0;	
	while (rand > BOARD_HEIGHT - numTilesInCol[x] ){
		rand -= BOARD_HEIGHT - numTilesInCol[x];
		x ++;
	}
	
	// set text 0 or 1 and state falling
	board[x][0].binary=generateDigit();
	board[x][0].state="falling";
}

function generateDigit(){
	var digit = Math.random();
	if (digit > oneThreshold){
		return 1;
	}
	return 0;
}

// Generates a random board.
function initializeBoard() {
	var x;
	var y;
	var tile;
	var boardTL = boardTopLeft();
	
	col = [];
	visTiles = 0;
	
	selectedTiles = [];

	// Create an array of columns
	board = [];
	numTilesInCol = [];

	for (x = 0; x < BOARD_WIDTH; x ++) {
		// Create this column
		board[x] = [];
		numTilesInCol[x]=0;
		col.push(0);
		
		for (y = 0; y < BOARD_HEIGHT; y ++) {
			tile = makeObject();
			
			// Center of the tile in pixels
			tile.center = makeObject();			
			tile.center.x = boardTL.x + (x+.5) * TILE_SIZE;
			// y-1 hides row 0
			tile.center.y = boardTL.y + (y-1+.5) * TILE_SIZE;
			
			board[x][y] = tile;
			
			// set text, state
			resetTile(tile);
		}
	}
	
	// give something to work with
	y = BOARD_HEIGHT - 1;
	for (x = 0; x < BOARD_WIDTH; x ++) {
		board[x][y].binary = generateDigit();
		board[x][y].state = "landed";
	}
}

function resetTile(tile){
	tile.binary = ""; //could be 0, 1, or ""
	tile.state = "empty";
}

function removeSelectedTiles(){
	var bcoord;
	var i = 0;
	var by;
	
	for (i = 0; i < selectedTiles.length; i ++){
		bcoord = getBoardIndex(selectedTiles[i].center.x,selectedTiles[i].center.y);
		
		// remove one visible tile from that col
		numTilesInCol[bcoord.x]--;
		visTiles--;
		
		// clear tile
		resetTile(board[bcoord.x][bcoord.y]);
		
		// landed tiles above now need to continue falling
		for (by = bcoord.y - 1; by >= 0; by --){
			if (board[bcoord.x][by].state == "landed") {
				board[bcoord.x][by].state = "falling";
			}
		}
	}
	
	selectedTiles = [];
}

function resetSelectedTiles(){
	var bcoord;
	var i;
	var by;
	
	for (i = 0; i < selectedTiles.length; i++){
		bcoord = getBoardIndex(selectedTiles[i].center.x,selectedTiles[i].center.y);
		
		// set state back to landed
		board[bcoord.x][bcoord.y].state="landed";
	}

	selectedTiles = [];
}

//////////////////////////////////////////////////////////////
//														 						//
//					 HISTORY LOGIC					 						//

function initializeGameHistory(){
	gameHistory = makeObject();
	gameHistory.moves = [];
	gameHistory.moveSet = [];
	// list of objects
	gameHistory.preBonuses = [];
	// list of strings that get bonus or count toward bonus
	gameHistory.curBonuses = [];
	gameHistory.score = 0;
	gameHistory.moveArray = [];	
	
	gameHistory.numBonusDigits = 2;
	setUpBonus(gameHistory.numBonusDigits);
}

function setUpBonus(num){
	
	if (num >= 6){
		gameHistory.curBonuses = [];//[8,9,10,11,12,13,14,15];
		gameHistory.curBonusesFound = [];
		gameHistory.bonusText1 = "You've reached expert level!";
		gameHistory.bonusText2 = "";
		gameHistory.rewardText = "";
		gameHistory.reward = 0;
		gameHistory.bonusComplete = false;
		return;
	}
	
	var start = Math.pow(2, num-1);
	var i;
	gameHistory.curBonuses = [];//[8,9,10,11,12,13,14,15];
	gameHistory.curBonusesFound = [];
	for (i=start; i<start*2; i++){
		insertBack(gameHistory.curBonuses,i);
		gameHistory.curBonusesFound[i - start] = gameHistory.moveArray [ i ];
	}
	gameHistory.bonusText1 = "Find all "+num+"-digit numbers for a bonus!";
	gameHistory.bonusText2 = "Missing values:";
	gameHistory.rewardText = "You've completed the "+num+"-digit bonus!";
	gameHistory.reward = 4*start;
	gameHistory.bonusComplete = false;
}

function updateStats(score){
	// individual information about this number:
	var historyObj = makeObject();
	var numMoves = gameHistory.moves.length+1;
	var numUniqueMoves = gameHistory.moveSet.length;
	historyObj.rawBinary = asBinaryString(selectedTiles);
	historyObj.usefulBinary = stripLeading0s(historyObj.rawBinary);
	historyObj.prettyBinary = prettyBinaryString(historyObj.rawBinary);
	// count occurrences
	historyObj.numOnes = (historyObj.rawBinary.match(/1/g) || []).length;	
	historyObj.numZeroes = (historyObj.prettyBinary.match(/0/g) || []).length;
	historyObj.leadingZeroes = (historyObj.rawBinary.match(/0/g) || []).length - historyObj.numZeroes;
	historyObj.score = score;
	
	// update cumulative stats:	
	insertBack(gameHistory.moves, historyObj);
	gameHistory.score += score;
	insertNoDup(gameHistory.moveSet, score); //historyObj.usefulBinary);
	gameHistory.moveArray [ score ] = true;
	
	// check for bonuses
	var idx = index ( gameHistory.curBonuses, score );
	if ( idx != -1 ){
		gameHistory.curBonusesFound [ idx ] = true;
		var bonusComplete = true;
		var i;
		for (i = 0; i<gameHistory.curBonuses.length; i++){
			if (!gameHistory.curBonusesFound[i]){
				bonusComplete = false;
				break;
			}
		}
		if (bonusComplete){		
			gameHistory.bonusText1 = gameHistory.rewardText;
			gameHistory.bonusText2 = "+"+gameHistory.reward;
			gameHistory.score += gameHistory.reward;
			gameHistory.curBonuses = [];		
			gameHistory.bonusComplete = true;
			initializeBoard();
			nextBonusTime = currentTime()+BONUS_DELAY;
		}
	}
}

//////////////////////////////////////////////////////////////
//														 						//
//					 KEYPAD LOGIC 					 						//

// show key pad
function showKeyPad() {
	binaryString = prettyBinaryString(asBinaryString(selectedTiles));
	document.getElementById("show-key-pad").click();
}

// re-prompt
function reShowKeyPad(){
	binaryString = prettyBinaryString(asBinaryString(selectedTiles));
	document.getElementById("show-key-pad").click();
}

function onKeyPadCancel(){
	resetSelectedTiles();
}

// jQuery keypad in play.html calls this method 
function checkAns(decimal){

	// Was there a number entered?
	if (selectedTiles.length > 0) {
		// Was it a good conversion?
		if (isCorrect(asBinaryString(selectedTiles), decimal)) {
			updateStats(parseInt(decimal, 10));
			removeSelectedTiles();
			return true;
		}
	}
	return false;
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
	fillText("Score: "+gameHistory.score, screenWidth / 2, 190, makeColor(0.5, 0.5, 0.5),
			 "80px Arial", "center", "top");
			
	// bonus header
	fillText(gameHistory.bonusText1, screenWidth / 2, 290, makeColor(0.5, 0.5, 0.5),
			 "70px Arial", "center", "top");
	var offSet = 360;
	if (gameHistory.curBonuses.length <= 12){
		fillText(gameHistory.bonusText2, screenWidth / 2, 360, makeColor(0.5, 0.5, 0.5),
				 "70px Arial", "center", "top");
		offSet = 430;
	}
	
	// "bonusFound" "bonusMissing"
	// COLORS[tile.state]
	var numPerLine = Math.min(6,(gameHistory.curBonuses.length));
	var spacing = screenWidth / ( numPerLine+1 );
	var leftMargin = spacing;
	for (i=0; i<gameHistory.curBonuses.length; i++){
		if (i%numPerLine == 0 && gameHistory.curBonuses[i+numPerLine] == undefined && gameHistory.curBonuses.length % numPerLine != 0){
			leftMargin = (2 + numPerLine - gameHistory.curBonuses.length % numPerLine) / 2 * spacing;
		} 
		fillText(gameHistory.curBonuses[i], (i%numPerLine) * spacing + leftMargin, offSet+Math.floor(i/numPerLine)*90, gameHistory.curBonusesFound[i]?COLORS["bonusFound"]:COLORS["bonusMissing"],
			 "bold 90px Arial", "center", "top");
	}
	
	// score history
	var moveIndex = gameHistory.moves.length-1;
	var move;
	if (moveIndex >= 0){
		move = gameHistory.moves[moveIndex];
		fillText("Move: "+move.usefulBinary, screenWidth / 8, 630, makeColor(0.5, 0.5, 0.5),
			 "bold 90px Arial", "left", "top");
		fillText("+"+move.score, screenWidth - screenWidth / 8, 630, makeColor(0.5, 0.5, 0.5),
			 "bold 90px Arial", "right", "top");
	}

	// Board background
	
	var boardTL = boardTopLeft();
	fillRectangle(boardTL.x-BORDER, boardTL.y-BORDER,2*BORDER+ BOARD_WIDTH*TILE_SIZE, 2*BORDER+(BOARD_HEIGHT-1)*TILE_SIZE, BORDER_COLOR, CORNER);

	// Board
	for (bx = 0; bx < BOARD_WIDTH; bx ++) {

		for (by = 1; by < BOARD_HEIGHT; by ++) {
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
		}
	}

	// Draw the touch line
	for (i = 0; i < selectedTiles.length - 1; i++) {
		strokeLine(selectedTiles[i].center.x, selectedTiles[i].center.y,
				 selectedTiles[i + 1].center.x, selectedTiles[i + 1].center.y,
				 LINE_COLOR, 40);
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
	var xMargin = (screenWidth - TILE_SIZE * BOARD_WIDTH) / 2;
	var obj = {
		// SW-TS*BW is the sum of horizontal margins (in pixels)
		x: xMargin,
		// (SH-HS)...+HS leaves vertical space for a title
		// BH-1 ignores row 0
		y: screenHeight - xMargin - TILE_SIZE * (BOARD_HEIGHT-1) //((screenHeight - HEADER_SIZE) - TILE_SIZE * (BOARD_HEIGHT-1) ) / 2 + HEADER_SIZE
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

function asBinaryString(tiles){
	var str = "";
	var i;
	var l = tiles.length;
	for (i = 0; i < l; i ++){
		str += tiles[i].binary;	
	}
	return str;
}

function prettyBinaryString(str){
	var i;
	
	// strip leading zeroes
	str = stripLeading0s(str);
	
	for (i = str.length - 3; i > 0; i -= 3){
		str = str.slice(0,i) + " " + str.slice(i);
	}
	return str + "<sub>2</sub>";
}

function stripLeading0s(str){
	var i;
	
	// strip leading zeroes
	while (str.length > 1 && str.charAt(0)=="0"){
		str = str.slice(1);
	}
	return str;
}

// Returns true iff the decimal entered is the correct translation of the binary value
function isCorrect(selectedString,decimal) {
	var l = selectedString.length;
	var current;
	var currentValue = 1;
	var totalValue = 0;
	for (current = l - 1; current > -1; current --) {
		if (selectedString[current] == "1") {
			totalValue = totalValue + currentValue;
		}
		currentValue *= 2;
	}
	return totalValue == decimal;
}

function insertNoDup(list, element){
	var insert = true;
	var i;
	for (i = 0; i < list.length; i++) {
		if (list[i] == element ) {
			insert = false;		
		}
	}
	if (insert) {
		insertBack(list, element);
	}
}

function index(list, element){
	var i;
	for (i = 0; i < list.length; i++) {
		if (list[i] == element ) {
			return i;	
		}
	}
	return -1;
}






