// binarytrace/game.js
//
// Prototype game for teaching counting in binary.
//
// Modeled after code provided at https://casual-effects.com/codeheart/examples/tracewordslite/
// and https://casual-effects.com/codeheart/examples/tracewords/

///////////////////////////////////////////////////////////////
//                                                           //
//                    CONSTANT STATE                         //


// In tiles
var BOARD_SIZE     = 4;

// In pixels
var TILE_SIZE      = 240;

// Percentages from http://en.wikipedia.org/wiki/Letter_frequency,
// adjusted to add up to 100 after rounding
// Percentages from http://en.wikipedia.org/wiki/Letter_frequency,
// adjusted to add up to 100 after rounding
var NUMBER_FREQUENCY =
    //0   1   
    [40, 60];

var NONE           = -1;

var SHOW_NUMBER_TIME = 1.5; // seconds
var TOTAL_GAME_TIME = 90; // seconds

var PLAYING        = 0;
var SHOW_GOOD_NUMBER = 1;
var GAME_OVER      = 2;
var SHOW_BAD_NUMBER = 0;

var LINE_COLOR     = makeColor(.5, .4, .3, 0.4);



///////////////////////////////////////////////////////////////
//                                                           //
//                     MUTABLE STATE                         //

var score;

// PLAYING or SCORING
var phase;

var nextPhaseTime;

// board[x][y] is the tile at that location in the grid.
// Each element has a number (which might be "0" or "1") and
// a state: active
var board;

// We only allow one touch to trace at a time.  This is NONE
// if no touch is currently tracing or the ID of the active one.
var touchID;

// The number that is currently being selected
var activeNumber; 

// The minimum length allowed for activeNumber
var minLength

// The current decimal guess;
var activeDecimal;

// (x, y) coordinates of the centers of the tiles that have been
// touched to create activeNumber, in order
var activeNumberLine;

var timeLeft; // in seconds


///////////////////////////////////////////////////////////////
//                                                           //
//                      EVENT RULES                          //

// When setup happens...
function onSetup() {
    touchID        = NONE;
    phase          = PLAYING;

    // In the past
    nextPhaseTime  = 0;
    score          = 0;
    minLength      = 2;
    maxLength      = 10;
    
    timeLeft       = TOTAL_GAME_TIME;
    lastOnTickTime = currentTime();
    lastRedrawTime = 0;

    resetBoard();
}


function onTouchStart(x, y, id) {
    if (touchID == NONE) {
        touchID = id;
        // Process it in the same way as move
        onTouchMove(x, y, id);
    }
}


function onTouchMove(x, y, id) {
    var bx;
    var by;
    var tile;

    var point;
    point = makeObject();
    point.x = x;
    point.y = y;

    if (touchID == id) {
        // See which tile was touched
        bx = 0;
        while (bx < BOARD_SIZE) {

            by = 0;
            while (by < BOARD_SIZE) {
                tile = board[bx][by];
                
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
                    
                    if ((length(activeNumberLine) == 0) ||
                        (distance(tile.center, activeNumberLine[length(activeNumberLine) - 1]) < TILE_SIZE * sqrt(2) * 1.1)) {

                        // The click was on this tile
                        tile.active = true;
                        activeNumber = activeNumber + tile.number;
                        insertBack(activeNumberLine, tile.center);
                        
                        drawScreen();
                        return;
                    } // if adjacent
                } // if on a tile

                by = by + 1;
            }

            bx = bx + 1;
        }
        
    }
}


