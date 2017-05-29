// binaryTrace/game.js
//
// Prototype game, showing how to count in binary.

// TODO:
// Sounds
// Pause
// Wildcard
// Size to screen for iPhone
// More points for changing direction
// High scores


///////////////////////////////////////////////////////////////
//                                                           //
//                    CONSTANT STATE                         //



var BACKGROUND_IMAGE          = loadImage("background.png");

var INACTIVE_IMAGE      = loadImage("regular-button.png");
var INACTIVE_BONUS_IMAGE  = loadImage("bonus-button.png");
var ACTIVE_IMAGE    = loadImage("active-button.png");
var ACTIVE_BONUS_IMAGE        = ACTIVE_IMAGE;

var GAME_OVER_IMAGE           = loadImage("gameover.png");

// In tiles
var BOARD_SIZE     = 4;

// In pixels
var TILE_SIZE      = 240;

// Percentages should add up to 100 after rounding.  
var NUMBER_FREQUENCY =
    //0  1  
    [40, 60];

var NONE           = -1;

// Valid phase values:
var PLAYING        = 0;
var TRANSITION     = 1;
var GAME_OVER      = 2;
var SHOW_BAD_NUMBER = 0;
var SHOW_GOOD_NUMBER = 1;
var SHOW_NUMBER_TIME = 1.5; // seconds

// Will return to PLAYING
var PAUSED         = 3;

var ANIMATE_TRANSITION_TIME = 0.4; // seconds

var LINE_COLOR     = makeColor(.5, .4, .3, 0.4);

var NUMBER_STYLE  = "100px Times New Roman";

var GOOD_GUESS = "";
var BAD_GUESS = "";

var BAD_NUMBER_COLOR = makeColor( 0.6, 0, 0);
var MAX_BAD_NUMBERS  = 3;

var TOTAL_GAME_TIME = 60; // seconds

var PERCENT_BONUS = 10; // percentage of tiles to designate as "bonus" tiles

///////////////////////////////////////////////////////////////
//                                                           //
//                     MUTABLE STATE                         //

// Player's current points
var score;

// PLAYING or TRANSITION
var phase;

// Auto-advance to next board when this hits MAX_BAD_NUMBERS
var badNumberCount   = 0;

// Wall-clock time at which we'll resume PLAYING phase
var nextPhaseTime;

// We store time left rather than the wall-clock time at which
// the game ends to allow pausing
var timeLeft; // in seconds

// Wall-clock time
var lastOnTickTime;

var lastRedrawTime;

var board = {
    // (x, y) coordinates of the centers of the tiles that have been
    // touched to spell activeNumber, in order
    activeNumberLine : [],

    // tile[x][y] is the tile at that location in the grid.
    // Each element has a number (which might be "0" or "1") and
    // a state: active.
    tile: []
};

// The board that was previously played (and is being animated away)
var oldBoard;

// We only allow one touch to trace at a time.  This is NONE
// if no touch is currently tracing or the ID of the active one.
var touchID;

// The number that is currently being formed
var activeNumber = "";

// The current decimal guess
var activeDecimal;

// The minimum length allowed for activeNumber
var minLength = 2;
var maxLength = 10;

// Array of objects.  Each contains "number" and count.  
var numberHistory;

defineGame("BinaryTrace", "Emilia Gan & Laura Vonessen", "title.png", "V");

// Change the page background color
createTrim();

///////////////////////////////////////////////////////////////
//                                                           //
//                      EVENT RULES                          //

    

// When setup happens...
function onSetup() {
    console.log("IN ON SETUP");
    numberHistory        = [];

    touchID        = NONE;

    phase          = PLAYING;

    // In the past
    nextPhaseTime  = 0;
    score          = 0;
    minLength      = 2;

    board          = createRandomBoard();

    oldBoard       = board;
    
    timeLeft       = TOTAL_GAME_TIME;
    lastOnTickTime = currentTime();
    lastRedrawTime = 0;

    resetBoard();
}


function onTouchStart(x, y, id) {
    if ((phase == PLAYING) && (touchID == NONE)) {
        touchID = id;
        // Process it in the same way as move
        onTouchMove(x, y, id);

    } else if ((phase == GAME_OVER) &&
               (currentTime() > nextPhaseTime) && 
               (y > screenHeight * 0.8)) {
        
        // Restart the game
        onSetup();
        
    }
}


