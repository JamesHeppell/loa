var NUMBER_OF_COLS = 8,
	NUMBER_OF_ROWS = 8,
	BLOCK_SIZE = 100;

//TODO enable a n by n board n >= 3

var BLOCK_COLOUR_1 = '#9f7119',
	BLOCK_COLOUR_2 = '#debf83',
	HIGHLIGHT_COLOUR = '#fb0006',
    POSSIBLE_MOVE_COLOUR = 'blue';

var piecePositions = null;

var PIECE_PAWN = 0,
	IN_PLAY = 0,
	TAKEN = 1,
	pieces = null,
	ctx = null,
	json = null,
	canvas = null,
	BLACK_TEAM = 0,
	WHITE_TEAM = 1,
	SELECT_LINE_WIDTH = 5,
	currentTurn = WHITE_TEAM,
	selectedPiece = null;

var GAME_FINISHED = false;
var WINNING_PLAYER = "White";

var POSSIBLE_MOVES = [];

var GAME_RECORD = {"size":NUMBER_OF_COLS,
                   "moveList":[]};

function screenToBlock(x, y) {
	var block =  {
		"row": Math.floor(y / BLOCK_SIZE),
		"col": Math.floor(x / BLOCK_SIZE)
	};

	return block;
}

function getPieceAtBlockForTeam(teamOfPieces, clickedBlock) {

	var curPiece = null,
		iPieceCounter = 0,
		pieceAtBlock = null;

	for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {

		curPiece = teamOfPieces[iPieceCounter];

		if (curPiece.status === IN_PLAY &&
				curPiece.col === clickedBlock.col &&
				curPiece.row === clickedBlock.row) {
			curPiece.position = iPieceCounter;

			pieceAtBlock = curPiece;
			iPieceCounter = teamOfPieces.length;
		}
	}

	return pieceAtBlock;
}

function blockOccupiedByEnemy(clickedBlock) {
	var team = (currentTurn === BLACK_TEAM ? json.white : json.black);

	return getPieceAtBlockForTeam(team, clickedBlock);
}

function isPieceAtBlock(curPiece, row, col){
    return (curPiece.row == row && curPiece.col == col);
}

function blockOccupied(clickedBlock) {
	var pieceAtBlock = getPieceAtBlockForTeam(json.black, clickedBlock);

	if (pieceAtBlock === null) {
		pieceAtBlock = getPieceAtBlockForTeam(json.white, clickedBlock);
	}

	return (pieceAtBlock !== null);
}

function canPawnMoveToBlock(selectedPiece, clickedBlock) {
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        if(clickedBlock.col == POSSIBLE_MOVES[i].col &&
           clickedBlock.row == POSSIBLE_MOVES[i].row){
            return true;
        }
    }
	return false;
}

function setPossibleMoves(pieceAtBlock){
    //assume selected peice has been set!
    POSSIBLE_MOVES = [];
    
    //check move by slected piece
    checkMove(pieceAtBlock)

}


function countPeiecesInAllDirections(curPiece){
    var pieceNumDir = {"horizontal":0, "vertical":0, "forwardSlash":0, "backSlash ":0};
    
    //horizontal
    var pieceCount = 0;
    for (var col = 0;col<NUMBER_OF_COLS;col++){
        if (blockOccupied({"row":curPiece.row, "col":col})){
            pieceCount++;
        }
    }
    pieceNumDir.horizontal = pieceCount;

    //vertical
    pieceCount = 0;
    for (var row = 0;row<NUMBER_OF_ROWS;row++){
        if (blockOccupied({"col":curPiece.col, "row":row})){
            pieceCount++;
        }
    }
    pieceNumDir.vertical = pieceCount;
    
    //forwardSlash
    pieceCount = 1; //acount for selected piece
    for (var m = 1;m<NUMBER_OF_COLS;m++){
        if ( curPiece.row + m < NUMBER_OF_ROWS &&
             curPiece.col - m >= 0){
            if (blockOccupied({"row":curPiece.row + m, "col":curPiece.col - m})){
                pieceCount++;
            }
        }
        if ( curPiece.row - m >= 0  &&
             curPiece.col + m < NUMBER_OF_COLS){
            if (blockOccupied({"row":curPiece.row - m, "col":curPiece.col + m})){
                pieceCount++;
            }
        }
    }
    pieceNumDir.forwardSlash = pieceCount;
    
    //(top left is 0,0) check backSlash 
    pieceCount = 1; //acount for selected piece
    for (var n = 1;n<NUMBER_OF_COLS;n++){
        if ( curPiece.row + n < NUMBER_OF_ROWS &&
             curPiece.col + n < NUMBER_OF_COLS){
            if (blockOccupied({"row":curPiece.row + n, "col":curPiece.col + n})){
                pieceCount++;
            }
        }
        if ( curPiece.row - n >= 0 &&
             curPiece.col - n >= 0 ){
            if (blockOccupied({"row":curPiece.row - n, "col":curPiece.col - n})){
                pieceCount++;
            }
        }
    }
    pieceNumDir.backSlash  = pieceCount;
    
    
    return pieceNumDir;
}


