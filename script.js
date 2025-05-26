// Игровые константы
const CHECKERS = 'checkers';
const CHESS = 'chess';
const CHECKER_KING = 'checker-king';
const CHECKER_QUEEN = 'checker-queen'; // Добавляем новый тип - дамку
const DRAW = 'draw';

// Шахматные фигуры
const CHESS_PIECES = {
    PAWN: '♟',
    ROOK: '♜',
    KNIGHT: '♞',
    BISHOP: '♝',
    QUEEN: '♛',
    KING: '♚'
};

// Игровое состояние
let gameState = {
    board: Array(8).fill().map(() => Array(8).fill(null)),
    currentPlayer: CHECKERS,
    selectedPiece: null,
    possibleMoves: [],
    checkersKingPosition: { row: 0, col: 4 }, // Изменено на (0,4)
    chessKingPosition: { row: 7, col: 4 },
    moveHistory: [],
    gameOver: false,
    localMultiplayer: true,
    enPassantTarget: null // Для взятия на проходе
};

// DOM элементы
const boardElement = document.getElementById('game-board');
const currentPlayerElement = document.getElementById('current-player');
const gameStatusElement = document.getElementById('game-status');
const moveHistoryElement = document.getElementById('move-history');
const restartBtn = document.getElementById('restart-btn');
const localBtn = document.getElementById('local-btn');

// Инициализация игры
function initGame() {
    gameState = {
        board: Array(8).fill().map(() => Array(8).fill(null)),
        currentPlayer: CHECKERS,
        selectedPiece: null,
        possibleMoves: [],
        checkersKingPosition: null, // Будет определено случайным образом
        chessKingPosition: { row: 7, col: 4 },
        moveHistory: [],
        gameOver: false,
        localMultiplayer: true,
        enPassantTarget: null
    };

// Удаляем все конфетти
    document.querySelectorAll('.confetti').forEach(el => el.remove());


    // Список возможных позиций для короля шашек
    const possibleKingPositions = [];
    
    // Расстановка шашек
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 !== 0) {
                gameState.board[row][col] = { 
                    type: CHECKERS, 
                    player: CHECKERS,
                    isKing: false,
                    isQueen: false
                };
                // Добавляем позицию в список возможных для короля
                possibleKingPositions.push({row, col});
            }
        }
    }

    // Выбираем случайную шашку, которая станет королем
    if (possibleKingPositions.length > 0) {
        const kingIndex = Math.floor(Math.random() * possibleKingPositions.length);
        const kingPos = possibleKingPositions[kingIndex];
        gameState.board[kingPos.row][kingPos.col].isKing = true;
        gameState.checkersKingPosition = { row: kingPos.row, col: kingPos.col };
    }

    // Расстановка шахматных фигур
    // Пешки
    for (let col = 0; col < 8; col++) {
        gameState.board[6][col] = { 
            type: CHESS_PIECES.PAWN, 
            player: CHESS,
            hasMoved: false,
            isKing: false,
            isQueen: false
        };
    }

    // Ладьи
    gameState.board[7][0] = { 
        type: CHESS_PIECES.ROOK, 
        player: CHESS,
        hasMoved: false,
        isKing: false,
        isQueen: false
    };
    gameState.board[7][7] = { 
        type: CHESS_PIECES.ROOK, 
        player: CHESS,
        hasMoved: false,
        isKing: false,
        isQueen: false
    };

    // Кони
    gameState.board[7][1] = { 
        type: CHESS_PIECES.KNIGHT, 
        player: CHESS,
        isKing: false,
        isQueen: false
    };
    gameState.board[7][6] = { 
        type: CHESS_PIECES.KNIGHT, 
        player: CHESS,
        isKing: false,
        isQueen: false
    };

    // Слоны
    gameState.board[7][2] = { 
        type: CHESS_PIECES.BISHOP, 
        player: CHESS,
        isKing: false,
        isQueen: false
    };
    gameState.board[7][5] = { 
        type: CHESS_PIECES.BISHOP, 
        player: CHESS,
        isKing: false,
        isQueen: false
    };

    // Ферзь
    gameState.board[7][3] = { 
        type: CHESS_PIECES.QUEEN, 
        player: CHESS,
        isKing: false,
        isQueen: false
    };

    // Король шахмат
    gameState.board[7][4] = { 
        type: CHESS_PIECES.KING, 
        player: CHESS,
        hasMoved: false,
        isKing: true, // Отмечаем, что это король
        isQueen: false
    };
    
    // Сбрасываем статус игры
    gameStatusElement.textContent = 'Игра началась!';
    renderBoard();
    updateGameInfo();
}


