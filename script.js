// Game state
let gameState = {
    isHost: false,
    lobbyCode: '',
    playerName: '',
    rounds: 5,
    players: [],
    currentLobbyCode: '',
    pollInterval: null,
    gamePollInterval: null,
    countdownActive: false,
    currentWord: null,
    currentHint: null,
    isImposter: false,
    currentImposter: null,
    firstPlayer: null
};

const API_BASE = window.location.origin;

// API helper functions
async function apiCall(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}/api${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Navigation functions
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function goHome() {
    showPage('home-page');
    // Stop polling if active
    if (gameState.pollInterval) {
        clearInterval(gameState.pollInterval);
        gameState.pollInterval = null;
    }
    if (gameState.gamePollInterval) {
        clearInterval(gameState.gamePollInterval);
        gameState.gamePollInterval = null;
    }
    // Reset state
    gameState = {
        isHost: false,
        lobbyCode: '',
        playerName: '',
        rounds: 5,
        players: [],
        currentLobbyCode: '',
        pollInterval: null,
        gamePollInterval: null,
        countdownActive: false,
        currentWord: null,
        currentHint: null,
        isImposter: false,
        currentImposter: null,
        firstPlayer: null
    };
}

function showCreateLobby() {
    showPage('create-customize-page');
    document.getElementById('rounds-input').value = 5;
}

function goBackToCustomize() {
    showPage('create-customize-page');
}

function finalizeLobby() {
    gameState.rounds = 1; // Always 1 round
    showPage('create-name-page');
    document.getElementById('host-name-input').value = '';
}

async function saveHostName() {
    const name = document.getElementById('host-name-input').value.trim();
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    try {
        const result = await apiCall('/lobby/create', 'POST', {
            hostName: name,
            rounds: 1 // Always 1 round
        });
        
        gameState.isHost = true;
        gameState.playerName = name;
        gameState.lobbyCode = result.lobbyCode;
        gameState.currentLobbyCode = result.lobbyCode;
        gameState.players = result.lobby.players;
        gameState.rounds = result.lobby.rounds;
        
        showLobbyWaitingRoom();
    } catch (error) {
        alert('Failed to create lobby: ' + error.message);
    }
}

function showJoinLobby() {
    showPage('join-code-page');
    document.getElementById('lobby-code-input').value = '';
    document.getElementById('join-error').textContent = '';
}

function goBackToJoinCode() {
    showPage('join-code-page');
    document.getElementById('join-error').textContent = '';
}

async function joinLobby() {
    const code = document.getElementById('lobby-code-input').value.trim().toUpperCase();
    document.getElementById('join-error').textContent = '';
    
    if (!code || code.length !== 8) {
        document.getElementById('join-error').textContent = 'Please enter a valid 8-digit code';
        return;
    }
    
    try {
        // Check if lobby exists
        const result = await apiCall(`/lobby/${code}`, 'GET');
        
        if (result.lobby.started) {
            document.getElementById('join-error').textContent = 'This lobby has already started.';
            return;
        }
        
        gameState.currentLobbyCode = code;
        gameState.isHost = false;
        showPage('join-name-page');
        document.getElementById('player-name-input').value = '';
    } catch (error) {
        document.getElementById('join-error').textContent = error.message || 'Lobby not found. Please check the code.';
    }
}

async function savePlayerName() {
    const name = document.getElementById('player-name-input').value.trim();
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    const code = gameState.currentLobbyCode;
    
    try {
        const result = await apiCall('/lobby/join', 'POST', {
            code: code,
            playerName: name
        });
        
        gameState.playerName = name;
        gameState.lobbyCode = code;
        gameState.players = result.lobby.players;
        
        showLobbyWaitingRoom();
    } catch (error) {
        alert('Failed to join lobby: ' + error.message);
    }
}

function showLobbyWaitingRoom() {
    showPage('lobby-waiting-page');
    updateLobbyDisplay();
    
    // Show start button only for host
    const startButton = document.getElementById('start-button');
    if (gameState.isHost) {
        startButton.classList.add('show');
    } else {
        startButton.classList.remove('show');
    }
    
    // Start polling for lobby updates
    startLobbyPolling();
}

function startLobbyPolling() {
    // Clear any existing polling
    if (gameState.pollInterval) {
        clearInterval(gameState.pollInterval);
    }
    
    // Poll every 2 seconds to get updated player list
    gameState.pollInterval = setInterval(async () => {
        try {
            const result = await apiCall(`/lobby/${gameState.lobbyCode}`, 'GET');
            gameState.players = result.lobby.players;
            
            // Update display
            updateLobbyDisplay();
            
            // If game started, start polling game state
            if (result.lobby.started && !gameState.gamePollInterval) {
                clearInterval(gameState.pollInterval);
                gameState.pollInterval = null;
                startGameStatePolling();
            }
        } catch (error) {
            console.error('Failed to update lobby:', error);
            // If lobby doesn't exist, go home
            if (error.message.includes('not found')) {
                clearInterval(gameState.pollInterval);
                gameState.pollInterval = null;
                alert('Lobby no longer exists');
                goHome();
            }
        }
    }, 2000);
}

function updateLobbyDisplay() {
    // Update lobby code
    document.getElementById('lobby-code-display').textContent = gameState.lobbyCode;
    
    // Update players list
    const playersList = document.getElementById('players-list');
    playersList.innerHTML = '';
    
    if (gameState.players.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No players yet...';
        li.style.color = '#888';
        li.style.textAlign = 'center';
        li.style.padding = '20px';
        playersList.appendChild(li);
    } else {
        gameState.players.forEach(player => {
            const li = document.createElement('li');
            li.className = 'player-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'player-name';
            nameSpan.textContent = player.name;
            
            li.appendChild(nameSpan);
            
            if (player.isHost) {
                const crown = document.createElement('span');
                crown.className = 'crown-icon';
                crown.textContent = '👑';
                crown.title = 'Host';
                li.insertBefore(crown, nameSpan);
            }
            
            playersList.appendChild(li);
        });
    }
}

async function startGame() {
    if (!gameState.isHost) {
        return;
    }
    
    if (gameState.players.length < 2) {
        alert('You need at least 2 players to start the game');
        return;
    }
    
    try {
        const result = await apiCall(`/lobby/${gameState.lobbyCode}/start`, 'POST', {
            playerName: gameState.playerName
        });
        
        // Stop polling
        if (gameState.pollInterval) {
            clearInterval(gameState.pollInterval);
            gameState.pollInterval = null;
        }
        
        // Start game state polling - countdown will be shown via polling for everyone
        startGameStatePolling();
    } catch (error) {
        alert('Failed to start game: ' + error.message);
    }
}

// Game state polling
function startGameStatePolling() {
    if (gameState.gamePollInterval) {
        clearInterval(gameState.gamePollInterval);
    }
    
    gameState.gamePollInterval = setInterval(async () => {
        try {
            const result = await apiCall(`/lobby/${gameState.lobbyCode}/game`, 'GET');
            
            // Handle different game states
            if (result.gameState === 'countdown') {
                // Show countdown for everyone - check if not already showing
                if (!document.getElementById('game-countdown-page').classList.contains('active') && !gameState.countdownActive) {
                    showCountdown();
                }
            } else if (result.gameState === 'role-assignment' && !document.getElementById('role-assignment-page').classList.contains('active')) {
                showRoleAssignment(result);
            } else if (result.gameState === 'playing') {
                // Always update playing screen with current data
                if (!document.getElementById('game-playing-page').classList.contains('active')) {
                    showGamePlaying(result);
                } else {
                    // Already on playing screen, just update it
                    updateGamePlayingScreen(result);
                }
            } else if (result.gameState === 'results' && !document.getElementById('results-page').classList.contains('active')) {
                showResults(result);
            } else if (!result.gameState && result.gameFinished) {
                // Game completed
                clearInterval(gameState.gamePollInterval);
                gameState.gamePollInterval = null;
                alert('Game completed! Returning to home screen.');
                goHome();
            }
        } catch (error) {
            console.error('Failed to poll game state:', error);
        }
    }, 1000); // Poll every second
}

// Show countdown screen
function showCountdown() {
    // Prevent multiple countdowns from running
    if (gameState.countdownActive) {
        return;
    }
    
    gameState.countdownActive = true;
    showPage('game-countdown-page');
    let count = 5;
    const countdownDisplay = document.getElementById('countdown-display');
    const roundDisplay = document.getElementById('round-number-display');
    
    // Show round info (always 1 round now)
    roundDisplay.textContent = 'Round Starting';
    
    countdownDisplay.textContent = count;
    
    const countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownDisplay.textContent = count;
        } else {
            clearInterval(countdownInterval);
            countdownDisplay.textContent = 'GO!';
            
            // Start the round after countdown (only host can do this)
            setTimeout(async () => {
                gameState.countdownActive = false;
                if (gameState.isHost) {
                    try {
                        await apiCall(`/lobby/${gameState.lobbyCode}/start-round`, 'POST');
                        // Role assignment will be shown via polling
                    } catch (error) {
                        alert('Failed to start round: ' + error.message);
                        gameState.countdownActive = false;
                    }
                }
            }, 500);
        }
    }, 1000);
}

