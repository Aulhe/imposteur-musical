const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

const THEME_PAIRS = [
  { normal: 'League of Legends', impostor: 'Valorant' },
  { normal: 'Osamason / Autumn!', impostor: 'SoundCloud Rap 2016 (Lil Uzi, Playboi Carti early)' },
  { normal: 'Memes internet classiques (2010-2018)', impostor: 'Memes TikTok (2020+)' },
  { normal: 'Anime Openings', impostor: 'K-Pop' },
  { normal: 'Phonk', impostor: 'Brazilian Funk / Baile Funk' },
  { normal: 'Minecraft', impostor: 'Roblox' },
  { normal: 'Detroit Rap (BabyTron, Rio Da Yung OG)', impostor: 'Atlanta Rap (Future, Young Thug)' },
  { normal: 'Films Studio Ghibli', impostor: 'Films Disney' },
  { normal: 'GTA San Andreas', impostor: 'GTA V' },
  { normal: 'Drill UK', impostor: 'Drill US (New York)' },
  { normal: 'Musique lo-fi / chill beats', impostor: 'Vaporwave / Synthwave' },
  { normal: 'Metal / Rock classique', impostor: 'Punk Rock' },
  { normal: 'Naruto', impostor: 'Dragon Ball' },
  { normal: 'Twitch / Streaming culture', impostor: 'YouTube culture' },
  { normal: 'Travis Scott', impostor: 'Kid Cudi' },
  { normal: 'Rage beats (Yeat, Playboi Carti)', impostor: 'Hyperpop (100 gecs, Bladee)' },
  { normal: 'Dark Souls / Elden Ring', impostor: 'Skyrim / RPG western' },
  { normal: 'Rap FR ancien (Booba, Rohff)', impostor: 'Rap FR nouvelle gen (Ninho, Gazo)' },
  { normal: 'Fortnite', impostor: 'Apex Legends' },
  { normal: 'One Piece', impostor: 'Fairy Tail' },
  { normal: 'Musique de film épique (Hans Zimmer)', impostor: 'Musique de jeu vidéo épique' },
  { normal: 'Summrs / Rino / Kankan', impostor: 'Bladee / Drain Gang' },
  { normal: 'Pop Smoke / Drill NY', impostor: 'Chief Keef / Drill Chicago' },
  { normal: 'Mario / Nintendo', impostor: 'Sonic / SEGA' },
  { normal: 'Emojis / langage internet', impostor: 'Argot IRL / verlan' },
];

const lobbies = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function pickThemePair(usedIndices) {
  const available = THEME_PAIRS.map((_, i) => i).filter(i => !usedIndices.includes(i));
  if (available.length === 0) return THEME_PAIRS[Math.floor(Math.random() * THEME_PAIRS.length)];
  const idx = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(idx);
  return THEME_PAIRS[idx];
}

io.on('connection', (socket) => {

  socket.on('create-lobby', (playerName, callback) => {
    let code;
    do { code = generateCode(); } while (lobbies.has(code));

    const lobby = {
      code,
      host: socket.id,
      players: [{ id: socket.id, name: playerName, score: 0 }],
      state: 'waiting',
      round: 0,
      totalRounds: 3,
      currentTurn: 0,
      themePair: null,
      impostorId: null,
      submissions: new Map(),
      votes: new Map(),
      usedThemeIndices: [],
    };

    lobbies.set(code, lobby);
    socket.join(code);
    callback({ success: true, code, lobby: sanitizeLobby(lobby) });
  });

  socket.on('join-lobby', (code, playerName, callback) => {
    const lobby = lobbies.get(code);
    if (!lobby) return callback({ success: false, error: 'Lobby introuvable' });
    if (lobby.state !== 'waiting') return callback({ success: false, error: 'Partie déjà en cours' });
    if (lobby.players.length >= 10) return callback({ success: false, error: 'Lobby plein (max 10)' });
    if (lobby.players.some(p => p.name === playerName)) return callback({ success: false, error: 'Ce pseudo est déjà pris' });

    lobby.players.push({ id: socket.id, name: playerName, score: 0 });
    socket.join(code);
    io.to(code).emit('lobby-updated', sanitizeLobby(lobby));
    callback({ success: true, lobby: sanitizeLobby(lobby) });
  });

  socket.on('start-game', (code, settings, callback) => {
    const lobby = lobbies.get(code);
    if (!lobby) return callback({ success: false });
    if (lobby.host !== socket.id) return callback({ success: false, error: "Seul l'hôte peut lancer" });
    if (lobby.players.length < 3) return callback({ success: false, error: 'Il faut au moins 3 joueurs' });

    lobby.totalRounds = settings?.rounds || 3;
    lobby.round = 0;
    lobby.usedThemeIndices = [];
    startNewRound(lobby);
    callback({ success: true });
  });

  socket.on('submit-link', (code, link, callback) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.state !== 'playing') return callback({ success: false });

    const currentPlayer = lobby.players[lobby.currentTurn];
    if (currentPlayer.id !== socket.id) return callback({ success: false, error: "Ce n'est pas ton tour" });

    lobby.submissions.set(socket.id, link);
    io.to(code).emit('link-submitted', {
      playerName: currentPlayer.name,
      link,
      turnIndex: lobby.currentTurn,
    });

    lobby.currentTurn++;
    if (lobby.currentTurn >= lobby.players.length) {
      lobby.state = 'voting';
      io.to(code).emit('phase-changed', { state: 'voting', lobby: sanitizeLobby(lobby) });
    } else {
      io.to(code).emit('next-turn', {
        currentTurn: lobby.currentTurn,
        playerName: lobby.players[lobby.currentTurn].name,
        lobby: sanitizeLobby(lobby),
      });
    }
    callback({ success: true });
  });

  socket.on('vote', (code, votedPlayerId, callback) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.state !== 'voting') return callback({ success: false });
    if (socket.id === votedPlayerId) return callback({ success: false, error: 'Tu ne peux pas voter pour toi' });

    lobby.votes.set(socket.id, votedPlayerId);

    io.to(code).emit('vote-cast', { voterCount: lobby.votes.size, total: lobby.players.length });

    if (lobby.votes.size >= lobby.players.length) {
      resolveVotes(lobby);
    }
    callback({ success: true });
  });

  socket.on('next-round', (code) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.host !== socket.id) return;
    if (lobby.round < lobby.totalRounds) {
      startNewRound(lobby);
    } else {
      lobby.state = 'finished';
      io.to(code).emit('game-finished', {
        players: lobby.players.map(p => ({ name: p.name, score: p.score })),
      });
    }
  });

  socket.on('restart-game', (code) => {
    const lobby = lobbies.get(code);
    if (!lobby || lobby.host !== socket.id) return;
    lobby.players.forEach(p => p.score = 0);
    lobby.state = 'waiting';
    lobby.round = 0;
    lobby.usedThemeIndices = [];
    io.to(code).emit('lobby-updated', sanitizeLobby(lobby));
    io.to(code).emit('back-to-lobby');
  });

  socket.on('disconnect', () => {
    for (const [code, lobby] of lobbies) {
      const idx = lobby.players.findIndex(p => p.id === socket.id);
      if (idx === -1) continue;

      lobby.players.splice(idx, 1);

      if (lobby.players.length === 0) {
        lobbies.delete(code);
        continue;
      }

      if (lobby.host === socket.id) {
        lobby.host = lobby.players[0].id;
      }

      io.to(code).emit('player-left', {
        lobby: sanitizeLobby(lobby),
        hostId: lobby.host,
      });

      if (lobby.state === 'voting' && lobby.votes.size >= lobby.players.length) {
        resolveVotes(lobby);
      }
    }
  });
});