// Отрисовка доски
function renderBoard() {
    boardElement.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            tile.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            tile.dataset.row = row;
            tile.dataset.col = col;
            
            const isPossibleMove = gameState.possibleMoves.some(move => 
                move.to.row === row && move.to.col === col && !move.capture);
            const isCaptureMove = gameState.possibleMoves.some(move => 
                move.to.row === row && move.to.col === col && move.capture);
            
            if (isPossibleMove) tile.classList.add('possible-move');
            if (isCaptureMove) tile.classList.add('capture-move');
            
            const piece = gameState.board[row][col];
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece');
    
                if (piece.player === CHECKERS) {
                    if (piece.isKing) {
                        pieceElement.classList.add('checker-king');
                        pieceElement.textContent = '♔';
                    } else if (piece.isQueen) {
                        pieceElement.classList.add('checker-queen');
                        pieceElement.textContent = '♕';
                    } else {
                        pieceElement.classList.add('checker');
                        pieceElement.textContent = '●';
                    }
                } else {
                    // Шахматные фигуры
                    pieceElement.classList.add('chess-piece');
                    pieceElement.textContent = piece.type;
                    if (piece.player === CHESS) {
                        pieceElement.classList.add('black');
                    }
                }
                
                tile.appendChild(pieceElement);
            }
            
            tile.addEventListener('click', () => handleTileClick(row, col));
            boardElement.appendChild(tile);
        }
    }
}

// Обработка клика по клетке
function handleTileClick(row, col) {
    if (gameState.gameOver) return;
    
    const piece = gameState.board[row][col];
    
    if (gameState.selectedPiece) {
        const move = gameState.possibleMoves.find(m => 
            m.to.row === row && m.to.col === col);
        
        if (move) {
            makeMove(move);
        } else {
            if (piece && piece.player === gameState.currentPlayer) {
                selectPiece(row, col);
            } else {
                gameState.selectedPiece = null;
                gameState.possibleMoves = [];
                renderBoard();
            }
        }
    } 
    else if (piece && piece.player === gameState.currentPlayer) {
        selectPiece(row, col);
    }
}

function isInCheck(player, board = gameState.board) {
    const kingPos = player === CHESS ? gameState.chessKingPosition : gameState.checkersKingPosition;
    const opponent = player === CHESS ? CHECKERS : CHESS;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.player === opponent) {
                const moves = getRawMoves(row, col, board);
                if (moves.some(move => 
                    move.to.row === kingPos.row && 
                    move.to.col === kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function getRawMoves(row, col, board) {
    // Копия getPossibleMoves без проверки шаха
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    
    if (piece.player === CHECKERS) {
        // ... (та же логика для шашек)
    } else {
        // ... (та же логика для шахмат)
    }
    
    return moves;
}

function isCheckmate(player) {
    if (!isInCheck(player)) return false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.player === player) {
                const moves = getPossibleMoves(row, col);
                if (moves.length > 0) return false;
            }
        }
    }
    return true;
}

function isStalemate(player) {
    if (isInCheck(player)) return false;
    
    let hasLegalMoves = false;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece && piece.player === player) {
                const moves = getPossibleMoves(row, col);
                if (moves.length > 0) {
                    hasLegalMoves = true;
                    break;
                }
            }
        }
        if (hasLegalMoves) break;
    }
    
    return !hasLegalMoves;
}