function checkMove(pieceAtBlock){
    var pieceNumDir = countPeiecesInAllDirections(pieceAtBlock);
    
    //horizontal
    var dist = pieceNumDir.horizontal;
    for (var i=1; i>-2; i=i-2){
        //i=1 forward, i=-1 back
        var rowToConsider = pieceAtBlock.row ;
        var colToConsider = pieceAtBlock.col + i*dist;
        considerMoveOption(rowToConsider, colToConsider, pieceAtBlock, dist)
    }
    
    //vertical
    dist = pieceNumDir.vertical;
    for (i=1; i>-2; i=i-2){
        //i=1 forward, i=-1 back
        rowToConsider = pieceAtBlock.row + i*dist ;
        colToConsider = pieceAtBlock.col;
        considerMoveOption(rowToConsider, colToConsider, pieceAtBlock, dist)
    }
    
    //forwardSlash
    dist = pieceNumDir.forwardSlash;
    for (i=1; i>-2; i=i-2){
        //i=1 forward, i=-1 back
        rowToConsider = pieceAtBlock.row - i*dist;
        colToConsider = pieceAtBlock.col + i*dist;
        considerMoveOption(rowToConsider, colToConsider, pieceAtBlock, dist)
    }
    
    //backSlash
    dist = pieceNumDir.backSlash;
    for (i=1; i>-2; i=i-2){
        //i=1 forward, i=-1 back
        rowToConsider = pieceAtBlock.row + i*dist;
        colToConsider = pieceAtBlock.col + i*dist;
        considerMoveOption(rowToConsider, colToConsider, pieceAtBlock, dist)
    }
    

}


function considerMoveOption(rowToConsider, colToConsider, pieceAtBlock, dist){
    if (rowToConsider < 0 || 
        rowToConsider >= NUMBER_OF_ROWS || 
        colToConsider < 0 || 
        colToConsider >= NUMBER_OF_COLS
        ){
        // not a valid block to consider
    } else{
        //check if block is empty of current turn peice, if yes add to moves
        var blockPos = {"row":rowToConsider, "col":colToConsider};
        //also check no emepy peice blocking!
        //TODO
        var inBetweenBlocks = getinBetweenBlocks(rowToConsider, colToConsider, pieceAtBlock, dist);
        for (var i=0; i<inBetweenBlocks.length;i++){
            if (blockOccupiedByEnemy(inBetweenBlocks[i])){
                //Blocking peice end function call.
                return;
            }
        }
        
        if (!blockOccupied(blockPos)){
            POSSIBLE_MOVES.push(blockPos);
        } else if(blockOccupiedByEnemy(blockPos)){
            POSSIBLE_MOVES.push(blockPos);
        }
    }
}

function getinBetweenBlocks(rowToConsider, colToConsider, pieceAtBlock, dist){
    var startrow = pieceAtBlock.row;
    var startcol = pieceAtBlock.col;
    var inBetweenBlocks = [];
    var rowDiff = startrow - rowToConsider;
    var colDiff = startcol - colToConsider;
    if(dist>1){
        for (var i=1; i<dist ; i++){
            var blockRow = startrow - rowDiff*i/dist; 
            var blockCol = startcol - colDiff*i/dist;
            var block = {"row":blockRow, "col":blockCol};
            inBetweenBlocks.push(block);
        }
    }
    return inBetweenBlocks;
}


function highlightPossibleMoves(pieceAtBlock){
    //assume selected peice has been set!
    setPossibleMoves(pieceAtBlock);
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        drawOutline(POSSIBLE_MOVE_COLOUR, ctx, POSSIBLE_MOVES[i]);
    }
}

