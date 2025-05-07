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

function updatePieces() {
    let flatBoard = board.flat(); // Flatten the 2D array to 1D

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
        square.classList.remove('highlight'); // Remove previous highlights
        if (square.textContent === "") {
            square.onclick = null; // Remove click functionality
        }
    });

    const moves = getMoves(piece);
    for (let move of moves) {
        const square = document.querySelector(`.row-${move[1]}.col-${move[0]}`);
        square.classList.add('highlight');
        square.onclick = () => {
            movePiece(squares, square, piece, move);
        };
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
};