// Выбор фигуры
function selectPiece(row, col) {
    gameState.selectedPiece = { row, col };
    gameState.possibleMoves = getPossibleMoves(row, col);
    renderBoard();
}

// Получение возможных ходов для фигуры
function getPossibleMoves(row, col) {
    const piece = gameState.board[row][col];
    if (!piece || piece.player !== gameState.currentPlayer) return [];
    
    // Получаем все возможные ходы без учета шаха
    let rawMoves = getRawMoves(row, col, gameState.board);
    
    // Для шахматных фигур фильтруем ходы, которые оставляют короля под шахом
    if (piece.player === CHESS) {
        rawMoves = rawMoves.filter(move => {
            // Создаем тестовую доску
            const testBoard = JSON.parse(JSON.stringify(gameState.board));
            
            // Выполняем тестовый ход
            const { from, to, capture, enPassant, castle } = move;
            const movingPiece = testBoard[from.row][from.col];
            
            // Обработка взятия
            if (capture) {
                testBoard[capture.row][capture.col] = null;
            }
            
            // Взятие на проходе
            if (enPassant) {
                testBoard[capture.row][capture.col] = null;
            }
            
            // Перемещение фигуры
            testBoard[to.row][to.col] = movingPiece;
            testBoard[from.row][from.col] = null;
            
            // Рокировка
            if (castle) {
                const rook = testBoard[castle.rookFrom.row][castle.rookFrom.col];
                testBoard[castle.rookTo.row][castle.rookTo.col] = rook;
                testBoard[castle.rookFrom.row][castle.rookFrom.col] = null;
            }
            
            // Проверяем, остался ли король под шахом
            return !isKingInCheck(testBoard, CHESS);
        });
    }
    
    return rawMoves;
}