// Show role assignment screen
function showRoleAssignment(gameData) {
    showPage('role-assignment-page');
    
    const roleStatus = document.getElementById('role-status');
    const wordHintDisplay = document.getElementById('word-hint-display');
    const firstPlayerDisplay = document.getElementById('first-player-display');
    
    // Check if current player is imposter
    const isImposter = gameData.imposter === gameState.playerName;
    
    // Store game data for playing screen
    gameState.currentWord = gameData.word;
    gameState.currentHint = gameData.hint;
    gameState.isImposter = isImposter;
    gameState.currentImposter = gameData.imposter;
    gameState.firstPlayer = gameData.firstPlayer;
    
    if (isImposter) {
        roleStatus.textContent = 'YOU ARE THE IMPOSTER';
        roleStatus.className = 'role-status imposter';
        
        wordHintDisplay.innerHTML = `
            <div class="word-label">Hint:</div>
            <div class="hint-value">${gameData.hint}</div>
            <div class="hint-label">Try to blend in with other players!</div>
        `;
    } else {
        roleStatus.textContent = 'YOU ARE NOT THE IMPOSTER';
        roleStatus.className = 'role-status player';
        
        wordHintDisplay.innerHTML = `
            <div class="word-label">The Word Is:</div>
            <div class="word-value">${gameData.word}</div>
            <div class="hint-label">Give hints without saying the word!</div>
        `;
    }
    
    firstPlayerDisplay.textContent = `${gameData.firstPlayer} goes first!`;
    
    // Auto-advance to playing screen after 5 seconds
    setTimeout(async () => {
        try {
            // Update server state to playing (only host needs to do this)
            if (gameState.isHost) {
                await apiCall(`/lobby/${gameState.lobbyCode}/start-playing`, 'POST');
            }
            // Playing screen will be shown via polling
        } catch (error) {
            console.error('Failed to transition to playing:', error);
        }
    }, 5000);
}

