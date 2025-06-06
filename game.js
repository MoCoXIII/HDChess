// This script handles game logic.

// default borders
let [n, e, s, w] = ["s0", "w0", "n0", "e0"];
function preset(p) {
    switch (p) {
        case "n":
            [n, e, s, w] = ["00", "00", "00", "00"];
            break;
        case "t":
            [n, e, s, w] = ["s0", "w0", "n0", "e0"];
            break;
        case "k":
            [n, e, s, w] = ["s1", "w1", "n1", "e1"];
            break;
        default:
            break;
    }
}
let delay = 10;
let reps = 10000;
let displaySearch = false;

const defaultBoard = [
    // The board is represented as an 8x8 array.
    // Each element is a string representing a piece or an empty square.
    // The pieces are represented as follows:
    // 'P' = white pawn, 'R' = white rook, 'N' = white knight, 'B' = white bishop, 'Q' = white queen, 'K' = white king
    // 'p' = black pawn, 'r' = black rook, 'n' = black knight, 'b' = black bishop, 'q' = black queen, 'k' = black king
    // '.' = empty square

    // standard chess
    // ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    // ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    // ['.', '.', '.', '.', '.', '.', '.', '.'],
    // ['.', '.', '.', '.', '.', '.', '.', '.'],
    // ['.', '.', '.', '.', '.', '.', '.', '.'],
    // ['.', '.', '.', '.', '.', '.', '.', '.'],
    // ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    // ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],

    // torus chess
    ['.', '.', '.', '.', '.', '.', '.', '.'],
    ['N', '.', 'P', 'P', 'P', 'P', '.', 'N'],
    ['.', '.', 'R', 'K', 'Q', 'R', '.', '.'],
    ['.', 'P', 'B', 'P', 'P', 'B', 'P', '.'],
    ['.', 'p', 'b', 'p', 'p', 'b', 'p', '.'],
    ['.', '.', 'r', 'k', 'q', 'r', '.', '.'],
    ['n', '.', 'p', 'p', 'p', 'p', '.', 'n'],
    ['.', '.', '.', '.', '.', '.', '.', '.'],
].reverse();

const defaultPieces = {
    // Piece and their possible velocities (movements from their current position)
    // 'piece': [[default x (west[0]-east[7]) velocity, y (south[0]-north[7]) velocity, Bool: keepStraight], ...]
    // assume north is on top from white's perspective
    // the Boolean keepStraight is true if the piece can move in a straight line (like a rook or queen, applying the same velocity any amount of times), and false if it can only move once with any velocity (like a knight or king)
    'P': [[0, 1, false, false], [1, 1, false, true], [-1, 1, false, true]], // white pawn. SPECIAL CASE: [dx, dy, keepStraight, isCapture] : isCapture means this move is only (true) / not (false) available when capturing
    // We do not include en passant, promotion, castling, or double move, as these mostly only apply for the default board, and we use a custom one.
    'R': [[1, 0, true], [-1, 0, true], [0, 1, true], [0, -1, true]], // white rook
    'N': [[1, 2, false], [2, 1, false], [-1, 2, false], [-2, 1, false], [1, -2, false], [2, -1, false], [-1, -2, false], [-2, -1, false]], // white knight
    'B': [[1, 1, true], [-1, 1, true], [1, -1, true], [-1, -1, true]], // white bishop
    'Q': [[1, 0, true], [-1, 0, true], [0, 1, true], [0, -1, true], [1, 1, true], [-1, 1, true], [1, -1, true], [-1, -1, true]], // white queen
    'K': [[1, 0, false], [-1, 0, false], [0, 1, false], [0, -1, false], [1, 1, false], [-1, 1, false], [1, -1, false], [-1, -1, false]], // white king
    'p': [[0, -1, false, false], [1, -1, false, true], [-1, -1, false, true]], // black pawn
    'r': [[1, 0, true], [-1, 0, true], [0, 1, true], [0, -1, true]], // black rook
    'n': [[1, 2, false], [2, 1, false], [-1, 2, false], [-2, 1, false], [1, -2, false], [2, -1, false], [-1, -2, false], [-2, -1, false]], // black knight
    'b': [[1, 1, true], [-1, 1, true], [1, -1, true], [-1, -1, true]], // black bishop
    'q': [[1, 0, true], [-1, 0, true], [0, 1, true], [0, -1, true], [1, 1, true], [-1, 1, true], [1, -1, true], [-1, -1, true]], // black queen
    'k': [[1, 0, false], [-1, 0, false], [0, 1, false], [0, -1, false], [1, 1, false], [-1, 1, false], [1, -1, false], [-1, -1, false]], // black king
};