function unHighlightPossibleMoves(){
    for (var i=0; i<POSSIBLE_MOVES.length; i++){
        drawBlock(POSSIBLE_MOVES[i].col, POSSIBLE_MOVES[i].row);
        //draw peice if it was there
        if (blockOccupiedByEnemy(POSSIBLE_MOVES[i])){
            drawPiece(blockOccupiedByEnemy(POSSIBLE_MOVES[i]), (currentTurn != BLACK_TEAM));
        }
    }
}

function canSelectedMoveToBlock(selectedPiece, clickedBlock) {
	var bCanMove = false;

    bCanMove = canPawnMoveToBlock(selectedPiece, clickedBlock);

	return bCanMove;
}

function getPieceAtBlock(clickedBlock) {

	var team = (currentTurn === BLACK_TEAM ? json.black : json.white);

	return getPieceAtBlockForTeam(team, clickedBlock);
}

function getBlockColour(iRowCounter, iBlockCounter) {
	var cStartColour;

	// Alternate the block colour
	if (iRowCounter % 2) {
		cStartColour = (iBlockCounter % 2 ? BLOCK_COLOUR_1 : BLOCK_COLOUR_2);
	} else {
		cStartColour = (iBlockCounter % 2 ? BLOCK_COLOUR_2 : BLOCK_COLOUR_1);
	}

	return cStartColour;
}

function drawBlock(iRowCounter, iBlockCounter) {
	// Set the background
	ctx.fillStyle = getBlockColour(iRowCounter, iBlockCounter);

	// Draw rectangle for the background
	ctx.fillRect(iRowCounter * BLOCK_SIZE, iBlockCounter * BLOCK_SIZE,
		BLOCK_SIZE, BLOCK_SIZE);

	ctx.stroke();
}

function getImageCoords(pieceCode, bBlackTeam, imageBlockSize) {
	var imageCoords =  {
		"x": pieceCode * imageBlockSize,
		"y": (bBlackTeam ? (210-87) : 0)
	};

	return imageCoords;
}

function drawPiece(curPiece, bBlackTeam) {
    if (curPiece.status == TAKEN){
        console.log("trying to draw taken piece...");
        return;
    }
    var imageBlockSize = 87;
	var imageCoords = getImageCoords(curPiece.piece, bBlackTeam, imageBlockSize);

	// Draw the piece onto the canvas
	ctx.drawImage(pieces,
		imageCoords.x, imageCoords.y,
		imageBlockSize, imageBlockSize,
		curPiece.col * BLOCK_SIZE + BLOCK_SIZE * 0.1, curPiece.row * BLOCK_SIZE + BLOCK_SIZE * 0.1,
		BLOCK_SIZE*0.8, BLOCK_SIZE*0.8);
}

function removeSelection(selectedPiece) {
    unHighlightPossibleMoves();
	drawBlock(selectedPiece.col, selectedPiece.row);
	drawPiece(selectedPiece, (currentTurn === BLACK_TEAM));
}

function drawTeamOfPieces(teamOfPieces, bBlackTeam) {
	var iPieceCounter;

	// Loop through each piece and draw it on the canvas	
	for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
		drawPiece(teamOfPieces[iPieceCounter], bBlackTeam);
	}
}

function drawPieces() {
	drawTeamOfPieces(json.black, true);
	drawTeamOfPieces(json.white, false);
}

function drawRow(iRowCounter) {
	var iBlockCounter;

	// Draw 8 block left to right
	for (iBlockCounter = 0; iBlockCounter < NUMBER_OF_ROWS; iBlockCounter++) {
		drawBlock(iRowCounter, iBlockCounter);
	}
}

function drawBoard() {
	var iRowCounter;

	for (iRowCounter = 0; iRowCounter < NUMBER_OF_ROWS; iRowCounter++) {
		drawRow(iRowCounter);
	}

	// Draw outline
	ctx.lineWidth = 3;
	ctx.strokeRect(0, 0,
		NUMBER_OF_ROWS * BLOCK_SIZE,
		NUMBER_OF_COLS * BLOCK_SIZE);
}

