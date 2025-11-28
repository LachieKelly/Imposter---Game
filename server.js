const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8000;

// Word database - loaded from words.txt
let wordDatabase = [];

// Load words from file
function loadWords() {
  try {
    const fileContent = fs.readFileSync(path.join(__dirname, 'words.txt'), 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    wordDatabase = lines.map(line => {
      const parts = line.split(' - ');
      if (parts.length === 2) {
        return {
          word: parts[0].trim(),
          hint: parts[1].trim()
        };
      }
      return null;
    }).filter(item => item !== null);
    
    console.log(`Loaded ${wordDatabase.length} words from words.txt`);
  } catch (error) {
    console.error('Error loading words.txt:', error);
    // Fallback to default words if file doesn't exist
    wordDatabase = [
      { word: 'ocean', hint: 'water' },
      { word: 'cheese', hint: 'food' },
      { word: 'table', hint: 'legs' }
    ];
  }
}

// Get random word and hint
function getRandomWord() {
  if (wordDatabase.length === 0) {
    loadWords();
  }
  
  if (wordDatabase.length === 0) {
    return { word: 'ocean', hint: 'water' };
  }
  
  const randomIndex = Math.floor(Math.random() * wordDatabase.length);
  return wordDatabase[randomIndex];
}

// Load words on server start
loadWords();

// Middleware
app.use(cors());
app.use(express.json());

// Lobby storage (in production, use a database)
const lobbies = {};

// Generate unique 8-character alphanumeric code
function generateLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (lobbies[code]); // Ensure uniqueness
  return code;
}

// API Routes

// Create a new lobby
app.post('/api/lobby/create', (req, res) => {
  const { hostName } = req.body;
  
  if (!hostName) {
    return res.status(400).json({ error: 'Host name is required' });
  }
  
  const code = generateLobbyCode();
  const lobby = {
    code: code,
    host: hostName,
    rounds: 1, // Always 1 round
    players: [{
      name: hostName,
      isHost: true
    }],
    started: false,
    createdAt: new Date().toISOString()
  };
  
  lobbies[code] = lobby;
  console.log(`Lobby created: ${code} by ${hostName}`);
  
  res.json({ 
    success: true, 
    lobbyCode: code,
    lobby: lobby
  });
});

// Join an existing lobby
app.post('/api/lobby/join', (req, res) => {
  const { code, playerName } = req.body;
  
  if (!code || !playerName) {
    return res.status(400).json({ error: 'Lobby code and player name are required' });
  }
  
  const lobbyCode = code.toUpperCase().trim();
  const lobby = lobbies[lobbyCode];
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found. Please check the code.' });
  }
  
  if (lobby.started) {
    return res.status(400).json({ error: 'This lobby has already started.' });
  }
  
  // Check if name is already taken
  if (lobby.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
    return res.status(400).json({ error: 'This name is already taken in this lobby' });
  }
  
  // Add player to lobby
  lobby.players.push({
    name: playerName,
    isHost: false
  });
  
  console.log(`Player ${playerName} joined lobby ${lobbyCode}`);
  
  res.json({ 
    success: true, 
    lobby: lobby
  });
});

// Get lobby information
app.get('/api/lobby/:code', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const lobby = lobbies[code];
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  res.json({ success: true, lobby: lobby });
});

// Start the game
app.post('/api/lobby/:code/start', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerName } = req.body;
  
  const lobby = lobbies[code];
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  if (lobby.host !== playerName) {
    return res.status(403).json({ error: 'Only the host can start the game' });
  }
  
  if (lobby.players.length < 2) {
    return res.status(400).json({ error: 'You need at least 2 players to start the game' });
  }
  
  if (lobby.started) {
    return res.status(400).json({ error: 'Game has already started' });
  }
  
  // Initialize game state
  lobby.started = true;
  lobby.currentRound = 1;
  lobby.gameState = 'countdown'; // countdown, role-assignment, playing, results
  lobby.imposter = null;
  lobby.word = null;
  lobby.hint = null;
  lobby.firstPlayer = null;
  lobby.roundFinished = false;
  lobby.gameFinished = false;
  
  console.log(`Lobby ${code} started by ${playerName}`);
  
  res.json({ success: true, lobby: lobby });
});