class Piece {
    constructor(type, velocities, id, x, y) {
        this.type = type;
        this.isWhite = type === type.toUpperCase(); // Determine if the piece is white or black based on its type
        this.velocities = velocities;
        this.id = id; // Unique identifier for the piece
        this.x = x; // x-coordinate of the piece on the board
        this.y = y; // y-coordinate of the piece on the board
    }

    toString() {
        return this.type;
    }
}

let pieceCounter = 0;
let rowCounter = 0;
let colCounter = 0;
let board = defaultBoard.map((row, rowIndex) =>
    row.map((piece, colIndex) => (
        piece === '.'
            ? '.'
            : new Piece(
                piece,
                JSON.parse(JSON.stringify(defaultPieces[piece] || [])), // Provide a copy of the velocities
                pieceCounter++,
                colIndex, rowIndex
            )
    ))
);

function logBoard(board) {
    // Log the board to the console in a readable format.
    console.log(board.map(row => row.map(piece => piece === '.' ? '.' : piece.toString())));
}

function getVelocities(board) {
    // Extract all unique velocities from all pieces on the board, ignoring empty squares.
    return Object.values(
        board.flat().reduce((acc, piece) => {
            if (piece !== '.') {
                piece.velocities.forEach(([dx, dy, keepStraight]) => {
                    const key = JSON.stringify([dx, dy, keepStraight]);
                    if (!acc[key]) {
                        acc[key] = [dx, dy, keepStraight, []];
                    }
                    acc[key][3].push(piece.id); // Use the unique identifier instead of the type, as pieces can change their velocities.
                });
            }
            return acc;
        }, {})
    );
}

function* getMoves(piece) {
    // Get all possible moves for a given piece based on its velocities.

    for (const [dx, dy, keepStraight, isCapture = null] of piece.velocities) {
        yield* checkVelocity(board, piece, dx, dy, keepStraight, isCapture);
    }
}

