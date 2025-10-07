// ============================================================
// CANVAS AND DISPLAY SETUP
// ============================================================
// Detect if mobile view and select appropriate canvas
function isMobileView() {
    return window.innerWidth < 768;
}

// Get the appropriate canvas based on viewport
function getCanvas() {
    return isMobileView() ? 
        document.querySelector("#tetrisMobile") : 
        document.querySelector("#tetris");
}

// Get the appropriate score display based on viewport
function getScoreDisplay() {
    return isMobileView() ? 
        document.getElementById("scoreDisplayMobile") : 
        document.getElementById("scoreDisplay");
}

let canvas = getCanvas();
let scoreDisplay = getScoreDisplay();
let ctx = canvas.getContext("2d");
ctx.scale(30, 30);

const SHAPES = [
    [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
    ],
    [
        [0, 1, 0],
        [0, 1, 0],
        [1, 1, 0]
    ],
    [
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 1]
    ],
    [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    [
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0]
    ],
    [
        [1, 1],
        [1, 1],
    ]
];

const COLORS = [
    "#1a1a1a",
    "#9b5fe0",
    "#16a4d8",
    "#60dbe8",
    "#8bd346",
    "#efdf48",
    "#f9a52c",
    "#d64e12"
];

const ROWS = 20;
const COLS = 10;

let grid = generateGrid();
let fallingPieceObj = null;
let score = 0;
let gameInterval;
let isGameRunning = false;

// ============================================================
// THEME TOGGLE FUNCTIONALITY
// ============================================================
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to dark
const currentTheme = localStorage.getItem('theme') || 'dark';
if (currentTheme === 'light') {
    body.classList.remove('dark-theme');
} else {
    body.classList.add('dark-theme');
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    const theme = body.classList.contains('dark-theme') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    
    updateCanvasColors();
    renderGame();
});

function updateCanvasColors() {
    const isDark = body.classList.contains('dark-theme');
    COLORS[0] = isDark ? "#1a1a1a" : "#ffffff";
}

// ============================================================
// RESPONSIVE CANVAS SWITCHING
// ============================================================
// Handle canvas switching on resize
function switchCanvas() {
    const newCanvas = getCanvas();
    const newScoreDisplay = getScoreDisplay();
    
    // Only switch if canvas changed
    if (newCanvas !== canvas) {
        // Stop current game
        clearInterval(gameInterval);
        isGameRunning = false;
        
        // Switch to new canvas and score display
        canvas = newCanvas;
        scoreDisplay = newScoreDisplay;
        ctx = canvas.getContext("2d");
        ctx.scale(30, 30);
        
        // Update score display
        updateScore();
        
        // Restart game on new canvas
        restartGame();
    }
}

// Handle window resize with debouncing
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        switchCanvas();
    }, 250);
});

// ============================================================
// MOBILE CONTROLS FUNCTIONALITY
// ============================================================
const mobileLeftBtn = document.getElementById('mobileLeft');
const mobileRightBtn = document.getElementById('mobileRight');

if (mobileLeftBtn) {
    mobileLeftBtn.addEventListener('click', () => {
        if (isGameRunning) {
            moveLeft();
        }
    });
}

if (mobileRightBtn) {
    mobileRightBtn.addEventListener('click', () => {
        if (isGameRunning) {
            moveRight();
        }
    });
}

// Touch events for better mobile responsiveness
if (mobileLeftBtn) {
    mobileLeftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (isGameRunning) {
            moveLeft();
        }
    });
}

if (mobileRightBtn) {
    mobileRightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (isGameRunning) {
            moveRight();
        }
    });
}

// ============================================================
// GAME FUNCTIONALITY
// ============================================================

// Restart Button Functionality - Handle both desktop and mobile buttons
const restartBtn = document.getElementById('restartBtn');
const restartBtnMobile = document.getElementById('restartBtnMobile');

if (restartBtn) {
    restartBtn.addEventListener('click', restartGame);
}

if (restartBtnMobile) {
    restartBtnMobile.addEventListener('click', restartGame);
}

function restartGame() {
    clearInterval(gameInterval);
    grid = generateGrid();
    fallingPieceObj = null;
    score = 0;
    updateScore();
    isGameRunning = false;
    startGame();
}

function startGame() {
    if (!isGameRunning) {
        isGameRunning = true;
        gameInterval = setInterval(newGameState, 500);
    }
}

function newGameState() {
    checkGrid();
    if (!fallingPieceObj) {
        fallingPieceObj = randomPieceObject();
        renderPiece();
    }
    moveDown();
}

