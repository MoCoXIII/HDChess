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

async function showMoves(piece) {
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
        await new Promise(resolve => setTimeout(resolve, 10));
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

function drawSurrounding() {
    const boardContainer = document.getElementById('chess-board');
    const directions = [
        { dx: 0, dy: -1, rotation: n[0] === "s" ? 0 : n[0] === "w" ? 90 : 45, mirror: n[1] === "0" ? 1 : 0 },  // Top
        { dx: 1, dy: 0, rotation: e[0] === "w" ? 0 : e[0] === "s" ? -90 : 45, mirror: e[1] === "0" ? 1 : 0 },  // Right
        { dx: 0, dy: 1, rotation: s[0] === "n" ? 0 : s[0] === "e" ? -90 : 45, mirror: s[1] === "0" ? 1 : 0 },   // Bottom
        { dx: -1, dy: 0, rotation: w[0] === "e" ? 0 : w[0] === "n" ? -90 : 45, mirror: w[1] === "0" ? 1 : 0 }  // Left
    ];

    boardContainer.style.transform = `
            translate(400px, 400px)
            scaleY(-1)
        `;
    directions.forEach(({ dx, dy, rotation, mirror }) => {
        const clone = boardContainer.cloneNode(true);
        clone.id = ''; // Remove duplicate ID
        clone.style.position = "absolute";
        clone.style.transform = `
                translate(${400 + dx * 400}px, ${dy * 400}px)
                rotate(${rotation}deg)
                scale(${mirror === 1 ? -1 : 1}, 1)
            `;
        clone.classList.add('chess-board');
        document.body.appendChild(clone);
    });
}
