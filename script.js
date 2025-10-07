let canvas = document.querySelector("#tetris");
let scoreDisplay = document.getElementById("scoreDisplay");
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
// Manages theme switching between dark and light modes.
// Uses localStorage to persist user preference across sessions.
// CSS variables (defined in :root and .dark-theme) automatically
// update all themed elements when the class toggles.

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
    
    // Update canvas background color based on theme
    updateCanvasColors();
    renderGame();
});

// Updates the canvas background color to match the current theme
function updateCanvasColors() {
    const isDark = body.classList.contains('dark-theme');
    COLORS[0] = isDark ? "#1a1a1a" : "#ffffff";
}

// ============================================================
// MOBILE NAVIGATION FUNCTIONALITY
// ============================================================
// Implements horizontal section navigation for mobile devices.
// Logic:
// 1. Detect viewport width < 768px via media query check
// 2. Track current section index (0 = game, 1 = info)
// 3. On button click, calculate new scroll position
// 4. Use smooth scrolling to transition between sections
// 5. Update indicator dots to show current section

const contentWrapper = document.getElementById('contentWrapper');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const indicatorDots = document.querySelectorAll('.indicator-dot');

let currentSection = 0;
const totalSections = 2; // Game section and Info section

// Check if we're on mobile viewport
function isMobile() {
    return window.innerWidth < 768;
}

// Update navigation button visibility based on current section
function updateNavButtons() {
    if (!isMobile()) return;
    
    // Hide prev button on first section
    if (currentSection === 0) {
        prevBtn.style.opacity = '0.3';
        prevBtn.style.pointerEvents = 'none';
    } else {
        prevBtn.style.opacity = '1';
        prevBtn.style.pointerEvents = 'auto';
    }
    
    // Hide next button on last section
    if (currentSection === totalSections - 1) {
        nextBtn.style.opacity = '0.3';
        nextBtn.style.pointerEvents = 'none';
    } else {
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'auto';
    }
    
    // Update indicator dots
    indicatorDots.forEach((dot, index) => {
        if (index === currentSection) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
}

// Navigate to specific section with smooth scroll
function navigateToSection(sectionIndex) {
    if (!isMobile()) return;
    
    currentSection = sectionIndex;
    const sectionWidth = contentWrapper.offsetWidth;
    const scrollPosition = sectionIndex * sectionWidth;
    
    // Smooth scroll to the target section
    contentWrapper.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
    });
    
    updateNavButtons();
}

// Previous button click handler
prevBtn.addEventListener('click', () => {
    if (currentSection > 0) {
        navigateToSection(currentSection - 1);
    }
});

// Next button click handler
nextBtn.addEventListener('click', () => {
    if (currentSection < totalSections - 1) {
        navigateToSection(currentSection + 1);
    }
});

// Handle window resize - reset to first section and update buttons
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (isMobile()) {
            navigateToSection(0);
        }
        updateNavButtons();
    }, 250);
});

// Optional: Detect manual scrolling and update current section
contentWrapper.addEventListener('scroll', () => {
    if (!isMobile()) return;
    
    const sectionWidth = contentWrapper.offsetWidth;
    const scrollLeft = contentWrapper.scrollLeft;
    const newSection = Math.round(scrollLeft / sectionWidth);
    
    if (newSection !== currentSection) {
        currentSection = newSection;
        updateNavButtons();
    }
});

// Initialize navigation state
updateNavButtons();

// ============================================================
// GAME FUNCTIONALITY
// ============================================================

// Restart Button Functionality
const restartBtn = document.getElementById('restartBtn');
restartBtn.addEventListener('click', restartGame);

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

// Initialize canvas colors and start game
updateCanvasColors();
startGame();