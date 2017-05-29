// binaryTrace/game.js
//
// Sample word game, showing how to incorporate a dictionary and touch
// gestures.

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

include("wordlist.js");

var BACKGROUND_IMAGE          = loadImage("background.png");

var INACTIVE_VOWEL_IMAGE      = loadImage("inactive-vowel-button.png");
var INACTIVE_CONSONANT_IMAGE  = loadImage("inactive-consonant-button.png");
var ACTIVE_CONSONANT_IMAGE    = loadImage("active-button.png");
var ACTIVE_VOWEL_IMAGE        = ACTIVE_CONSONANT_IMAGE;

var GAME_OVER_IMAGE           = loadImage("gameover.png");

// In tiles
var BOARD_SIZE     = 4;

// In pixels
var TILE_SIZE      = 240;

// Percentages from http://en.wikipedia.org/wiki/Letter_frequency,
// adjusted to add up to 100 after rounding.  These are slightly
// different than the ones used in tracewordslite and have been
// tweaked to lead to words that are easier to spell.
var LETTER_FREQUENCY =
    //A   B    C    D    E     F    G    H    I    J    K
    [8.4, 1.5, 2.8, 4.3,12.8, 2.5, 2.1, 6.1, 7.3, 0.2, 0.8, 
     //L  M    N    O    P     Q    R    S    T    U    V
     4.0, 2.5, 6.8, 7.6, 1.9, 0.05, 6.0, 6.4, 9.3, 1.4, 1.0,
     //W   X    Y   Z
     2.4, 0.1, 1.9, 0.05];

// Code for debugging letter frequency
// for(i = 0; i < 26; ++i) { console.log(asciiCharacter(i + 65) + " " + LETTER_FREQUENCY[i]); }
// sum = 0; for (i = 0; i < 26; ++i) { sum += LETTER_FREQUENCY[i]; } console.log(sum);

var NONE           = -1;

// Valid phase values:
var PLAYING        = 0;
var TRANSITION     = 1;
var GAME_OVER      = 2;

// Will return to PLAYING
var PAUSED         = 3;

var ANIMATE_TRANSITION_TIME = 0.4; // seconds

var LINE_COLOR     = makeColor(.5, .4, .3, 0.4);

var WORDHISTORY_STYLE  = "100px Times New Roman";

var BAD_WORD_COLOR = makeColor( 0.6, 0, 0);
var MAX_BAD_WORDS  = 3;

var TOTAL_GAME_TIME = 120; // seconds


///////////////////////////////////////////////////////////////
//                                                           //
//                     MUTABLE STATE                         //

// Player's current points
var score;

// PLAYING or TRANSITION
var phase;

// Auto-advance to next board when this hits MAX_BAD_WORDS
var badWordCount   = 0;

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
    // touched to spell activeWord, in order
    activeWordLine : [],

    // tile[x][y] is the tile at that location in the grid.
    // Each element has a letter (which might be "Qu") and
    // a state: active.
    tile: []
};

// The board that was previously played (and is being animated away)
var oldBoard;

// We only allow one touch to trace at a time.  This is NONE
// if no touch is currently tracing or the ID of the active one.
var touchID;

// The word that is currently being spelled
var activeWord;

// Array of objects.  Each contains "word" and "points".  If points == 0,
// then it was a bad word
var wordHistory;

defineGame("Tracewords", "Morgan McGuire", "title.png", "V");

// Change the page background color
createTrim();

///////////////////////////////////////////////////////////////
//                                                           //
//                      EVENT RULES                          //

    

// When setup happens...
function onSetup() {
    wordHistory        = [];

    touchID        = NONE;

    phase          = PLAYING;

    // In the past
    nextPhaseTime  = 0;
    score          = 0;

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
                    if ((length(board.activeWordLine) == 0) ||
                        (distance(tile.center, board.activeWordLine[length(board.activeWordLine) - 1]) < TILE_SIZE * sqrt(2) * 1.1)) {

                        // The click was on this tile
                        tile.active = true;
                        activeWord = activeWord + tile.letter;
                        insertBack(board.activeWordLine, tile.center);
                        
                        drawScreen(0);
                        return;
                    } // if adjacent
                } // if on a tile
            } // bx
        } //by
        
    }
}


function onTouchEnd(x, y, id) {
    if ((phase == PLAYING) && (touchID == id)) {
        touchID = NONE;

        // Was any word at all entered?
        if (length(activeWord) > 0) {

            // Is it a legal word?
            if ((length(activeWord) >= 3) && isWord(activeWord)) {
                processGoodWord()
            } else {
                processBadWord();
            }
        }
    }
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

    // Sort words by length, longest to shortest
    wordHistory.sort(function(a, b) { return b.points - a.points; });
    
    c = 0;
    for (i = 0; i < length(wordHistory); ++i) {
        if (wordHistory[i].points > 0) {
            // Three columns
            x = (c % 3) * 400 + 75;
            y = 500 + floor(c / 3) * 75;
            fillText(wordHistory[i].word, x, y, makeColor(0.2, 0.2, 0.2), "75px Times New Roman", "left", "bottom");
            c = c + 1;
        }
    }
}