function getRawMoves(row, col, board) {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    
    if (piece.player === CHECKERS) {
    // Ходы для шашек
    const directions = piece.isKing || piece.isQueen ? 
        [{dr: -1, dc: -1}, {dr: -1, dc: 1}, {dr: 1, dc: -1}, {dr: 1, dc: 1}] : 
        (piece.player === CHECKERS ? 
            [{dr: 1, dc: -1}, {dr: 1, dc: 1}] : 
            [{dr: -1, dc: -1}, {dr: -1, dc: 1}]);
    
    for (const dir of directions) {
        const newRow = row + dir.dr;
        const newCol = col + dir.dc;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
            if (!board[newRow][newCol]) {
                moves.push({ from: {row, col}, to: {row: newRow, col: newCol} });
            } else if (board[newRow][newCol].player !== piece.player) {
                const jumpRow = newRow + dir.dr;
                const jumpCol = newCol + dir.dc;
                
                if (jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 && 
                    !board[jumpRow][jumpCol]) {
                    moves.push({ 
                        from: {row, col}, 
                        to: {row: jumpRow, col: jumpCol},
                        capture: {row: newRow, col: newCol}
                    });
                }
            }
        }
    }
} else {
        // Ходы для шахматных фигур
        switch (piece.type) {
            case CHESS_PIECES.PAWN:
    const direction = piece.player === CHESS ? -1 : 1; // Направление движения пешки
    const startRow = piece.player === CHESS ? 6 : 1;   // Стартовая позиция пешки
    
    // Обычный ход вперед (1 клетка)
    const newRow = row + direction;
    if (newRow >= 0 && newRow < 8 && !board[newRow][col]) {
        moves.push({ from: {row, col}, to: {row: newRow, col: col} });
        
        // Двойной ход с начальной позиции (2 клетки)
        if (row === startRow && !board[row + 2*direction][col]) {
            moves.push({ 
                from: {row, col}, 
                to: {row: row + 2*direction, col: col},
                isDoubleStep: true  // Помечаем двойной ход для взятия на проходе
            });
        }
    }
    
    // Взятие влево и вправо
    for (const dc of [-1, 1]) {
        const newCol = col + dc;
        const targetRow = row + direction;
        
        // Проверяем границы доски
        if (newCol >= 0 && newCol < 8 && targetRow >= 0 && targetRow < 8) {
            // Обычное взятие
            if (board[targetRow][newCol] && board[targetRow][newCol].player !== piece.player) {
                moves.push({ 
                    from: {row, col}, 
                    to: {row: targetRow, col: newCol},
                    capture: {row: targetRow, col: newCol}
                });
            }
            
            // Взятие на проходе
            else if (gameState.enPassantTarget && 
                    gameState.enPassantTarget.row === row && 
                    gameState.enPassantTarget.col === newCol) {
                moves.push({
                    from: {row, col},
                    to: {row: targetRow, col: newCol},
                    capture: {row: row, col: newCol}, // Берем пешку на соседней горизонтали
                    enPassant: true
                });
            }
        }
    }
    break;
                
                
            case CHESS_PIECES.ROOK:
                addStraightMoves(row, col, piece.player, moves, board);
                break;
                
            case CHESS_PIECES.KNIGHT:
                const knightMoves = [
                    {dr: 2, dc: 1}, {dr: 2, dc: -1},
                    {dr: -2, dc: 1}, {dr: -2, dc: -1},
                    {dr: 1, dc: 2}, {dr: 1, dc: -2},
                    {dr: -1, dc: 2}, {dr: -1, dc: -2}
                ];
                
                for (const move of knightMoves) {
                    const newRow = row + move.dr;
                    const newCol = col + move.dc;
                    
                    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                        if (!board[newRow][newCol] || 
                            board[newRow][newCol].player !== piece.player) {
                            moves.push({ 
                                from: {row, col}, 
                                to: {row: newRow, col: newCol},
                                capture: board[newRow][newCol] ? 
                                    {row: newRow, col: newCol} : null
                            });
                        }
                    }
                }
                break;
                
            case CHESS_PIECES.BISHOP:
                addDiagonalMoves(row, col, piece.player, moves, board);
                break;
                
            case CHESS_PIECES.QUEEN:
                addStraightMoves(row, col, piece.player, moves, board);
                addDiagonalMoves(row, col, piece.player, moves, board);
                break;
                
            case CHESS_PIECES.KING:
                // Обычные ходы короля
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        
                        const newRow = row + dr;
                        const newCol = col + dc;
                        
                        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                            if (!board[newRow][newCol] || 
                                board[newRow][newCol].player !== piece.player) {
                                moves.push({ 
                                    from: {row, col}, 
                                    to: {row: newRow, col: newCol},
                                    capture: board[newRow][newCol] ? 
                                        {row: newRow, col: newCol} : null
                                });
                            }
                        }
                    }
                }
                
                // Рокировка
                if (!piece.hasMoved) {
                    // Короткая рокировка
                    if (!board[row][7]?.hasMoved && 
                        !board[row][5] && !board[row][6] &&
                        !isSquareUnderAttack(row, 4, board) &&
                        !isSquareUnderAttack(row, 5, board) &&
                        !isSquareUnderAttack(row, 6, board)) {
                        moves.push({
                            from: {row, col},
                            to: {row: row, col: 6},
                            castle: {rookFrom: {row: row, col: 7}, rookTo: {row: row, col: 5}}
                        });
                    }
                    // Длинная рокировка
                    if (!board[row][0]?.hasMoved && 
                        !board[row][1] && !board[row][2] && !board[row][3] &&
                        !isSquareUnderAttack(row, 4, board) &&
                        !isSquareUnderAttack(row, 3, board) &&
                        !isSquareUnderAttack(row, 2, board)) {
                        moves.push({
                            from: {row, col},
                            to: {row: row, col: 2},
                            castle: {rookFrom: {row: row, col: 0}, rookTo: {row: row, col: 3}}
                        });
                    }
                }
                break;
        }
    }
    
    return moves;
}