function onTouchMove(x, y, id) {
    if (phase != PLAYING) {
        return;
    }

    var bx;
    var by;
    var tile;

    var point;
    point = makeObject();
    point.x = x;
    point.y = y;

    if (touchID == id) {
        // See which tile was touched
        
        for (bx = 0; bx < BOARD_SIZE; ++bx) {

            for (by = 0; by < BOARD_SIZE; ++by) {
                tile = board.tile[bx][by];
                
                // Is the distance less than 1/3 of a tile width away
                // from a center (we use 1/2.5 instead of 1/2 to avoid
                // false positives)
                if ((distance(tile.center, point) < TILE_SIZE / 2.5) &&
                    ! tile.active) {
                    
                    // If the touch was moved really fast, or was due
                    // to a mouse pointer that went outside the
                    // window, the player could cheat and select two
                    // tiles that aren't adjacent.  verify that this
                    // tile is adjacent to the previous one
                    // horizontally, vertically, or diagonally.
                    if ((length(board.activeNumberLine) == 0) ||
                        (distance(tile.center, board.activeNumberLine[length(board.activeNumberLine) - 1]) < TILE_SIZE * sqrt(2) * 1.1)) {

                        // The click was on this tile
                        tile.active = true;
                        activeNumber = activeNumber + tile.number;
                        insertBack(board.activeNumberLine, tile.center);
                        
                        drawScreen(0);
                        return;
                    } // if adjacent
                } // if on a tile
            } // bx
        } //by
        
    }
}


function onTouchEnd(x, y, id) {
    var binaryPrompt = "Enter in your decimal conversion for: " + activeNumber;
    
    activeDecimal = window.prompt(binaryPrompt);
    console.log("Active number is: ", activeNumber);
    console.log("Active decimal is: ", activeDecimal);
    if ((phase == PLAYING) && (touchID == id)) {
        touchID = NONE;

        // Was any number at all entered?
        if (length(activeNumber) > 0) {
            
            // Is it a legal number?
            if (length(activeNumber) >= minLength && isCorrect(activeNumber, activeDecimal)){
                processGoodGuess();
            } else {
                processBadGuess();
            }
        }
    }
    activeNumber = "";
}



function onTick() {
    // Update the timer
    var now = currentTime();
    var deltaTime = now - lastOnTickTime;
    lastOnTickTime = now;
    timeLeft -= deltaTime;

    if (phase == TRANSITION) {

        if (currentTime() > nextPhaseTime) {
            // Advance to the next board
            phase = PLAYING;
            resetBoard();
        } else {
            var offset = screenWidth * 
                min(1.0, max(0.0, (nextPhaseTime - currentTime()) / ANIMATE_TRANSITION_TIME));
            drawScreen(offset);
        }

    } else if (phase == PLAYING) {

        if (now > lastRedrawTime + 1) {
            // Draw the screen so that the timer can update at least
            // once a second
            drawScreen(0);
        }

        if (timeLeft < 0) {
            phase = GAME_OVER;
            
            // Don't let a new game start for at least one second to
            // prevent touches that happened right when we switched modes
            nextPhaseTime = currentTime() + 1;
            drawGameOverScreen();
        }
    }
}

///////////////////////////////////////////////////////////////
//                                                           //
//                      HELPER RULES                         //