// Show game playing screen
function showGamePlaying(gameData) {
    showPage('game-playing-page');
    updateGamePlayingScreen(gameData);
}

function updateGamePlayingScreen(gameData) {
    document.getElementById('playing-round-number').textContent = 'Game in Progress';
    
    // Update stored game data if available from server
    if (gameData.word) gameState.currentWord = gameData.word;
    if (gameData.hint) gameState.currentHint = gameData.hint;
    if (gameData.imposter) {
        gameState.currentImposter = gameData.imposter;
        gameState.isImposter = gameData.imposter === gameState.playerName;
    }
    
    // Show word/hint on playing screen
    const wordHintContainer = document.getElementById('playing-word-hint');
    if (wordHintContainer && gameState.currentWord && gameState.currentHint) {
        if (gameState.isImposter) {
            wordHintContainer.innerHTML = `
                <div class="playing-role-status imposter">YOU ARE THE IMPOSTER</div>
                <div class="playing-hint-display">
                    <div class="hint-label">Your Hint:</div>
                    <div class="hint-value-large">${gameState.currentHint}</div>
                </div>
            `;
        } else {
            wordHintContainer.innerHTML = `
                <div class="playing-role-status player">YOU ARE NOT THE IMPOSTER</div>
                <div class="playing-word-display">
                    <div class="word-label">The Word Is:</div>
                    <div class="word-value-large">${gameState.currentWord}</div>
                </div>
            `;
        }
    }
    
    // Show finished button only for host
    const finishedButton = document.getElementById('finished-button');
    if (gameState.isHost) {
        finishedButton.classList.add('show');
    } else {
        finishedButton.classList.remove('show');
    }
}