function isKingInCheck(board, player) {
    const kingPos = findKingPosition(board, player);
    if (!kingPos) return false;
    
    const opponent = player === CHESS ? CHECKERS : CHESS;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.player === opponent) {
                const moves = getRawMoves(row, col, board);
                if (moves.some(move => 
                    move.to.row === kingPos.row && 
                    move.to.col === kingPos.col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function findKingPosition(board, player) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece.player === player && 
                (piece.type === CHESS_PIECES.KING || 
                 (piece.type === CHECKERS && piece.isKing && !piece.isQueen))) {
                return { row, col };
            }
        }
    }
    return null;
}

function isSquareUnderAttack(row, col, board) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece.player !== gameState.currentPlayer) {
                const moves = getRawMoves(r, c, board);
                if (moves.some(m => m.to.row === row && m.to.col === col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Добавление прямых ходов
function addStraightMoves(row, col, player, moves) {
    const directions = [
        {dr: 1, dc: 0}, {dr: -1, dc: 0},
        {dr: 0, dc: 1}, {dr: 0, dc: -1}
    ];
    
    for (const dir of directions) {
        for (let i = 1; i < 8; i++) {
            const newRow = row + i * dir.dr;
            const newCol = col + i * dir.dc;
            
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
            
            if (!gameState.board[newRow][newCol]) {
                moves.push({ from: {row, col}, to: {row: newRow, col: newCol} });
            } else {
                if (gameState.board[newRow][newCol].player !== player) {
                    moves.push({ 
                        from: {row, col}, 
                        to: {row: newRow, col: newCol},
                        capture: {row: newRow, col: newCol}
                    });
                }
                break;
            }
        }
    }
}

// Добавление диагональных ходов
function addDiagonalMoves(row, col, player, moves) {
    const directions = [
        {dr: 1, dc: 1}, {dr: 1, dc: -1},
        {dr: -1, dc: 1}, {dr: -1, dc: -1}
    ];
    
    for (const dir of directions) {
        for (let i = 1; i < 8; i++) {
            const newRow = row + i * dir.dr;
            const newCol = col + i * dir.dc;
            
            if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;
            
            if (!gameState.board[newRow][newCol]) {
                moves.push({ from: {row, col}, to: {row: newRow, col: newCol} });
            } else {
                if (gameState.board[newRow][newCol].player !== player) {
                    moves.push({ 
                        from: {row, col}, 
                        to: {row: newRow, col: newCol},
                        capture: {row: newRow, col: newCol}
                    });
                }
                break;
            }
        }
    }
}


// Выполнение хода
function makeMove(move) {
    const { from, to, capture, enPassant, castle } = move;
    const piece = gameState.board[from.row][from.col];
    
    // Запоминаем ход в истории
    gameState.moveHistory.push({
        player: gameState.currentPlayer,
        piece: {...piece},
        from: {...from},
        to: {...to},
        capture: capture ? {...gameState.board[capture.row][capture.col]} : null
    });

    // Функция для завершения хода после анимации
    const completeMove = () => {
        // Перемещаем фигуру
        gameState.board[to.row][to.col] = {...piece};
        gameState.board[from.row][from.col] = null;
        gameState.board[to.row][to.col].hasMoved = true;
        
        // Рокировка
        if (castle) {
            const rook = gameState.board[castle.rookFrom.row][castle.rookFrom.col];
            gameState.board[castle.rookTo.row][castle.rookTo.col] = {...rook, hasMoved: true};
            gameState.board[castle.rookFrom.row][castle.rookFrom.col] = null;
        }
        
        // Превращение пешки
        if (piece.type === CHESS_PIECES.PAWN && 
            (to.row === 0 || to.row === 7)) {
            gameState.board[to.row][to.col].type = CHESS_PIECES.QUEEN;
        }
        
        // Превращение шашки в дамку
        if (piece.player === CHECKERS && !piece.isQueen && 
            ((piece.player === CHECKERS && to.row === 7) || 
             (piece.player === CHESS && to.row === 0))) {
            gameState.board[to.row][to.col].isQueen = true;
            gameState.board[to.row][to.col].isKing = false;
        }
        
        // Обновляем позицию короля шашек (если это он)
        if (piece.player === CHECKERS && piece.isKing && !piece.isQueen) {
            gameState.checkersKingPosition = { row: to.row, col: to.col };
        }
        
        // Смена хода
        gameState.currentPlayer = gameState.currentPlayer === CHECKERS ? CHESS : CHECKERS;
        gameState.selectedPiece = null;
        gameState.possibleMoves = [];
        
        // Перерисовываем доску
        renderBoard();
        updateGameInfo();
    };

    // Обработка взятия с анимацией
    if (capture) {
        const capturedPiece = gameState.board[capture.row][capture.col];
        const captureTile = boardElement.querySelector(
            `[data-row="${capture.row}"][data-col="${capture.col}"]`);
            
        if (captureTile.firstChild) {
            captureTile.firstChild.classList.add('capturing');
            
            // Удаляем фигуру после анимации
            setTimeout(() => {
                gameState.board[capture.row][capture.col] = null;
                
                // Проверяем победу только если взяли короля
                if (capturedPiece?.type === CHESS_PIECES.KING) {
                    gameState.gameOver = true;
                    completeMove();
                    gameStatusElement.textContent = `Игра окончена! Победили Шашки!`;
                    createConfetti(); // Добавляем конфетти
                    return;
                }

                if (capturedPiece?.player === CHECKERS && capturedPiece.isKing && !capturedPiece.isQueen) {
                    gameState.gameOver = true;
                    completeMove();
                    gameStatusElement.textContent = `Игра окончена! Победили Шахматы!`;
                    createConfetti(); // Добавляем конфетти
                    return;
                }
                                
                // Если взяли не короля - продолжаем ход
                completeMove();
                
                // Дополнительная проверка победы по уничтожению всех фигур
                if (!gameState.gameOver) {
                    checkWinByElimination();
                }
            }, 300);
            return;
        }
    }
    
    // Если не было взятия - просто выполняем ход
    completeMove();
    
    // Проверка победы по уничтожению всех фигур
    if (!gameState.gameOver) {
        checkWinByElimination();
    }
}

function checkWinAfterCapture(capturedPiece) {
    // Победа шашек, если взят король шахмат
    if (capturedPiece?.type === CHESS_PIECES.KING) {
        gameState.gameOver = true;
        gameStatusElement.textContent = `Игра окончена! Победили Шашки!`;
        return;
    }
    
    // Победа шахмат, если взят король шашек (но не дамка)
    if (capturedPiece?.player === CHECKERS && capturedPiece.isKing && !capturedPiece.isQueen) {
        gameState.gameOver = true;
        gameStatusElement.textContent = `Игра окончена! Победили Шахматы!`;
        return;
    }
}

function completeMove(move, piece) {
    const { from, to, enPassant, castle } = move;
    
    if (gameState.gameOver) return;
    
    // Взятие на проходе
    if (enPassant) {
        gameState.board[move.capture.row][move.capture.col] = null;
    }
    
    // Перемещаем фигуру
    gameState.board[to.row][to.col] = {...piece};
    gameState.board[from.row][from.col] = null;
    gameState.board[to.row][to.col].hasMoved = true;
    
    // Рокировка
    if (castle) {
        const rook = gameState.board[castle.rookFrom.row][castle.rookFrom.col];
        gameState.board[castle.rookTo.row][castle.rookTo.col] = {...rook, hasMoved: true};
        gameState.board[castle.rookFrom.row][castle.rookFrom.col] = null;
    }
    
    // Превращение пешки
    if (piece.type === CHESS_PIECES.PAWN && 
        (to.row === 0 || to.row === 7)) {
        gameState.board[to.row][to.col].type = CHESS_PIECES.QUEEN;
    }
    
    // Превращение шашки в дамку
    if (piece.player === CHECKERS && !piece.isQueen && 
        ((piece.player === CHECKERS && to.row === 7) || 
         (piece.player === CHESS && to.row === 0))) {
        gameState.board[to.row][to.col].isQueen = true;
        gameState.board[to.row][to.col].isKing = false;
    }
    
    // Обновляем позицию короля шашек (если это он)
    if (piece.player === CHECKERS && piece.isKing && !piece.isQueen) {
        gameState.checkersKingPosition = { row: to.row, col: to.col };
    }
    
    // Смена хода
    gameState.currentPlayer = gameState.currentPlayer === CHECKERS ? CHESS : CHECKERS;
    gameState.selectedPiece = null;
    gameState.possibleMoves = [];
    
    // Перерисовываем доску
    renderBoard();
    updateGameInfo();
    
    // Проверка победы по уничтожению всех фигур
    if (!gameState.gameOver) {
        checkWinByElimination();
    }
}

function createConfetti() {
  const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
  const confettiCount = 150;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    
    // Случайные параметры
    const size = Math.random() * 10 + 5;
    const left = Math.random() * window.innerWidth;
    const animationDuration = Math.random() * 3 + 2;
    const delay = Math.random() * 5;
    
    // Применяем стили
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.left = `${left}px`;
    confetti.style.animationDuration = `${animationDuration}s`;
    confetti.style.animationDelay = `${delay}s`;
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Форма конфетти (круг или квадрат)
    if (Math.random() > 0.5) {
      confetti.style.borderRadius = '50%';
    }
    
    document.body.appendChild(confetti);
    
    // Удаляем конфетти после анимации
    setTimeout(() => {
      confetti.remove();
    }, (animationDuration + delay) * 1000);
  }
}

// Проверка победы по уничтожению всех фигур
function checkWinByElimination() {
    if (gameState.gameOver) return;
    
    let chessKingAlive = false;
    let checkersKingAlive = false;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState.board[row][col];
            if (piece) {
                if (piece.type === CHESS_PIECES.KING) {
                    chessKingAlive = true;
                }
                // Проверяем только короля шашек (не дамку)
                if (piece.player === CHECKERS && piece.isKing && !piece.isQueen) {
                    checkersKingAlive = true;
                }
            }
        }
    }
    
            if (!chessKingAlive) {
                gameState.gameOver = true;
                gameStatusElement.textContent = `Игра окончена! Победили Шашки!`;
                createConfetti(); // Добавляем конфетти
                return;
            }

            if (!checkersKingAlive) {
                gameState.gameOver = true;
                gameStatusElement.textContent = `Игра окончена! Победили Шахматы!`;
                createConfetti(); // Добавляем конфетти
                return;
}
}

// Обновление информации о игре
function updateGameInfo() {
    currentPlayerElement.textContent = gameState.currentPlayer === CHECKERS ? 'Шашки' : 'Шахматы';
    
    moveHistoryElement.innerHTML = '';
    gameState.moveHistory.forEach((move, index) => {
        const moveElement = document.createElement('div');
        moveElement.textContent = `${index + 1}. ${move.player === CHECKERS ? 'Шашки' : 'Шахматы'}: 
            ${String.fromCharCode(97 + move.from.col)}${8 - move.from.row} → 
            ${String.fromCharCode(97 + move.to.col)}${8 - move.to.row}`;
        moveHistoryElement.appendChild(moveElement);
    });
    moveHistoryElement.scrollTop = moveHistoryElement.scrollHeight;
}

// Обработчики кнопок
restartBtn.addEventListener('click', () => {
    // Очищаем статус игры перед инициализацией новой
    gameStatusElement.textContent = 'Игра началась!';
    initGame();
});

// Запуск игры
initGame();