function startNewRound(lobby) {
  lobby.round++;
  lobby.currentTurn = 0;
  lobby.submissions = new Map();
  lobby.votes = new Map();
  lobby.state = 'playing';

  const pair = pickThemePair(lobby.usedThemeIndices);
  lobby.themePair = pair;

  const impostorIdx = Math.floor(Math.random() * lobby.players.length);
  lobby.impostorId = lobby.players[impostorIdx].id;

  const shuffled = [...lobby.players].sort(() => Math.random() - 0.5);
  lobby.players = shuffled;
  lobby.impostorId = lobby.players.find(p => p.id === lobby.impostorId)?.id || lobby.players[impostorIdx % lobby.players.length].id;

  lobby.players.forEach(player => {
    const isImpostor = player.id === lobby.impostorId;
    io.to(player.id).emit('round-start', {
      round: lobby.round,
      totalRounds: lobby.totalRounds,
      theme: isImpostor ? pair.impostor : pair.normal,
      isImpostor,
      currentTurn: 0,
      currentPlayerName: lobby.players[0].name,
      players: lobby.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    });
  });
}

function resolveVotes(lobby) {
  const voteCounts = new Map();
  lobby.players.forEach(p => voteCounts.set(p.id, 0));
  for (const votedId of lobby.votes.values()) {
    voteCounts.set(votedId, (voteCounts.get(votedId) || 0) + 1);
  }

  let maxVotes = 0;
  let eliminated = null;
  for (const [id, count] of voteCounts) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = id;
    }
  }

  const impostorFound = eliminated === lobby.impostorId;

  if (impostorFound) {
    lobby.players.forEach(p => {
      if (p.id !== lobby.impostorId) p.score += 1;
    });
  } else {
    const impostor = lobby.players.find(p => p.id === lobby.impostorId);
    if (impostor) impostor.score += 2;
  }

  const voteDetails = [];
  for (const [voterId, votedId] of lobby.votes) {
    const voter = lobby.players.find(p => p.id === voterId);
    const voted = lobby.players.find(p => p.id === votedId);
    if (voter && voted) voteDetails.push({ voter: voter.name, voted: voted.name });
  }

  lobby.state = 'results';
  io.to(lobby.code).emit('round-results', {
    impostorName: lobby.players.find(p => p.id === lobby.impostorId)?.name,
    impostorFound,
    eliminatedName: lobby.players.find(p => p.id === eliminated)?.name,
    themePair: lobby.themePair,
    votes: voteDetails,
    scores: lobby.players.map(p => ({ name: p.name, score: p.score })),
    round: lobby.round,
    totalRounds: lobby.totalRounds,
  });
}

function sanitizeLobby(lobby) {
  return {
    code: lobby.code,
    hostId: lobby.host,
    players: lobby.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
    state: lobby.state,
    round: lobby.round,
    totalRounds: lobby.totalRounds,
    currentTurn: lobby.currentTurn,
  };
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