function checkGrid() {
    let count = 0;
    for (let i = 0; i < grid.length; i++) {
        let allFilled = true;
        for (let j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == 0) {
                allFilled = false;
            }
        }
        if (allFilled) {
            count++;
            grid.splice(i, 1);
            grid.unshift([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        }
    }
    if (count == 1) {
        score += 10;
    } else if (count == 2) {
        score += 30;
    } else if (count == 3) {
        score += 50;
    } else if (count > 3) {
        score += 100;
    }
    updateScore();
}

function updateScore() {
    scoreDisplay = getScoreDisplay();
    scoreDisplay.innerHTML = score;
}

function generateGrid() {
    let grid = [];
    for (let i = 0; i < ROWS; i++) {
        grid.push([]);
        for (let j = 0; j < COLS; j++) {
            grid[i].push(0);
        }
    }
    return grid;
}

function randomPieceObject() {
    let ran = Math.floor(Math.random() * 7);
    let piece = SHAPES[ran];
    let colorIndex = ran + 1;
    let x = 4;
    let y = 0;
    return { piece, colorIndex, x, y };
}

function renderPiece() {
    let piece = fallingPieceObj.piece;
    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[i].length; j++) {
            if (piece[i][j] == 1) {
                ctx.fillStyle = COLORS[fallingPieceObj.colorIndex];
                ctx.fillRect(fallingPieceObj.x + j, fallingPieceObj.y + i, 1, 1);
            }
        }
    }
}

function moveDown() {
    if (!collision(fallingPieceObj.x, fallingPieceObj.y + 1)) {
        fallingPieceObj.y += 1;
    } else {
        let piece = fallingPieceObj.piece;
        for (let i = 0; i < piece.length; i++) {
            for (let j = 0; j < piece[i].length; j++) {
                if (piece[i][j] == 1) {
                    let p = fallingPieceObj.x + j;
                    let q = fallingPieceObj.y + i;
                    grid[q][p] = fallingPieceObj.colorIndex;
                }
            }
        }
        if (fallingPieceObj.y == 0) {
            clearInterval(gameInterval);
            isGameRunning = false;
            setTimeout(() => {
                if (confirm("Game Over! Your score: " + score + "\n\nPlay again?")) {
                    restartGame();
                }
            }, 100);
        }
        fallingPieceObj = null;
    }
    renderGame();
}

function moveLeft() {
    if (fallingPieceObj && !collision(fallingPieceObj.x - 1, fallingPieceObj.y)) {
        fallingPieceObj.x -= 1;
    }
    renderGame();
}

function moveRight() {
    if (fallingPieceObj && !collision(fallingPieceObj.x + 1, fallingPieceObj.y)) {
        fallingPieceObj.x += 1;
    }
    renderGame();
}

function rotate() {
    if (!fallingPieceObj) return;
    
    let rotatedPiece = [];
    let piece = fallingPieceObj.piece;
    for (let i = 0; i < piece.length; i++) {
        rotatedPiece.push([]);
        for (let j = 0; j < piece[i].length; j++) {
            rotatedPiece[i].push(0);
        }
    }
    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[i].length; j++) {
            rotatedPiece[i][j] = piece[j][i];
        }
    }

    for (let i = 0; i < rotatedPiece.length; i++) {
        rotatedPiece[i] = rotatedPiece[i].reverse();
    }
    if (!collision(fallingPieceObj.x, fallingPieceObj.y, rotatedPiece)) {
        fallingPieceObj.piece = rotatedPiece;
    }
    renderGame();
}

function collision(x, y, rotatedPiece) {
    let piece = rotatedPiece || fallingPieceObj.piece;
    for (let i = 0; i < piece.length; i++) {
        for (let j = 0; j < piece[i].length; j++) {
            if (piece[i][j] == 1) {
                let p = x + j;
                let q = y + i;
                if (p >= 0 && p < COLS && q >= 0 && q < ROWS) {
                    if (grid[q][p] > 0) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        }
    }
    return false;
}

function renderGame() {
    for (let i = 0; i < grid.length; i++) {
        for (let j = 0; j < grid[i].length; j++) {
            ctx.fillStyle = COLORS[grid[i][j]];
            ctx.fillRect(j, i, 1, 1);
        }
    }
    if (fallingPieceObj) {
        renderPiece();
    }
}

// ============================================================
// KEYBOARD CONTROLS
// ============================================================
document.addEventListener("keydown", function (e) {
    if (!isGameRunning) return;
    
    let key = e.key;
    if (key == "ArrowDown") {
        moveDown();
    } else if (key == "ArrowLeft") {
        moveLeft();
    } else if (key == "ArrowRight") {
        moveRight();
    } else if (key == "ArrowUp") {
        rotate();
    }
});

// ============================================================
// TOUCH SWIPE CONTROLS FOR MOBILE
// ============================================================
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

canvas.addEventListener('touchstart', (e) => {
    if (!isGameRunning || !isMobileView()) return;
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, false);

canvas.addEventListener('touchend', (e) => {
    if (!isGameRunning || !isMobileView()) return;
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
}, false);

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const minSwipeDistance = 30;
    
    // Determine if swipe is more horizontal or vertical
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                moveRight();
            } else {
                moveLeft();
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > minSwipeDistance) {
            if (deltaY > 0) {
                moveDown();
            } else {
                rotate();
            }
        }
    }
}

// ============================================================
// INITIALIZE GAME
// ============================================================
updateCanvasColors();
startGame();