function defaultPositions() {
	json = {
		"white":
			[
				{
					"piece": PIECE_PAWN,
					"row": 0,
					"col": 1,
					"status": (NUMBER_OF_COLS >= 3 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 0,
					"col": 2,
					"status": (NUMBER_OF_COLS >= 4 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 0,
					"col": 3,
					"status": (NUMBER_OF_COLS >= 5 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 0,
					"col": 4,
					"status": (NUMBER_OF_COLS >= 6 ? IN_PLAY : TAKEN)
				},
                {
                    "piece": PIECE_PAWN,
					"row": 0,
					"col": 5,
                    "status": (NUMBER_OF_COLS >= 7 ? IN_PLAY : TAKEN)
                },
                {
                    "piece": PIECE_PAWN,
					"row": 0,
					"col": 6,
                    "status": (NUMBER_OF_COLS >= 8 ? IN_PLAY : TAKEN)
                },
                {
					"piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 1,
					"status": (NUMBER_OF_COLS >= 3 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 2,
					"status": (NUMBER_OF_COLS >= 4 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 3,
					"status": (NUMBER_OF_COLS >= 5 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 4,
					"status": (NUMBER_OF_COLS >= 6 ? IN_PLAY : TAKEN)
				},
                {
                    "piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 5,
                    "status": (NUMBER_OF_COLS >= 7 ? IN_PLAY : TAKEN)
                },
                {
                    "piece": PIECE_PAWN,
					"row": NUMBER_OF_ROWS - 1,
					"col": 6,
                    "status": (NUMBER_OF_COLS >= 8 ? IN_PLAY : TAKEN)
                }
			],
		"black":
			[
				{
					"piece": PIECE_PAWN,
					"row": 1,
					"col": 0,
					"status": (NUMBER_OF_COLS >= 3 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 2,
					"col": 0,
					"status": (NUMBER_OF_COLS >= 4 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 3,
					"col": 0,
					"status": (NUMBER_OF_COLS >= 5 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 4,
					"col": 0,
					"status": (NUMBER_OF_COLS >= 6 ? IN_PLAY : TAKEN)
				},
                {
                    "piece": PIECE_PAWN,
					"row": 5,
					"col": 0,
                    "status": (NUMBER_OF_COLS >= 7 ? IN_PLAY : TAKEN)
                },
                {
                    "piece": PIECE_PAWN,
					"row": 6,
					"col": 0,
                    "status": (NUMBER_OF_COLS >= 8 ? IN_PLAY : TAKEN)
                },
                {
					"piece": PIECE_PAWN,
					"row": 1,
					"col": NUMBER_OF_COLS - 1,
					"status": (NUMBER_OF_COLS >= 3 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 2,
					"col": NUMBER_OF_COLS - 1,
					"status": (NUMBER_OF_COLS >= 4 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 3,
					"col": NUMBER_OF_COLS - 1,
					"status": (NUMBER_OF_COLS >= 5 ? IN_PLAY : TAKEN)
				},
				{
					"piece": PIECE_PAWN,
					"row": 4,
					"col": NUMBER_OF_COLS - 1,
					"status": (NUMBER_OF_COLS >= 6 ? IN_PLAY : TAKEN)
				},
                {
                    "piece": PIECE_PAWN,
					"row": 5,
					"col": NUMBER_OF_COLS - 1,
                    "status": (NUMBER_OF_COLS >= 7 ? IN_PLAY : TAKEN)
                },
                {
                    "piece": PIECE_PAWN,
					"row": 6,
					"col": NUMBER_OF_COLS - 1,
                    "status": (NUMBER_OF_COLS >= 8 ? IN_PLAY : TAKEN)
                }
			]
	};
}

function drawOutline(colourToHighlight, ctx, pieceAtBlock){
    ctx.lineWidth = SELECT_LINE_WIDTH;
	ctx.strokeStyle = colourToHighlight;
	ctx.strokeRect((pieceAtBlock.col * BLOCK_SIZE) + SELECT_LINE_WIDTH,
		(pieceAtBlock.row * BLOCK_SIZE) + SELECT_LINE_WIDTH,
		BLOCK_SIZE - (SELECT_LINE_WIDTH * 2),
		BLOCK_SIZE - (SELECT_LINE_WIDTH * 2));
}

function selectPiece(pieceAtBlock) {
	// Draw outline
	drawOutline(HIGHLIGHT_COLOUR, ctx, pieceAtBlock)
    
	selectedPiece = pieceAtBlock;
    highlightPossibleMoves(pieceAtBlock);
}

function checkIfPieceClicked(clickedBlock) {
	var pieceAtBlock = getPieceAtBlock(clickedBlock);
    
    //consol logs
    console.log("Selected block (col,row) (" + clickedBlock.col + ", " + clickedBlock.row + ")");
    
	if (pieceAtBlock !== null){
        selectPiece(pieceAtBlock);
    }     	
}

function movePiece(clickedBlock, enemyPiece) {
	// Clear the block in the original position
	drawBlock(selectedPiece.col, selectedPiece.row);
    unHighlightPossibleMoves();
    
    //record the game after a move has been played (undo button??)
    GAME_RECORD.moveList.push({"from":{"row":selectedPiece.row, "col":selectedPiece.col} ,                                  "to":{"row":clickedBlock.row, "col":clickedBlock.col}
                              });
    console.log("Number of moves in record: " + GAME_RECORD.moveList.length);
    
    var moveText = "(" + selectedPiece.row + ", " + selectedPiece.col + ")" +
                   "  ->  (" + clickedBlock.row + ", " + clickedBlock.col + ")";
    
    writeToScoreCard(moveText);
    

	var team = (currentTurn === WHITE_TEAM ? json.white : json.black),
		opposite = (currentTurn !== WHITE_TEAM ? json.white : json.black);

	team[selectedPiece.position].col = clickedBlock.col;
	team[selectedPiece.position].row = clickedBlock.row;

	if (enemyPiece !== null) {
		// Clear the piece your about to take
		drawBlock(enemyPiece.col, enemyPiece.row);
		opposite[enemyPiece.position].status = TAKEN;
	}

	// Draw the piece in the new position
	drawPiece(selectedPiece, (currentTurn === BLACK_TEAM));
    
    selectedPiece = null;
    
    // check win condition before changing turn
    check_win_condition(clickedBlock);
    
	currentTurn = (currentTurn === WHITE_TEAM ? BLACK_TEAM : WHITE_TEAM);
    
    console.log("==============================");
}

function processMove(clickedBlock) {
	var pieceAtBlock = getPieceAtBlock(clickedBlock)

	if (pieceAtBlock !== null) {
		removeSelection(selectedPiece);
		checkIfPieceClicked(clickedBlock);
	} else if (canSelectedMoveToBlock(selectedPiece, clickedBlock)) {
        //get position of possible enemy piece
        var enemyPiece = blockOccupiedByEnemy(clickedBlock);
		movePiece(clickedBlock, enemyPiece);
	}
}

function colorRect(leftX,topY, width,height, drawColor, ctx) {
	ctx.fillStyle = drawColor;
	ctx.fillRect(leftX,topY, width,height);
}

function getMaxGroupNumber(teamOfPieces){
    var iPieceCounter;
    var maxGroupNumber = 0;
    for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++){
        if (teamOfPieces[iPieceCounter].groupNumber > maxGroupNumber){
            maxGroupNumber = teamOfPieces[iPieceCounter].groupNumber;
        }
    }
    return maxGroupNumber;
}

function setGroupNumberForEachPiece(teamOfPieces){
    var iPieceCounter;
    var maxGroupNumber;
    var piecesToBeAssigned = [];
    //reset group number default is 0 (out fo play)
    //get list of peices that need to be assigned a group
    for (iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++){
        var curPiece = teamOfPieces[iPieceCounter]
        curPiece.groupNumber = 0;
        if (curPiece.status != TAKEN){
            piecesToBeAssigned.push(curPiece);
        }
    }
    
    var piecesFound=[];
    var nextPiece;
    var initialPiece;
	// Loop through each piece and find connections	
    while (piecesToBeAssigned.length > 0){
        initialPiece = piecesToBeAssigned.pop();
        maxGroupNumber = getMaxGroupNumber(teamOfPieces);
        initialPiece.groupNumber = maxGroupNumber + 1;
        //find connection to curPeice
        piecesFound.push(initialPiece);
        while (piecesFound.length>0){
            nextPiece = piecesFound.pop();
            for (var row = -1;row<2;row++){
                for (var col = -1;col<2;col++){
                    var rowToConsider = nextPiece.row + row;
                    var colToConsider = nextPiece.col + col;
                    if (rowToConsider < 0 || 
                        rowToConsider >= NUMBER_OF_ROWS || 
                        colToConsider < 0 || 
                        colToConsider >= NUMBER_OF_COLS ||
                        (row == 0 && col == 0)){
                        // not a valid block to consider
                    } else{
                        //check if block is occupied, if yes add to found
                        var idx = [];
                        for (var i=0; i<piecesToBeAssigned.length; i++){
                            var checkPiece = piecesToBeAssigned[i];
                            if (isPieceAtBlock(checkPiece,rowToConsider,colToConsider)){
                                piecesFound.push(checkPiece)
                                checkPiece.groupNumber = initialPiece.groupNumber;
                                idx.push(i);
                            }
                        }
                        //remove found peices from assign list. 
                        for (var n=idx.length -1; n>=0; n--){
                            piecesToBeAssigned.splice(idx[n], 1);
                        }
                    }
                }
            }
        }
        
    }
    
    return;
}


function check_win_condition(clickedBlock){
    console.log("current turn is " + currentTurn);
    console.log("moved to row " + clickedBlock.row);
    console.log("moved to col " + clickedBlock.col);
    
    setGroupNumberForEachPiece(json.white);
    setGroupNumberForEachPiece(json.black);
    var whiteGroupNum = getMaxGroupNumber(json.white);
    var blackGroupNum = getMaxGroupNumber(json.black);
    console.log("Number of groups for white:  " + whiteGroupNum);
    console.log("Number of groups for black:  " + blackGroupNum);
    
    if (whiteGroupNum == 1 && blackGroupNum == 1){
        WINNING_PLAYER = "DRAW";
        GAME_FINISHED = true;
        draw();
    }else if(whiteGroupNum == 1){
        WINNING_PLAYER = "White";
        GAME_FINISHED = true;
        draw();
    }else if(blackGroupNum == 1){
        WINNING_PLAYER = "Black";
        GAME_FINISHED = true;
        draw();
    }

}


function checkNoPiecesLeft(teamOfPieces){
    for (var iPieceCounter = 0; iPieceCounter < teamOfPieces.length; iPieceCounter++) {
		var curPiece = teamOfPieces[iPieceCounter];
		if (curPiece.status === IN_PLAY){
			return false;
		} 
	}
    return true
}               


function resetScoreCard(){
    var list = document.getElementById('moveList');
    while(list.firstChild){
        list.removeChild(list.firstChild)
    }
}

function writeToScoreCard(moveText){
    var list = document.getElementById('moveList');
    var node = document.createElement("LI");
    var textnode = document.createTextNode(moveText);
    node.appendChild(textnode);
    list.appendChild(node);
}


function board_click(ev) {
	var x = ev.clientX - canvas.offsetLeft,
		y = ev.clientY - canvas.offsetTop,
		clickedBlock = screenToBlock(x, y);
    
    if (GAME_FINISHED){
        GAME_FINISHED = false;
        draw();
        return; 
    }
    
	if (selectedPiece === null) {
		checkIfPieceClicked(clickedBlock);
	} else {
		processMove(clickedBlock);
	}
}

function drawWinScreen(canvas, ctx){
    colorRect(0,0,canvas.width,canvas.height,'black', ctx);
    ctx.font="30px Arial";
    ctx.fillStyle = 'white';
    ctx.textBasline = 'middle';
    ctx.textAlign = 'center';
    if (WINNING_PLAYER == "DRAW"){
        ctx.fillText("It's a draw!", canvas.width/2, canvas.height/4);
    }else{
        ctx.fillText(WINNING_PLAYER + " wins!", canvas.width/2, canvas.height/4);
    }
    ctx.fillText("Click to play again...", canvas.width/2, 3*canvas.height/4);
}


function draw() {
	// Main entry point got the HTML5 chess board example
    
    //set constants for reseting game
    currentTurn = WHITE_TEAM;
    resetScoreCard();
    
	canvas = document.getElementById('board');

	// Canvas supported?
	if (canvas.getContext) {
		ctx = canvas.getContext('2d');

		// Calculdate the precise block size
		BLOCK_SIZE = canvas.height / NUMBER_OF_ROWS;
        
        if (GAME_FINISHED){
            drawWinScreen(canvas, ctx);
            return;
        }
        
		// Draw the background
		drawBoard();

		defaultPositions();

		// Draw pieces
		pieces = new Image();
		pieces.src = 'checkers.png';
		pieces.onload = drawPieces;
        
		canvas.addEventListener('click', board_click, false);
	} else {
		alert("Canvas not supported!");
	}
}