function* checkVelocity(board, piece, dx, dy, keepStraight, isCapture = null, targetMode = false) {
    let x = piece.x; // Current x-coordinate of the piece
    let y = piece.y; // Current y-coordinate of the piece
    let currentDx = dx; // Track the current x velocity
    let currentDy = dy; // Track the current y velocity
    let cumulativeFlipX = false; // Track cumulative flips on the X-axis
    let cumulativeFlipY = false; // Track cumulative flips on the Y-axis
    let cumulativeRotation = 0; // Track cumulative rotation (in 90-degree increments)

    while (true) {
        let flipX = false; // Flag to indicate if the x-coordinate is flipped
        let flipY = false; // Flag to indicate if the y-coordinate is flipped
        let rotate = "no"; // Flag to indicate the type of rotation
        const oldX = x;
        const oldY = y;
        x += currentDx;
        y += currentDy;

        [x, y, flipX, flipY, rotate] = wrap(board.length, board[0].length, oldX, oldY, x, y, n, e, s, w); // Wrap the coordinates based on the direction parameters.

        if (x === oldX && y === oldY) {
            // If the coordinates didn't change (most likely because of a blocked wall), don't move further this way and check the next velocity.
            break;
        }

        // Update cumulative flips
        cumulativeFlipX = flipX ? !cumulativeFlipX : cumulativeFlipX;
        cumulativeFlipY = flipY ? !cumulativeFlipY : cumulativeFlipY;

        // Adjust the velocities based on cumulative flips
        let _currentDx = cumulativeFlipX ? 0 - dx : dx;
        let _currentDy = cumulativeFlipY ? 0 - dy : dy;

        // Adjust the velocities based on cumulative rotation
        console.debug(cumulativeRotation, rotate, (cumulativeRotation + rotate) % 4);
        cumulativeRotation = (cumulativeRotation + rotate) % 4;

        // Apply cumulative rotation to the velocities
        switch (cumulativeRotation) {
            case 1: // 90 degrees clockwise
                [currentDx, currentDy] = [_currentDy, -_currentDx];
                break;
            case 2: // 180 degrees
                [currentDx, currentDy] = [-_currentDx, -_currentDy];
                break;
            case 3: // 90 degrees counterclockwise
                [currentDx, currentDy] = [-_currentDy, _currentDx];
                break;
            default: // 0 degrees (no rotation)
                [currentDx, currentDy] = [_currentDx, _currentDy];
                break;
        }

        // If still out of bounds (after wrapping or blocking), output what went wrong.
        if (y < 0 || y >= board.length || x < 0 || x >= board[0].length) {
            console.error(`Velocity result out of bounds: ${piece.type} oldX=${oldX}, oldY=${oldY}, dx=${dx}, dy=${dy}, x=${x}, y=${y}, n=${n}, e=${e}, s=${s}, w=${w}`);
            break; // Stop checking this velocity.
        };

        // if (!targetMode) {
        //     let positionAfterMove = board.map(row => row.slice()); // Create a deep copy of the board
        //     positionAfterMove[piece.y][piece.x] = '.'; // Remove the piece from its current position
        //     positionAfterMove[y][x] = new Piece(piece.type, piece.velocities, piece.id, x, y); // Place the piece at the new position
        //     if (kingEndangered(positionAfterMove, piece.isWhite)) {
        //         break;
        //     }
        // }

        const targetPiece = board[y][x];
        if (targetPiece !== '.') {
            if (isCapture === null || (isCapture !== null && isCapture)) {
                if (targetMode) {
                    const isSameColor = piece.isWhite === targetPiece.isWhite;
                    if (piece.possible.includes(targetPiece.id) && (piece.byOwn ? isSameColor : !isSameColor)) {
                        yield true;
                    }
                } else {
                    if (targetPiece.isWhite !== piece.isWhite) {
                        yield [x, y, cumulativeFlipX, cumulativeFlipY, cumulativeRotation]; // Capture move
                    }
                }
            }
            break; // Stop checking this direction after hitting a piece.
        } else if (isCapture !== null && isCapture) {
            // This move lands on an empty square but is only available for captures
            break;
        }

        if (!targetMode) {
            yield [x, y, cumulativeFlipX, cumulativeFlipY, cumulativeRotation]; // Empty square move
        }

        if (!keepStraight) {
            break;
        }
    }
}

function positionIsSymmetric(board) {
    // Check for symmetry by comparing pieces at mirrored positions.
    for (let row = 0; row < board.length / 2; row++) {
        for (let col = 0; col < board[row].length; col++) {
            const piece1 = board[row][col];
            const piece2 = board[board.length - 1 - row][col];

            if (piece1 === '.' && piece2 === '.') {
                continue; // Both are empty squares, symmetry holds.
            }

            if (
                piece1 === '.' ||
                piece2 === '.' ||
                piece1.type.toLowerCase() !== piece2.type.toLowerCase() ||
                piece1.isWhite === piece2.isWhite
            ) {
                return false; // Symmetry is broken.
            }
        }
    }
    return true; // The board is symmetric.
}

const seenPositions = new Set();

function positionIsNew(board) {
    // Create a unique string representation of the board based on piece types and positions.
    const boardKey = board.map(row => row.map(piece => (piece === '.' ? '.' : piece.type)).join('')).join('|');

    if (seenPositions.has(boardKey)) {
        return false; // The position has already been generated.
    }

    seenPositions.add(boardKey); // Mark this position as seen.
    return true; // The position is new.
}