function drawGameOverScreen() {
    var i, c, x, y;
    drawImage(GAME_OVER_IMAGE);

    fillText("Score: " + numberWithCommas(score), screenWidth / 2, 250, makeColor(0,0,0), "bold 95px Arial", "center", "top");
    
    fillText("Score: " + numberWithCommas(score), screenWidth / 2, 250, makeColor(0,0,0), "bold 95px Arial", "center", "top");

    // Determine skill level gained and next skill level
    var skillLevel;
    if (score < 128) {
        skillLevel = "Novice";
    }
    else if (score < 256) {
        skillLevel = "Beginner";
    }
    else if (score < 512) {
        skillLevel = "Pretty Good";
    }
    else if (score < 1024) {
        skillLevel = "Advanced";
    }
    else if (score < 2048) {
        skillLevel = "Expert";
    }
    else {
        skillLevel = "Genius";
    }

    var nextLevel;
    switch (skillLevel)
    {
       case "Novice": 
        nextLevel = "Beginner";
        break;
       
       case "Beginner": 
        nextLevel = "Pretty Good";
        break;
       
       case "Pretty Good": 
        nextLevel = "Advanced";
        break;

       case "Advanced": 
        nextLevel = "Expert";
        break;

       case "Expert": 
        nextLevel = "Genius";
        break;
       
       default: 
        nextLevel = "This game has no chance against you!";
    }

    
    console.log("YOUR SKILL LEVEL IS: " + skillLevel);
    console.log("Next Skill Level: " + nextLevel);
    console.log("SCORE: " + score.toString());

    var gameOverString1 = "GAME OVER!";
    var gameOverString2 = "Binary counting skill level is: " + skillLevel;
    var gameOverString3;
    if(skillLevel == "Genius") {
        console.log("TRUE");
        gameOverString3 = "";
    }
    else {
        console.log("FALSE");
        gameOverString3 = "Play again to try advancing to the next level: ";
    }
    var gameOverString4 = nextLevel;    

    fillText(gameOverString1, screenWidth / 2, screenHeight * 0.6, makeColor(0.2, 0.2, 0.2), "bold 95px Arial", "center", "bottom");
    fillText(gameOverString2, screenWidth / 2, screenHeight * 0.675, makeColor(0.2, 0.2, 0.2), "bold 45px Arial", "center", "bottom");
    fillText(gameOverString3, screenWidth / 2, screenHeight * 0.725, makeColor(0.2, 0.2, 0.2), "bold 45px Arial", "center", "bottom");
    fillText(gameOverString4, screenWidth / 2, screenHeight * 0.775, makeColor(0.2, 0.2, 0.2), "bold 45px Arial", "center", "bottom");

}


function processBadGuess() {
    var bx;
    var by;
    var entry;
    console.log("PROCESSING BAD GUESS");

    entry        = makeObject();
    entry.points = 0;
    entry.number   = toUpperCase(activeNumber);
    insertBack(numberHistory, entry);

    // TODO: Play buzzer sound
    board.activeNumberLine = [];
    activeNumber     = "";
    
    // Clear the pushed buttons
    for (bx = 0; bx < BOARD_SIZE; ++bx) {
        for (by = 0; by < BOARD_SIZE; ++by) {
            board.tile[bx][by].active = false;
        }
    }

    drawScreen(0);

    ++badNumberCount;
    
    if (badNumberCount == MAX_BAD_NUMBERS) {
        // Give up and transition to next board
        badNumberCount = 0;
        startTransition();
    }
}


function processGoodGuess() {
    var entry;
    console.log("PROCESSING GOOD GUESS");
    // Record this number in the numberHistory list
    entry         = makeObject();
    entry.decimal  = parseInt(activeDecimal, 10);
    entry.number    = toUpperCase(activeNumber);
    //insertBack(numberHistory, entry);

    score        += entry.decimal;

    startTransition();
}


function startTransition() {
    // Set up for the next number
    nextPhaseTime = currentTime() + ANIMATE_TRANSITION_TIME;
    phase         = TRANSITION;

    // Prepare the animation
    oldBoard      = board;
    board         = createRandomBoard();
}


// Returns the distance between P1 and P2, which must each have
// x and y properties.
function distance(P1, P2) {
    return sqrt(pow(P1.x - P2.x, 2) + pow(P1.y - P2.y, 2));
}


function resetBoard() {
    activeNumber     = "";
    badNumberCount   = 0;
    touchID        = -1;
    drawScreen(0);
}

// Generates a new random board.  Guarantees at least two vowels and no more 
// than five
function createRandomBoard() {
    var bx;
    var by;
    var tile;

    var board = {activeNumberLine: [], tile: []};
    // Create an array of columns

    for (bx = 0; bx < BOARD_SIZE; ++bx) {
        // Create this column
        board.tile[bx] = [];
        
        for (by = 0; by < BOARD_SIZE; ++by) {
            tile = makeObject();
            tile.number= randomNumber();
            //tile.bonus = randomBonus();
            tile.active = false;
            
            // Center of the tile
            tile.center = makeObject();
            tile.center.x = (screenWidth  - TILE_SIZE * BOARD_SIZE) / 2 + (bx + 0.5) * TILE_SIZE;
            tile.center.y = (screenHeight - TILE_SIZE * BOARD_SIZE) / 2 + (by + 0.5) * TILE_SIZE - 280;
            
            board.tile[bx][by] = tile;

        } // by
    } // bx

    return board;
}


