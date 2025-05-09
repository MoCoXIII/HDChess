// This script is the user interface for the game.


let squares = [];

// Create a chess board on the HTML page
function createChessBoard() {
    const boardContainer = document.createElement('div');
    boardContainer.id = 'chess-board';

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square', `row-${row}`, `col-${col}`, (row + col) % 2 === 0 ? "black" : "white");
            square.dataset.row = row;
            square.dataset.col = col;
            squares.push(square); // Store the square in the squares array
            addPieceMoveListener(square, row, col);
            boardContainer.appendChild(square);
        }
    }

    document.body.appendChild(boardContainer);
}

// Call the function to render the chess board
createChessBoard();

function addPieceMoveListener(square, row, col) {
    square.onclick = () => {
        const piece = board[row][col]; // Get the piece at the clicked square
        if (piece !== ".") {
            showMoves(piece);
        }
    };
}

function updatePieces(_board = board) {
    let flatBoard = _board.flat(); // Flatten the 2D array to 1D

    for (let i = 0; i < flatBoard.length; i++) {
        squares[i].textContent =
            flatBoard[i] === "."
                ? ""
                : flatBoard[i].toString()
    }
}

updatePieces();

function showMoves(piece) {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.classList.remove('highlight', 'debug_highlight'); // Remove previous highlights
        if (square.textContent === "") {
            square.onclick = null; // Remove click functionality
        }
    });

    const moves = getMoves(piece);
    let move = moves.next();
    const hasMoves = move.done === false;

    if (!hasMoves) {
        console.log("No moves available for this piece.");
        return;
    }
    while (move.done === false) {
        let moveValue = move.value;
        const square = document.querySelector(`.row-${moveValue[1]}.col-${moveValue[0]}`);
        square.classList.add('highlight');
        square.onclick = () => {
            movePiece(squares, square, piece, moveValue);
        };
        move = moves.next();
    }
}

const movePiece = (squares, square, piece, move) => {
    squares.forEach(square => {
        square.classList.remove('highlight', 'start', 'end'); // Remove previous highlights
        square.onclick = null; // Remove click functionality
        addPieceMoveListener(square, square.dataset.row, square.dataset.col);
    });
    board[move[1]][move[0]] = piece;
    square.classList.add('end');
    board[piece.y][piece.x] = ".";
    squares[piece.y * 8 + piece.x].classList.add('start');
    updatePieces();
    piece.x = move[0];
    piece.y = move[1];
    piece.velocities.forEach(velocity => {
        velocity[0] = move[2] ? 0 - velocity[0] : velocity[0];
        velocity[1] = move[3] ? 0 - velocity[1] : velocity[1];

        // Apply rotation based on move[4]
        for (let i = 0; i < move[4]; i++) {
            const temp = velocity[0];
            velocity[0] = velocity[1];
            velocity[1] = -temp;
        }
    });
};