// Get current game state
app.get('/api/lobby/:code/game', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const lobby = lobbies[code];
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  if (!lobby.started) {
    return res.status(400).json({ error: 'Game has not started yet' });
  }
  
  res.json({ 
    success: true, 
    gameState: lobby.gameState,
    currentRound: lobby.currentRound,
    totalRounds: lobby.rounds,
    imposter: lobby.imposter,
    word: lobby.word,
    hint: lobby.hint,
    firstPlayer: lobby.firstPlayer,
    roundFinished: lobby.roundFinished
  });
});

// Start round (assign roles, word, hint)
app.post('/api/lobby/:code/start-round', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const lobby = lobbies[code];
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  if (!lobby.started) {
    return res.status(400).json({ error: 'Game has not started yet' });
  }
  
  // Select random imposter
  const imposterIndex = Math.floor(Math.random() * lobby.players.length);
  lobby.imposter = lobby.players[imposterIndex].name;
  
  // Get random word and hint
  const wordData = getRandomWord();
  lobby.word = wordData.word;
  lobby.hint = wordData.hint;
  
  // Select random first player
  const firstPlayerIndex = Math.floor(Math.random() * lobby.players.length);
  lobby.firstPlayer = lobby.players[firstPlayerIndex].name;
  
  lobby.gameState = 'role-assignment';
  lobby.roundFinished = false;
  
  console.log(`Round ${lobby.currentRound} started in lobby ${code}. Imposter: ${lobby.imposter}, Word: ${lobby.word}`);
  
  res.json({ 
    success: true, 
    imposter: lobby.imposter,
    word: lobby.word,
    hint: lobby.hint,
    firstPlayer: lobby.firstPlayer
  });
});

// Transition to playing state
app.post('/api/lobby/:code/start-playing', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const lobby = lobbies[code];
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  if (lobby.gameState !== 'role-assignment') {
    return res.status(400).json({ error: 'Not in role assignment state' });
  }
  
  lobby.gameState = 'playing';
  
  res.json({ success: true });
});

// Finish round (show results)
app.post('/api/lobby/:code/finish-round', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerName } = req.body;
  const lobby = lobbies[code];
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  if (lobby.host !== playerName) {
    return res.status(403).json({ error: 'Only the host can finish the round' });
  }
  
  // Game finished - only 1 round
  lobby.gameState = 'results';
  lobby.roundFinished = true;
  lobby.gameFinished = true;
  
  res.json({ 
    success: true,
    imposter: lobby.imposter,
    word: lobby.word,
    hint: lobby.hint,
    currentRound: 1,
    totalRounds: 1,
    gameFinished: true
  });
});

// Leave lobby
app.post('/api/lobby/:code/leave', (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const { playerName } = req.body;
  const lobby = lobbies[code];
  
  if (!lobby) {
    return res.status(404).json({ error: 'Lobby not found' });
  }
  
  // Remove player from lobby
  lobby.players = lobby.players.filter(p => p.name !== playerName);
  
  // If host leaves or lobby is empty, delete the lobby
  if (lobby.host === playerName || lobby.players.length === 0) {
    delete lobbies[code];
    console.log(`Lobby ${code} deleted`);
  }
  
  res.json({ success: true });
});

// Get all active lobbies (for debugging/admin)
app.get('/api/lobbies', (req, res) => {
  res.json({ 
    success: true, 
    lobbies: Object.keys(lobbies),
    count: Object.keys(lobbies).length
  });
});

// Clean up old lobbies (optional - runs every 30 minutes)
setInterval(() => {
  const now = new Date();
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  
  for (const code in lobbies) {
    const lobby = lobbies[code];
    const age = now - new Date(lobby.createdAt);
    if (age > maxAge && !lobby.started) {
      delete lobbies[code];
      console.log(`Cleaned up old lobby: ${code}`);
    }
  }
}, 30 * 60 * 1000);

// Serve static files (must be after API routes)
app.use(express.static('.'));

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Imposter Game Server running at http://localhost:${PORT}/`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
  console.log('Press Ctrl+C to stop the server');
});