/**
 * The function checks if a given position on the chess board is valid.
 * A position is valid if no unprotected pieces are being attacked.
 * The cardinal directions are defaulted to null, meaning they act like default chess.
 * If they are set to false, that direction loops around like on a toroidal board.
 * If they are set to true, that direction loops around like on a Möbius strip, flipping the pieces' coordinate and velocity perpendicular to the crossing.
 * @param {Array} board - The main chess board represented as a 2D array.
 * @param {Boolean} n - North direction (up)
 * @param {Boolean} e - East direction (right)
 * @param {Boolean} s - South direction (down)
 * @param {Boolean} w - West direction (left)
 * * @returns {Boolean} - True if the position is valid, false otherwise.
 */
function positionIsSafe(board, n = null, e = null, s = null, w = null) {
    // Check if the board is valid by checking if any unprotected pieces are being attacked.
    // Loop through each piece on the board.
    for (let row = 0; row < board.length; row++) {
        for (let column = 0; column < board[row].length; column++) {
            const piece = board[row][column];
            // If the piece is not empty, check if it is being attacked.
            if (piece !== '.') {
                if (!(['k', 'K'].includes(piece.type))) {
                    // If the piece is not a king, we may allow it to be attacked, if it is protected.
                    // Check if the piece is protected by another piece of the same color.
                    if (isTarget(board, column, row, piece, byOwn = true)) {
                        continue; // The piece is protected, so we can skip it.
                    }
                }
                // Check if the piece is being attacked by any other piece.
                if (isTarget(board, column, row, piece, byOwn = false)) {
                    return false; // The position is invalid if any unprotected piece is being attacked. Assume the king is always unprotected, as he is of upmost importance to keep alive.
                }
            }
        }
    }
    return true; // The position is valid if no pieces are being attacked.
}