function processBadWord() {
    var bx;
    var by;
    var entry;

    entry        = makeObject();
    entry.points = 0;
    entry.word   = toUpperCase(activeWord);
    insertBack(wordHistory, entry);

    // TODO: Play buzzer sound
    board.activeWordLine = [];
    activeWord     = "";
    
    // Clear the pushed buttons
    for (bx = 0; bx < BOARD_SIZE; ++bx) {
        for (by = 0; by < BOARD_SIZE; ++by) {
            board.tile[bx][by].active = false;
        }
    }

    drawScreen(0);

    ++badWordCount;
    
    if (badWordCount == MAX_BAD_WORDS) {
        // Give up and transition to next board
        badWordCount = 0;
        startTransition();
    }
}


function processGoodWord() {
    var entry;

    // Record this word in the wordHistory list
    entry         = makeObject();
    entry.points  = pow(length(activeWord) - 1, 3) * 50;
    entry.word    = toUpperCase(activeWord);
    insertBack(wordHistory, entry);

    score        += entry.points;

    startTransition();
}


function startTransition() {
    // Set up for the next word
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
    activeWord     = "";
    badWordCount   = 0;
    touchID        = -1;
    drawScreen(0);
}

// Returns true iff w is a real English word
function isWord(w) {
    // This has to look through 64k words...but it only takes a
    // fraction of a second to do so.
    return indexOf(ENGLISH_WORD_LIST, toLowerCase(w)) != -1;
}


// Returns true if the letter is an upper-case vowel (not Y)
function isVowel(x) {
    return (x == "A") || (x == "E") || (x == "I") || (x == "O") || (x == "U");
}


// Generates a new random board.  Guarantees at least two vowels and no more 
// than five
function createRandomBoard() {
    var bx;
    var by;
    var tile;

    var numVowels;

    var board = {activeWordLine: [], tile: []};
    // Create an array of columns

    numVowels = 0;
    while ((numVowels < 2) || (numVowels > 5)) {
        numVowels = 0;
        for (bx = 0; bx < BOARD_SIZE; ++bx) {
            // Create this column
            board.tile[bx] = [];
            
            for (by = 0; by < BOARD_SIZE; ++by) {
                tile = makeObject();
                tile.letter = randomLetter();
                tile.active = false;
                
                // Center of the tile
                tile.center = makeObject();
                tile.center.x = (screenWidth  - TILE_SIZE * BOARD_SIZE) / 2 + (bx + 0.5) * TILE_SIZE;
                tile.center.y = (screenHeight - TILE_SIZE * BOARD_SIZE) / 2 + (by + 0.5) * TILE_SIZE - 280;
                
                board.tile[bx][by] = tile;


                if (isVowel(tile.letter)) {
                    numVowels = numVowels + 1;
                }

            } // by
        } // bx
    }

    return board;
}


// Generates a random letter, but treats "Qu" as a single tile and gives preference to
// letters based on their frequency in the English language.
function randomLetter() {
    // Choose a random percentile
    var r = randomReal(0, 100);
    var L;
    for (L = 0; (L < 26) && (r > LETTER_FREQUENCY[L]); ++L) {
        r -= LETTER_FREQUENCY[L];
    }
    
    // Convert to a letter
    L = asciiCharacter(asciiCode('A') + L);
    if (L == "Q") {
        return "Qu";
    } else {
        return L;
    }
}


function drawScreen(offset) {
    lastRedrawTime = currentTime();

    // Background
    drawImage(BACKGROUND_IMAGE);

    drawBoard(oldBoard, offset - screenWidth);
    drawBoard(board, offset);

    drawWordHistory();
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
                if (isVowel(tile.letter)) {
                    image = ACTIVE_VOWEL_IMAGE;
                } else {
                    image = ACTIVE_CONSONANT_IMAGE;
                }
            } else {
                offset = 0;
                if (isVowel(tile.letter)) {
                    image = INACTIVE_VOWEL_IMAGE;
                } else {
                    image = INACTIVE_CONSONANT_IMAGE;
                }
            }
          
            drawImage(image, x - image.width / 2, y - 104);

            // label
            fillText(tile.letter, x, y + offset,       
                     makeColor(0.2, 0.2, 0.2), 
                     "" + round(TILE_SIZE * 0.65) + "px Times New Roman", 
                     "center", 
                     "middle");
        } // by
    } // bx

    // Draw the line
    var spline = []
    for (i = 0; i < length(board.activeWordLine); ++i) {
        spline.push(board.activeWordLine[i].x + xoffset, board.activeWordLine[i].y);
    }
    strokeSpline(spline, LINE_COLOR, 60);
}


function drawWordHistory() {
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

    // Show up to five words from the wordHistory
    for (h = 0; h < min(length(wordHistory), 5); ++h) {
        // WordHistory goes backwards
        entry = wordHistory[length(wordHistory) - h - 1];

        if (entry.points == 0) {
            color = BAD_WORD_COLOR;
        } else {
            color = makeColor(0.2, 0.2, 0.2);
        }
        
        x = 140;
        y = screenHeight * 0.77 + h * 100;

        fillText(entry.word, x, y, color, WORDHISTORY_STYLE, "left", "bottom");

        if (entry.points == 0) {
            // Strikethrough
            strokeLine(x, y - 60, x + measureTextWidth(entry.word, WORDHISTORY_STYLE),
                       y - 60, color, 10);
        } else {
            // Draw points
            fillText("+" + numberWithCommas(entry.points), screenWidth - x, y, color, 
                     "90px Arial", "right", "bottom");
        }

    }
}


// From http://stackoverflow.com/questions/2901102/how-to-print-number-with-commas-as-thousands-separators-in-javascript
function numberWithCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}


