// Game State
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

let currentGuess = '';
let currentRow = 0;
let gameOver = false;
let targetWord = '';

// Get daily word based on date (same word for everyone on the same day)
function getDailyWord() {
    const today = new Date();
    const startDate = new Date(2024, 0, 1); // Jan 1, 2024
    const daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
    const wordIndex = daysSinceStart % TARGET_WORDS.length;
    return TARGET_WORDS[wordIndex].toUpperCase();
}

// Initialize the game
function initGame() {
    targetWord = getDailyWord();
    currentGuess = '';
    currentRow = 0;
    gameOver = false;

    createBoard();
    setupKeyboard();
    resetKeyboardColors();
    hideModal();
    clearMessage();
}

// Create the game board
function createBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    for (let i = 0; i < MAX_GUESSES; i++) {
        const row = document.createElement('div');
        row.className = 'row';
        row.id = `row-${i}`;

        for (let j = 0; j < WORD_LENGTH; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.id = `tile-${i}-${j}`;
            row.appendChild(tile);
        }

        board.appendChild(row);
    }
}

// Setup keyboard event listeners
function setupKeyboard() {
    // Virtual keyboard
    const keys = document.querySelectorAll('.keyboard button');
    keys.forEach(key => {
        key.addEventListener('click', () => handleKeyPress(key.dataset.key));
    });

    // Physical keyboard
    document.addEventListener('keydown', (e) => {
        if (gameOver) return;

        if (e.key === 'Enter') {
            handleKeyPress('Enter');
        } else if (e.key === 'Backspace') {
            handleKeyPress('Backspace');
        } else if (/^[a-zA-Z]$/.test(e.key)) {
            handleKeyPress(e.key.toUpperCase());
        }
    });
}

// Handle key press
function handleKeyPress(key) {
    if (gameOver) return;

    if (key === 'Enter') {
        submitGuess();
    } else if (key === 'Backspace') {
        deleteLetter();
    } else if (currentGuess.length < WORD_LENGTH && /^[A-Z]$/.test(key)) {
        addLetter(key);
    }
}

// Add a letter to current guess
function addLetter(letter) {
    if (currentGuess.length < WORD_LENGTH) {
        currentGuess += letter;
        const tile = document.getElementById(`tile-${currentRow}-${currentGuess.length - 1}`);
        tile.textContent = letter;
        tile.classList.add('filled');
    }
}

// Delete last letter
function deleteLetter() {
    if (currentGuess.length > 0) {
        const tile = document.getElementById(`tile-${currentRow}-${currentGuess.length - 1}`);
        tile.textContent = '';
        tile.classList.remove('filled');
        currentGuess = currentGuess.slice(0, -1);
    }
}

// Submit the current guess
function submitGuess() {
    if (currentGuess.length !== WORD_LENGTH) {
        showMessage('Not enough letters');
        shakeRow();
        return;
    }

    // Accept any 5-letter word and check character positions
    clearMessage();
    revealGuess();
}

// Check if word is valid
function isValidWord(word) {
    return VALID_GUESSES.has(word.toLowerCase());
}

// Reveal the guess with animations
function revealGuess() {
    const guess = currentGuess;
    const targetArray = targetWord.split('');
    const guessArray = guess.split('');
    const result = new Array(WORD_LENGTH).fill('absent');

    // Track which target letters have been matched
    const targetUsed = new Array(WORD_LENGTH).fill(false);

    // First pass: find correct letters (green)
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessArray[i] === targetArray[i]) {
            result[i] = 'correct';
            targetUsed[i] = true;
        }
    }

    // Second pass: find present letters (yellow)
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (result[i] === 'correct') continue;

        for (let j = 0; j < WORD_LENGTH; j++) {
            if (!targetUsed[j] && guessArray[i] === targetArray[j]) {
                result[i] = 'present';
                targetUsed[j] = true;
                break;
            }
        }
    }

    // Animate tiles
    for (let i = 0; i < WORD_LENGTH; i++) {
        setTimeout(() => {
            const tile = document.getElementById(`tile-${currentRow}-${i}`);
            tile.classList.add('flip');

            setTimeout(() => {
                tile.classList.add(result[i]);
                updateKeyboard(guessArray[i], result[i]);
            }, 300);
        }, i * 200);
    }

    // Check win/lose after animation
    setTimeout(() => {
        if (guess === targetWord) {
            handleWin();
        } else if (currentRow === MAX_GUESSES - 1) {
            handleLose();
        } else {
            currentRow++;
            currentGuess = '';
        }
    }, WORD_LENGTH * 200 + 400);
}

// Update keyboard key colors
function updateKeyboard(letter, status) {
    const key = document.querySelector(`[data-key="${letter}"]`);
    if (!key) return;

    // Priority: correct > present > absent
    if (key.classList.contains('correct')) return;
    if (status === 'correct') {
        key.classList.remove('present', 'absent');
        key.classList.add('correct');
    } else if (status === 'present' && !key.classList.contains('correct')) {
        key.classList.remove('absent');
        key.classList.add('present');
    } else if (!key.classList.contains('present') && !key.classList.contains('correct')) {
        key.classList.add('absent');
    }
}

// Reset keyboard colors
function resetKeyboardColors() {
    const keys = document.querySelectorAll('.keyboard button');
    keys.forEach(key => {
        key.classList.remove('correct', 'present', 'absent');
    });
}

// Handle win
function handleWin() {
    gameOver = true;

    // Bounce animation for winning row
    for (let i = 0; i < WORD_LENGTH; i++) {
        setTimeout(() => {
            const tile = document.getElementById(`tile-${currentRow}-${i}`);
            tile.classList.add('win');
        }, i * 100);
    }

    setTimeout(() => {
        showModal('🎉 Brilliant!', `You got it in ${currentRow + 1} ${currentRow === 0 ? 'try' : 'tries'}!`, targetWord);
    }, 1500);
}

// Handle lose
function handleLose() {
    gameOver = true;
    setTimeout(() => {
        showModal('😔 Game Over', 'Better luck next time!', targetWord);
    }, 500);
}

// Show message
function showMessage(text) {
    const message = document.getElementById('message');
    message.textContent = text;
}

// Clear message
function clearMessage() {
    document.getElementById('message').textContent = '';
}

// Shake current row
function shakeRow() {
    const row = document.getElementById(`row-${currentRow}`);
    row.classList.add('shake');
    setTimeout(() => row.classList.remove('shake'), 500);
}

// Show modal
function showModal(title, message, word) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-message').textContent = message;
    document.getElementById('modal-word').textContent = word;
    document.getElementById('modal').classList.remove('hidden');
}

// Hide modal
function hideModal() {
    document.getElementById('modal').classList.add('hidden');
}

// Play again - get a random word instead of daily word
function playAgain() {
    targetWord = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)].toUpperCase();
    currentGuess = '';
    currentRow = 0;
    gameOver = false;

    createBoard();
    resetKeyboardColors();
    hideModal();
    clearMessage();
}

// Event listener for play again button
document.getElementById('play-again').addEventListener('click', playAgain);

// Initialize game on load
document.addEventListener('DOMContentLoaded', initGame);