// Generates a random number, "0" or "1".
function randomNumber() {
    // Choose a random percentile
    var r = randomReal(0, 100);
    var N = 0;
    if(r > NUMBER_FREQUENCY[N]) {
        N = 1;
    }
    
    // Convert to a number
    N = asciiCharacter(48 + N);
    return N;

}


function drawScreen(offset) {
    lastRedrawTime = currentTime();

    // Background
    drawImage(BACKGROUND_IMAGE);

    drawBoard(oldBoard, offset - screenWidth);
    drawBoard(board, offset);

    drawNumberHistory();
}


function createTrim() {
    // Alter the background of the web page to extend the background visually
    var body = document.getElementsByTagName("body")[0];
    body.style.cssText += "background: url('trim.png');";
}



function drawBoard(board, xoffset) {
    var BORDER = 4;
    var BORDER_COLOR = makeColor(0.4, 0.4, 0.4);
    var THICKNESS = 16;

    var x, y;
    var tile;
    var bx, by;
    var offset;
    var color;
    var i;
    var image;

    for (bx = 0; bx < BOARD_SIZE; ++bx) {
        for (by = 0; by < BOARD_SIZE; ++by) {
            tile = board.tile[bx][by];
            x = tile.center.x + xoffset;
            y = tile.center.y;

            // push the top down if active
            if (tile.active) {
                offset = THICKNESS - 1;
                image = ACTIVE_IMAGE;
            } else {
                offset = 0;
                if (tile.bonus == true) {
                    image = INACTIVE_BONUS_IMAGE;
                } else {
                    image = INACTIVE_IMAGE;
                }
            }
          
            drawImage(image, x - image.width / 2, y - 104);

            // label
            fillText(tile.number, x, y + offset,       
                     makeColor(0.2, 0.2, 0.2), 
                     "" + round(TILE_SIZE * 0.65) + "px Times New Roman", 
                     "center", 
                     "middle");
        } // by
    } // bx

    // Draw the line
    var spline = []
    for (i = 0; i < length(board.activeNumberLine); ++i) {
        spline.push(board.activeNumberLine[i].x + xoffset, board.activeNumberLine[i].y);
    }
    strokeSpline(spline, LINE_COLOR, 60);
}


function drawNumberHistory() {
    var h;
    var color;
    var entry;
    var x, y;
    
    // Timer bar:
    var fraction = max(0, timeLeft / TOTAL_GAME_TIME);
    fillRectangle(116, 1215, 1050 * fraction, 123, makeColor(0, 0.4, 0.1, 0.25));

    fillText(numberWithCommas(score) + " pts", screenWidth / 2, screenHeight * 0.637,
             makeColor(0.1, 0.6, 0.3),
             "bold 95px Arial", "center", "top");

    // Show up to five numbers from the numberHistory
    for (h = 0; h < min(length(numberHistory), 5); ++h) {
        // NumberHistory goes backwards
        entry = activeDecimal;

        if (entry.decimal == 0) {
            color = BAD_NUMBER_COLOR;
        } else {
            color = makeColor(0.2, 0.2, 0.2);
        }
        
        x = 140;
        y = screenHeight * 0.77 + h * 100;

        fillText(entry.word, x, y, color, NUMBER_STYLE, "left", "bottom");
        // ***** THIS IS FOR THE TEXT BELOW THE PLAYING SCREEN *****
        //fillText(score, x, y, color, NUMBER_STYLE, "left", "bottom");

        // Draw points
        //fillText("+" + numberWithCommas(score), screenWidth - x, y, color, 
        //             "90px Arial", "right", "bottom");
    }
}


// From http://stackoverflow.com/questions/2901102/how-to-print-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Returns true iff the base 10 number entered is the correct translation of the binary value
function isCorrect(w,decimal) {
    console.log(w);
    totalValue = convertToDecimal(w)
    return totalValue == decimal;
}

// Convert binary value to base 10 value
function convertToDecimal(binaryNum) {
    var l = length(binaryNum);
    var current = l - 1;
    var currentValue = 1;
    var totalValue = 0;
    while (current > -1) {
        if (binaryNum[current] == "1") {
            totalValue = totalValue + currentValue;
        }
        current = current - 1;
        currentValue = currentValue * 2;
    }
    return totalValue;
}