function kingEndangered(board, isWhite) {
    for (let row = 0; row < board.length; row++) {
        for (let column = 0; column < board[row].length; column++) {
            const piece = board[row][column];
            if (piece === '.') {
                continue;
            }
            if (piece.type === (isWhite ? 'K' : 'k')) {
                if (isTarget(board, column, row, piece, byOwn = false)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Determines if a given piece on the board is being attacked or protected.
 * 
 * This function checks whether a piece at a specified position (x, y) is being
 * attacked by any opponent's pieces or protected by its own pieces, depending
 * on the `byOwn` flag. It utilizes the possible velocities defined for each
 * type of piece to simulate movements and detect potential threats or protection.
 * 
 * The function accounts for special board configurations, such as toroidal or
 * Möbius strip behaviors, by using the direction parameters (n, e, s, w). These
 * parameters modify the looping behavior of the board edges.
 * 
 * @param {Array} board - The chess board represented as a 2D array.
 * @param {number} X - The x-coordinate (column index) of the piece.
 * @param {number} Y - The y-coordinate (row index) of the piece.
 * @param {Piece} piece - The piece to check, represented as an instance of the Piece class.
 * @param {Boolean} [n="00"] - North direction looping behavior.
 * @param {Boolean} [e="00"] - East direction looping behavior.
 * @param {Boolean} [s="00"] - South direction looping behavior.
 * @param {Boolean} [w="00"] - West direction looping behavior.
 * @param {Boolean} [byOwn=false] - Flag indicating whether to check for protection by own pieces.
 * @returns {Boolean} - True if the piece is being attacked or protected, false otherwise.
 */
function isTarget(board, X, Y, piece, byOwn = false) {
    // Loop through each possible velocity.
    for (let [dx, dy, keepStraight, possiblePieces] of getVelocities(board)) {
        let velocityCheck = checkVelocity(board, { x: X, y: Y, possible: possiblePieces, byOwn: byOwn, isWhite: piece.isWhite, type: piece.type, velocities: piece.velocities }, dx, dy, keepStraight, null, true);
        const checkResult = velocityCheck.next();
        if (checkResult.value) {
            return true;
        };
    }
    return false; // The piece is not being targeted or protected.
}

/**
 * Wraps the coordinates (x, y) within the boundaries of the board of size (w, h) based on the direction parameters.
 * The direction parameters (n, e, s, w) are each comprised of two characters: a and b.
 * a may be 0 if wrapping around is disabled in that direction, or any of the other directions (n, e, s, w) if wrapping around is enabled in that direction.
 * b may be 0 or 1, where 0 means the piece is not flipped, and 1 means the piece is flipped.
 * The function assumes north is up from white's perspective.
 * @param {number} w - The width of the board.
 * @param {number} h - The height of the board.
 * @param {number} x - The original x-coordinate before moving.
 * @param {number} y - The original y-coordinate before moving.
 * @param {number} tx - The x-coordinate after moving.
 * @param {number} ty - The y-coordinate after moving.
 * @param {string} [n="00"] - The wrap mode for the north direction.
 * @param {string} [e="00"] - The wrap mode for the east direction.
 * @param {string} [s="00"] - The wrap mode for the south direction.
 * @param {string} [w="00"] - The wrap mode for the west direction.
 * @returns {[number, number, boolean, boolean]} - The wrapped coordinates (x, y), and two boolean values indicating if the x and y coordinates were flipped.
 */
function wrap(W, H, x, y, tx, ty, n = "00", e = "00", s = "00", w = "00") {
    // Wrap the coordinates based on the direction parameters.
    // Assumes north is up from white's perspective.
    let _W = W - 1;
    let _H = H - 1;
    let flipX = false;
    let flipY = false;
    let rotate = 0;
    let nx = tx;
    let ny = ty;

    if (ny >= H) { // from north
        // If the y-coordinate exceeds the north border, wrap it around.
        switch (n[0]) { // check if north is blocked (default)
            case "s":
                // Connection north to south
                switch (n[1]) { // check if flipped
                    case "1":
                        // flipped
                        flipX = !flipX;
                        [ny, nx] = [ny % H, _W - nx];
                        break;
                    default:
                        // not flipped
                        ny = ny % H; // loop
                }
                break; // Prevent fall-through to default
            case "w":
                // Connection north to west
                rotate = (rotate + 1) % 4; // cw
                switch (n[1]) { // check if flipped
                    case "1":
                        // flipped
                        [nx, ny] = [ny % H, nx]; // loop
                        break;
                    default:
                        // not flipped
                        flipX = !flipX;
                        [nx, ny] = [ny % H, _W - nx]; // loop
                }
                break;
            default:
                // north is blocked, don't enable this move.
                return [x, y, false, false, 0]; // return original coordinates
        }
    } else if (ny < 0) { // from south
        switch (s[0]) { // check if south is blocked (default)
            case "n":
                // Connection south to north
                switch (s[1]) { // check if flipped
                    case "1":
                        // flipped
                        flipX = !flipX;
                        ny = H + ny; // loop
                        nx = _W - nx; // flip
                        break;
                    default:
                        // not flipped
                        ny = H + ny; // loop
                }
                break; // Prevent fall-through to default
            case "e":
                // Connection south to east
                rotate = (rotate + 1) % 4; // ccw
                switch (s[1]) { // check if flipped
                    case "1":
                        // flipped
                        [nx, ny] = [H + ny, nx]; // loop
                        break;
                    default:
                        // not flipped
                        flipX = !flipX;
                        [nx, ny] = [H + ny, _W - nx]; // loop
                }
                break;
            default:
                // south is blocked, don't enable this move.
                return [x, y, false, false, 0]; // return original coordinates
        }
    }

    if (nx >= W) { // from east
        // If the x-coordinate exceeds the east border, wrap it around.
        switch (e[0]) { // check if east is blocked (default)
            case "w":
                // Connection east to west
                switch (e[1]) { // check if flipped
                    case "1":
                        // flipped
                        flipY = !flipY;
                        nx = nx % W; // loop
                        ny = _H - ny; // flip
                        break;
                    default:
                        // not flipped
                        nx = nx % W; // loop
                }
                break; // Prevent fall-through to default
            case "s":
                // Connection east to south
                rotate = (rotate - 1 + 4) % 4; // ccw
                switch (e[1]) { // check if flipped
                    case "1":
                        // flipped
                        flipY = !flipY;
                        [nx, ny] = [ny, nx % W]; // loop
                        break;
                    default:
                        // not flipped
                        [nx, ny] = [_H - ny, nx % W]; // loop
                }
                break;
            default:
                // east is blocked, don't enable this move.
                return [x, y, false, false, 0]; // return original coordinates
        }
    } else if (nx < 0) { // from west
        switch (w[0]) { // check if west is blocked (default)
            case "e":
                // Connection west to east
                switch (w[1]) { // check if flipped
                    case "1":
                        // flipped
                        flipY = !flipY;
                        nx = W + nx; // loop
                        ny = _H - ny; // flip
                        break;
                    default:
                        // not flipped
                        nx = W + nx; // loop
                }
                break; // Prevent fall-through to default
            case "n":
                // Connection west to north
                rotate = (rotate - 1 + 4) % 4; // ccw
                switch (w[1]) { // check if flipped
                    case "1":
                        // flipped
                        [nx, ny] = [_H - ny, W + nx]; // loop
                        break;
                    default:
                        // not flipped
                        flipY = !flipY;
                        [nx, ny] = [ny % H, W + nx]; // loop
                }
                break;
            default:
                // west is blocked, don't enable this move.
                return [x, y, false, false, 0]; // return original coordinates
        }
    }

    // If still out of bounds, return original coordinates.
    if (ny < 0 || ny >= H || nx < 0 || nx >= W) {
        console.debug(nx, ny);
        return [x, y, false, false, 0]; // return original coordinates
    }

    return [nx, ny, flipX, flipY, rotate];
}

function shuffle(arr) {
    let flatArray = arr.flat(); // Flatten the array to shuffle all elements together
    let shuffled = [];

    // Shuffle the flattened array
    while (flatArray.length) {
        let index = Math.floor(Math.random() * flatArray.length);
        shuffled.push(flatArray.splice(index, 1)[0]);
    }

    // Reconstruct the original structure with shuffled elements
    let result = [];
    let flatIndex = 0;

    arr.forEach(subArray => {
        if (Array.isArray(subArray)) {
            let subArrayLength = subArray.length;
            result.push(shuffled.slice(flatIndex, flatIndex + subArrayLength));
            flatIndex += subArrayLength;
        } else {
            result.push(shuffled[flatIndex++]);
        }
    });

    return result;
}

// Generates a new valid position
function newPosition() {
    // Call the generator function that yields all permutations of the board.
    // This way, we keep the pieces the same.
    let permutations = filteredPermutations(shuffle(board));
    // For each permutation, check if it is a valid position.
    return permutations.next();
}

async function* filteredPermutations(arr) {
    // just generatePermutations but with optional filtering
    let counter = 0;
    let perms = generatePermutations(arr);
    for (let perm of perms) {
        // Check if the permutation is valid.
        if (displaySearch || counter % reps === 0) { updatePieces(perm); await new Promise(resolve => setTimeout(resolve, delay)); }
        counter = (counter + 1) % reps;
        if (positionIsSymmetric(perm)) {
            console.log('Symmetry check');
            updatePieces(perm);
            await new Promise(resolve => setTimeout(resolve, delay));
            if (positionIsNew(perm)) {
                console.log('Fresh position');
                if (positionIsSafe(perm)) {
                    console.log('Safety check, yielding');
                    updatePieces(perm);
                    yield perm; // Yield the valid permutation.
                }
            }
        }
    }
}

/**
 * Generates all permutations of the input array, including nested arrays.
 *
 * This is a generator function that yields each permutation as an array.
 * It recursively generates permutations by selecting each element as the
 * first element and generating permutations of the remaining elements.
 * If an element is an array, it generates permutations of the nested array.
 *
 * @param {Array} arr - The array of elements to permute.
 * @yields {Array} - A permutation of the input array.
 */
function* generatePermutations(arr) {
    if (arr.length === 0) {
        yield [];
    } else {
        for (let i = 0; i < arr.length; i++) {
            // Skip swapping identical items to avoid redundant permutations
            if (i > 0 && arr[i] === arr[i - 1]) {
                continue;
            }

            const current = Array.isArray(arr[i])
                ? [...generatePermutations(arr[i])]
                : [arr[i]];
            const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
            for (const perm of generatePermutations(remaining)) {
                for (const nestedPerm of current) {
                    yield [nestedPerm].concat(perm);
                }
            }
        }
    }
}