// Finish round
async function finishRound() {
    if (!gameState.isHost) {
        return;
    }
    
    try {
        const result = await apiCall(`/lobby/${gameState.lobbyCode}/finish-round`, 'POST', {
            playerName: gameState.playerName
        });
        // Immediately show results with button - use stored data
        const resultData = {
            imposter: result.imposter || gameState.currentImposter,
            word: result.word || gameState.currentWord,
            currentRound: gameState.currentRound || 1,
            totalRounds: gameState.rounds || 5
        };
        showResults(resultData);
    } catch (error) {
        alert('Failed to finish round: ' + error.message);
    }
}

// Copy lobby code to clipboard
async function copyLobbyCode(event) {
    const code = gameState.lobbyCode;
    if (!code) {
        return;
    }
    
    const button = event ? event.target.closest('.copy-button') : document.querySelector('.copy-button');
    const originalHTML = button ? button.innerHTML : null;
    
    try {
        await navigator.clipboard.writeText(code);
        // Show feedback
        if (button && originalHTML) {
            button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
            button.style.color = '#44ff44';
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.color = '';
            }, 2000);
        }
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            if (button && originalHTML) {
                button.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"></path></svg>';
                button.style.color = '#44ff44';
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.style.color = '';
                }, 2000);
            } else {
                alert('Code copied to clipboard!');
            }
        } catch (err) {
            alert('Failed to copy code');
        }
        document.body.removeChild(textArea);
    }
}

// Show results screen
function showResults(gameData) {
    showPage('results-page');
    
    const imposterReveal = document.getElementById('imposter-reveal');
    const wordReveal = document.getElementById('word-reveal');
    const nextRoundInfo = document.getElementById('next-round-info');
    const continueButton = document.getElementById('continue-button');
    
    // Use stored game data if server data is missing
    const imposter = gameData.imposter || gameState.currentImposter;
    const word = gameData.word || gameState.currentWord;
    
    if (imposter && word) {
        imposterReveal.innerHTML = `
            <div class="label">The Imposter Was:</div>
            <div class="name">${imposter}</div>
        `;
        
        wordReveal.innerHTML = `
            <div class="label">The Word Was:</div>
            <div class="value">${word}</div>
        `;
    }
    
    // Always show back button - game is complete
    nextRoundInfo.textContent = `Game Complete!`;
    continueButton.textContent = 'Back';
    continueButton.classList.add('show');
}


// Back to home (clear lobby and return)
async function continueToNextRound() {
    // Clear lobby and return to home
    if (gameState.gamePollInterval) {
        clearInterval(gameState.gamePollInterval);
        gameState.gamePollInterval = null;
    }
    
    // Leave lobby
    try {
        await apiCall(`/lobby/${gameState.lobbyCode}/leave`, 'POST', {
            playerName: gameState.playerName
        });
    } catch (error) {
        // Ignore errors - just go home
        console.error('Error leaving lobby:', error);
    }
    
    goHome();
}

// Allow Enter key to submit forms
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('host-name-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveHostName();
        }
    });
    
    document.getElementById('player-name-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            savePlayerName();
        }
    });
    
    document.getElementById('lobby-code-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinLobby();
        }
    });
    
    // Auto-uppercase lobby code input
    document.getElementById('lobby-code-input').addEventListener('input', (e) => {
        e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });
});