function onTouchEnd(x, y, id) {
    var decimal;
    var binaryPrompt = "Enter in your decimal conversion for: " + toUpperCase(activeNumber);
    var binaryBadPrompt = "That is incorrect. Enter in a new conversion for: " + toUpperCase(activeNumber);

    if (touchID == id) {
        touchID = NONE;

        // Was there a number entered?
        if (length(activeNumber) > 0) {
            // Was it a good conversion?
            if (length(activeNumber) >= minLength) {
                activeDecimal = window.prompt(binaryPrompt);
                decimal = activeDecimal;
                if (isCorrect(activeNumber, decimal)) {
                    SHOW_BAD_NUMBER = 0;
                    nextPhaseTime = currentTime() + SHOW_NUMBER_TIME;
                    phase         = SHOW_GOOD_NUMBER;
                    score = score + parseInt(decimal, 10);
                    if (minLength < maxLength) {
                        minLength = minLength + 1;
                    }
                }
                else {
                    SHOW_BAD_NUMBER = 1;
                    while (SHOW_BAD_NUMBER == 1) {
                        // Give player another chance to enter good guess
                        activeDecimal = window.prompt(binaryBadPrompt);
                        decimal = activeDecimal;
                        if (isCorrect(activeNumber, decimal)) {
                            SHOW_BAD_NUMBER = 0;
                            nextPhaseTime = currentTime() + SHOW_NUMBER_TIME;
                            phase         = SHOW_GOOD_NUMBER;
                            score = score + length(activeNumber);
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
    }
}


function onTick() {
    // Update the timer
    var now = currentTime();
    var deltaTime = now - lastOnTickTime;
    lastOnTickTime = now;
    timeLeft -= deltaTime;

    if ((phase == SHOW_GOOD_NUMBER) && (currentTime() > nextPhaseTime)) {
        // Advance to the next board
        if (timeLeft > 0) {
            phase = PLAYING;
            resetBoard();
        }
        else {
            phase = GAME_OVER;
            resetBoard();
            var skillLevel;
            if (score < 128) {
                skillLevel = "Novice";
            }
            else if (score < 256) {
                skillLevel = "Beginner";
            }
            else if (score < 512) {
                skillLevel = "Pretty Good"
            }
            else if (score < 1024) {
                skillLevel = "Advanced"
            }
            else {
                skillLevel = "Expert"
            }
            var gameOverString = "GAME OVER! Your final score was: " + score + "\n\n" +
            "Your binary counting skill level is: " + skillLevel +
            "\n\nClick \"OK\" to play again \nor\nClick \"Cancel\" to close tab." ;
            var playAgain = window.confirm(gameOverString);
            if (playAgain == true) {
                onSetup();
            }
            else {
                window.close();
            }
        }
    }

}

///////////////////////////////////////////////////////////////
//                                                           //
//                      HELPER RULES                         //


function drawGameOverScreen() {

    drawImage(GAME_OVER_IMAGE);

    fillText("Score: " + numberWithCommas(score), screenWidth / 2, 250, makeColor(0,0,0), "bold 95px Arial", "center", "top");

}


// Returns the distance between P1 and P2, which must each have
// x and y properties.
function distance(P1, P2) {
    return sqrt(pow(P1.x - P2.x, 2) + pow(P1.y - P2.y, 2));
}


function resetBoard() {
    score = score;
    activeNumberLine = [];
    activeNumber    = "";
    activeDecimal = "";
    randomizeBoard();
    drawScreen();
}


// Returns true iff the decimal entered is the correct translation of the binary value
function isCorrect(w,decimal) {
    console.log(w);
    var l = length(w);
    var current = l - 1;
    var currentValue = 1;
    var totalValue = 0;
    while (current > -1) {
        if (w[current] == "1") {
            totalValue = totalValue + currentValue;
        }
        current = current - 1;
        currentValue = currentValue * 2;

    }
    return totalValue == decimal;
}


// Generates a random board.
function randomizeBoard() {
    var x;
    var y;
    var tile;

    var numVowels;

    // Create an array of columns
    board = [];

    x = 0;
    while (x < BOARD_SIZE) {
        // Create this column
        board[x] = [];
        
        y = 0;
        while (y < BOARD_SIZE) {
            tile = makeObject();
            tile.number= randomNumber();
            tile.active = false;
            
            // Center of the tile in pixels
            tile.center = makeObject();
            tile.center.x = (screenWidth - TILE_SIZE * BOARD_SIZE) / 2 + (x + 0.5) * TILE_SIZE;
            tile.center.y = (screenHeight - TILE_SIZE * BOARD_SIZE) / 2 + (y + 0.5) * TILE_SIZE + 100;
            
            board[x][y] = tile;
            
            y = y + 1;
        }  
        x = x + 1;
    }
}


// Generates a random letter, but treats "Qu" as a single tile and gives preference to
// letters based on their frequency in the English language.
function randomNumber() {
    // Choose a random percentile
    var r = randomReal(0, 100);
    N = 0;
    if (r > NUMBER_FREQUENCY[N]) {
        N = 1;
    }
    N = asciiCharacter(48 + N);
    // Return either 0 or 1 in ASCII
    return N;
}


function drawScreen() {
    var BORDER = 4;
    var BORDER_COLOR = makeColor(0.4, 0.4, 0.4);
    var THICKNESS = 16;

    var x;
    var y;
    var tile;
    var bx;
    var by;
    var offset;
    var color;
    var i;
    var displayString = toUpperCase(activeNumber) +  " = " + toUpperCase(activeDecimal);
    var displayScoreString = "Score: " + score;

    // Background
    fillRectangle(0, 0, screenWidth, screenHeight, makeColor(1, 1, 1));
    fillText("TraceBinary Prototype", screenWidth / 2, 20, makeColor(0.5, 0.5, 0.5),
             "100px Arial", "center", "top");

    if (phase == SHOW_GOOD_NUMBER) {

        fillText(displayString, screenWidth / 2, 130, makeColor(0.1, 0.6, 0.3),
                 "bold 115px Times New Roman", "center", "top");
    }

    else {
        fillText(displayScoreString, screenWidth / 2, 130, makeColor(0.1, 0.3, 0.6),
                 "bold 115px Times New Roman", "center", "top");
    }

    // Board
    bx = 0;
    while (bx < BOARD_SIZE) {

        by = 0;
        while (by < BOARD_SIZE) {
            tile = board[bx][by];
            x = tile.center.x;
            y = tile.center.y;

            // Make the tiles look 3D
            // shadow
            fillCircle(x, y + THICKNESS + 4, TILE_SIZE / 2 - BORDER, 
                       makeColor(0.5, 0.6, 0.5, 0.5));

            // sides
            fillCircle(x, y + THICKNESS, TILE_SIZE / 2 - BORDER - 8, makeColor(0.8, 0.8, 0.7));
            strokeCircle(x, y + THICKNESS, TILE_SIZE / 2 - BORDER - 8, BORDER_COLOR, BORDER);

            // push the top down if active
            if (tile.active) {
                offset = THICKNESS - 1;
                color = makeColor(1, 1, 0.85);
            } else {
                offset = 0;
                color = makeColor(1, 1, 0.95);
            }
          
            // top
            fillCircle(x, y + offset, TILE_SIZE / 2 - BORDER - 7, color);
            strokeCircle(x, y + offset, TILE_SIZE / 2 - BORDER - 7, BORDER_COLOR, BORDER);

            // label
            fillText(tile.number, x, y + offset,       
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
