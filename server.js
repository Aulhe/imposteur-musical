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
  // --- GAMING ---
  { normal: 'League of Legends', impostor: 'Dota 2' },
  { normal: 'League of Legends', impostor: 'Valorant' },
  { normal: 'Fortnite', impostor: 'Apex Legends' },
  { normal: 'Fortnite', impostor: 'PUBG' },
  { normal: 'Minecraft', impostor: 'Roblox' },
  { normal: 'Minecraft', impostor: 'Terraria' },
  { normal: 'GTA San Andreas', impostor: 'GTA V' },
  { normal: 'GTA V', impostor: 'Saints Row' },
  { normal: 'Dark Souls / Elden Ring', impostor: 'Skyrim / RPG western' },
  { normal: 'Mario / Nintendo', impostor: 'Sonic / SEGA' },
  { normal: 'Zelda', impostor: 'Genshin Impact' },
  { normal: 'Call of Duty', impostor: 'Battlefield' },
  { normal: 'FIFA / EA FC', impostor: 'PES / eFootball' },
  { normal: 'Rocket League', impostor: 'Mario Kart' },
  { normal: 'Among Us', impostor: 'Town of Salem' },
  { normal: 'Overwatch', impostor: 'Team Fortress 2' },
  { normal: 'Pokemon', impostor: 'Digimon' },
  { normal: 'The Sims', impostor: 'Animal Crossing' },
  { normal: 'Counter-Strike', impostor: 'Rainbow Six Siege' },
  { normal: 'World of Warcraft', impostor: 'Final Fantasy XIV' },
  { normal: 'Resident Evil', impostor: 'Silent Hill' },
  { normal: 'God of War', impostor: 'Devil May Cry' },
  { normal: 'Cyberpunk 2077', impostor: 'Watch Dogs' },
  { normal: 'Red Dead Redemption', impostor: 'The Witcher' },
  { normal: 'Tetris', impostor: 'Candy Crush' },
  { normal: 'Street Fighter', impostor: 'Mortal Kombat' },
  { normal: 'Clash Royale', impostor: 'Brawl Stars' },
  { normal: 'Stardew Valley', impostor: 'Harvest Moon' },

  // --- RAP US UNDERGROUND ---
  { normal: 'Osamason / Autumn!', impostor: 'SoundCloud Rap 2016 (Lil Uzi, Carti early)' },
  { normal: 'Summrs / Rino / Kankan', impostor: 'Bladee / Drain Gang' },
  { normal: 'Pop Smoke / Drill NY', impostor: 'Chief Keef / Drill Chicago' },
  { normal: 'Detroit Rap (BabyTron, Rio Da Yung OG)', impostor: 'Atlanta Rap (Future, Young Thug)' },
  { normal: 'Travis Scott', impostor: 'Kid Cudi' },
  { normal: 'Rage beats (Yeat, Playboi Carti)', impostor: 'Hyperpop (100 gecs, Bladee)' },
  { normal: 'Playboi Carti', impostor: 'Yeat' },
  { normal: 'Ken Carson / Lone', impostor: 'Destroy Lonely' },
  { normal: 'Lil Uzi Vert', impostor: 'Juice WRLD' },
  { normal: 'XXXTentacion', impostor: 'Ski Mask the Slump God' },
  { normal: 'Tyler, The Creator', impostor: 'Frank Ocean' },
  { normal: 'Kanye West', impostor: 'Kid Cudi' },
  { normal: 'Future / Young Thug', impostor: 'Gunna / Lil Baby' },
  { normal: 'A$AP Rocky', impostor: 'A$AP Ferg' },
  { normal: '21 Savage', impostor: 'Metro Boomin' },
  { normal: 'Denzel Curry', impostor: 'JID' },
  { normal: 'Baby Keem', impostor: 'Kendrick Lamar' },
  { normal: 'Earl Sweatshirt', impostor: 'MF DOOM' },
  { normal: 'Lucki', impostor: 'Summrs' },
  { normal: 'SZA', impostor: 'Summer Walker' },
  { normal: 'Drake', impostor: 'The Weeknd' },
  { normal: 'NBA YoungBoy', impostor: 'Rod Wave' },
  { normal: 'Lil Peep', impostor: 'Lil Tracy' },
  { normal: 'Bones / TeamSESH', impostor: '$uicideboy$' },

  // --- RAP FR ---
  { normal: 'Rap FR ancien (Booba, Rohff)', impostor: 'Rap FR nouvelle gen (Ninho, Gazo)' },
  { normal: 'PNL', impostor: 'SCH' },
  { normal: 'Jul', impostor: 'Soolking' },
  { normal: 'Freeze Corleone', impostor: 'Gazo' },
  { normal: 'Damso', impostor: 'Hamza' },
  { normal: 'Nekfeu', impostor: 'Alpha Wann' },
  { normal: 'Orelsan', impostor: 'Vald' },
  { normal: 'Ninho', impostor: 'Niska' },
  { normal: 'Laylow', impostor: 'Lomepal' },
  { normal: 'SDM', impostor: 'Tiakola' },
  { normal: 'Kaaris', impostor: 'Kalash Criminel' },
  { normal: 'IAM', impostor: 'NTM' },
  { normal: 'Dinos', impostor: 'Georgio' },

  // --- DRILL / GENRES RAP ---
  { normal: 'Drill UK', impostor: 'Drill US (New York)' },
  { normal: 'Phonk', impostor: 'Brazilian Funk / Baile Funk' },
  { normal: 'Trap', impostor: 'Drill' },
  { normal: 'Boom Bap old school', impostor: 'Jazz rap' },
  { normal: 'Cloud rap', impostor: 'Emo rap' },
  { normal: 'Afrotrap', impostor: 'Afrobeats' },
  { normal: 'Grime UK', impostor: 'Drill UK' },
  { normal: 'Memphis rap (Three 6 Mafia)', impostor: 'Houston rap (DJ Screw, chopped & screwed)' },
  { normal: 'Pluggnb', impostor: 'R&B' },

  // --- ANIME / MANGA ---
  { normal: 'Naruto', impostor: 'Dragon Ball' },
  { normal: 'One Piece', impostor: 'Fairy Tail' },
  { normal: 'Anime Openings', impostor: 'K-Pop' },
  { normal: 'Attack on Titan', impostor: 'Demon Slayer' },
  { normal: 'Death Note', impostor: 'Code Geass' },
  { normal: 'Jujutsu Kaisen', impostor: 'Bleach' },
  { normal: 'Hunter x Hunter', impostor: 'Yu Yu Hakusho' },
  { normal: 'My Hero Academia', impostor: 'Black Clover' },
  { normal: 'Evangelion', impostor: 'Gundam' },
  { normal: 'Spy x Family', impostor: 'Kaguya-sama' },
  { normal: 'Chainsaw Man', impostor: 'Tokyo Ghoul' },
  { normal: 'Cowboy Bebop', impostor: 'Samurai Champloo' },
  { normal: 'JoJo\'s Bizarre Adventure', impostor: 'Fist of the North Star' },
  { normal: 'Dragon Ball Z', impostor: 'Naruto Shippuden' },
  { normal: 'Solo Leveling', impostor: 'Tower of God' },
  { normal: 'Fullmetal Alchemist', impostor: 'Soul Eater' },
  { normal: 'One Punch Man', impostor: 'Mob Psycho 100' },
  { normal: 'Vinland Saga', impostor: 'Berserk' },

  // --- FILMS / SÉRIES ---
  { normal: 'Films Studio Ghibli', impostor: 'Films Disney' },
  { normal: 'Marvel', impostor: 'DC Comics' },
  { normal: 'Star Wars', impostor: 'Star Trek' },
  { normal: 'Harry Potter', impostor: 'Le Seigneur des Anneaux' },
  { normal: 'Breaking Bad', impostor: 'Narcos' },
  { normal: 'Stranger Things', impostor: 'Dark' },
  { normal: 'The Office', impostor: 'Parks and Recreation' },
  { normal: 'Game of Thrones', impostor: 'Vikings' },
  { normal: 'Fast & Furious', impostor: 'Need for Speed' },
  { normal: 'Matrix', impostor: 'Inception' },
  { normal: 'Squid Game', impostor: 'Alice in Borderland' },
  { normal: 'La Casa de Papel', impostor: 'Prison Break' },
  { normal: 'Peaky Blinders', impostor: 'Boardwalk Empire' },
  { normal: 'Rick et Morty', impostor: 'South Park' },

  // --- CULTURE INTERNET / MEMES ---
  { normal: 'Memes internet classiques (2010-2018)', impostor: 'Memes TikTok (2020+)' },
  { normal: 'Twitch / Streaming culture', impostor: 'YouTube culture' },
  { normal: 'Emojis / langage internet', impostor: 'Argot IRL / verlan' },
  { normal: 'Reddit', impostor: 'Twitter/X' },
  { normal: 'Discord', impostor: 'TeamSpeak' },
  { normal: 'Shitposting', impostor: 'Copypasta' },
  { normal: 'MLG / Montage parody', impostor: 'YTP (YouTube Poop)' },
  { normal: 'Vine', impostor: 'TikTok' },
  { normal: 'Rickroll / troll classique', impostor: 'Jumpscare' },
  { normal: 'Skibidi Toilet', impostor: 'Huggy Wuggy / Poppy Playtime' },
  { normal: 'Mr Beast', impostor: 'PewDiePie' },
  { normal: 'Minecraft YouTubers', impostor: 'Roblox YouTubers' },
  { normal: 'Creepypasta', impostor: 'SCP Foundation' },
  { normal: 'Twitch Emotes (Kappa, PogChamp)', impostor: 'Emojis classiques' },
  { normal: 'Speed / IShowSpeed', impostor: 'KSI' },
  { normal: 'Adin Ross', impostor: 'Kai Cenat' },

  // --- MUSIQUE GENRES ---
  { normal: 'Musique lo-fi / chill beats', impostor: 'Vaporwave / Synthwave' },
  { normal: 'Metal / Rock classique', impostor: 'Punk Rock' },
  { normal: 'Musique de film épique (Hans Zimmer)', impostor: 'Musique de jeu vidéo épique' },
  { normal: 'Techno', impostor: 'House' },
  { normal: 'Drum & Bass', impostor: 'Dubstep' },
  { normal: 'Reggaeton', impostor: 'Dancehall' },
  { normal: 'Pop 2000s', impostor: 'Pop 2010s' },
  { normal: 'Grunge (Nirvana)', impostor: 'Britpop (Oasis)' },
  { normal: 'Jazz', impostor: 'Blues' },
  { normal: 'Reggae', impostor: 'Ska' },
  { normal: 'Musique classique', impostor: 'Musique de film' },
  { normal: 'EDM / Festival', impostor: 'Trance' },
  { normal: 'Soul / Motown', impostor: 'Funk' },
  { normal: 'Country', impostor: 'Folk' },
  { normal: 'Disco', impostor: 'Funk' },
  { normal: 'Hardstyle', impostor: 'Hardcore / Gabber' },
  { normal: 'Amapiano', impostor: 'Afrobeats' },
  { normal: 'Bossa Nova', impostor: 'Jazz' },

  // --- SPORT ---
  { normal: 'Football (soccer)', impostor: 'Futsal' },
  { normal: 'NBA / Basketball', impostor: 'Streetball' },
  { normal: 'MMA / UFC', impostor: 'Boxe' },
  { normal: 'F1', impostor: 'MotoGP' },
  { normal: 'Messi', impostor: 'Ronaldo' },
  { normal: 'LeBron James', impostor: 'Michael Jordan' },
  { normal: 'PSG', impostor: 'OM' },
  { normal: 'Real Madrid', impostor: 'Barcelone' },
  { normal: 'WWE / Catch', impostor: 'UFC / MMA' },
  { normal: 'Skateboard', impostor: 'BMX' },
  { normal: 'Tennis', impostor: 'Badminton' },

  // --- FOOD / LIFESTYLE ---
  { normal: 'McDonald\'s', impostor: 'Burger King' },
  { normal: 'Sushi', impostor: 'Ramen' },
  { normal: 'Pizza', impostor: 'Kebab' },
  { normal: 'Coca-Cola', impostor: 'Pepsi' },
  { normal: 'Nike', impostor: 'Adidas' },
  { normal: 'Supreme', impostor: 'Palace' },
  { normal: 'Jordan (sneakers)', impostor: 'Yeezy' },
  { normal: 'Starbucks', impostor: 'Dunkin\' Donuts' },
  { normal: 'iPhone', impostor: 'Samsung Galaxy' },
  { normal: 'Netflix', impostor: 'Disney+' },
  { normal: 'Spotify', impostor: 'Apple Music' },
  { normal: 'Uber', impostor: 'Bolt' },
  { normal: 'Instagram', impostor: 'Snapchat' },
  { normal: 'WhatsApp', impostor: 'Telegram' },

  // --- RANDOM CULTURE ---
  { normal: 'Elon Musk', impostor: 'Jeff Bezos' },
  { normal: 'Tesla', impostor: 'BMW' },
  { normal: 'Space X', impostor: 'NASA' },
  { normal: 'Chat (animal)', impostor: 'Chien (animal)' },
  { normal: 'Été', impostor: 'Printemps' },
  { normal: 'Noël', impostor: 'Halloween' },
  { normal: 'Paris', impostor: 'Londres' },
  { normal: 'Japon', impostor: 'Corée du Sud' },
  { normal: 'New York', impostor: 'Los Angeles' },
  { normal: 'Zombie apocalypse', impostor: 'Alien invasion' },
  { normal: 'Pirates', impostor: 'Ninjas' },
  { normal: 'Années 80', impostor: 'Années 90' },
  { normal: 'Années 2000', impostor: 'Années 2010' },
  { normal: 'Harry Potter (Gryffondor)', impostor: 'Harry Potter (Serpentard)' },
];

const lobbies = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function pickThemePairFrom(themes, usedIndices) {
  const available = themes.map((_, i) => i).filter(i => !usedIndices.includes(i));
  if (available.length === 0) {
    usedIndices.length = 0;
    return themes[Math.floor(Math.random() * themes.length)];
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  usedIndices.push(idx);
  return themes[idx];
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
      impostorIds: [],
      submissions: new Map(),
      votes: new Map(),
      usedThemeIndices: [],
      doubleImpostor: false,
      misterWhite: false,
      customThemes: [],
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
    lobby.doubleImpostor = settings?.doubleImpostor || false;
    lobby.misterWhite = settings?.misterWhite || false;
    lobby.customThemes = settings?.customThemes || [];
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

  const themes = lobby.customThemes.length > 0 ? lobby.customThemes : THEME_PAIRS;
  const pair = pickThemePairFrom(themes, lobby.usedThemeIndices);
  lobby.themePair = pair;

  const numImpostors = (lobby.doubleImpostor && lobby.players.length >= 6) ? 2 : 1;

  const indices = lobby.players.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const impostorIndices = indices.slice(0, numImpostors);
  lobby.impostorIds = impostorIndices.map(i => lobby.players[i].id);

  const shuffled = [...lobby.players].sort(() => Math.random() - 0.5);
  lobby.players = shuffled;

  lobby.players.forEach(player => {
    const isImpostor = lobby.impostorIds.includes(player.id);
    let theme;
    if (isImpostor && lobby.misterWhite) {
      theme = '???';
    } else if (isImpostor) {
      theme = pair.impostor;
    } else {
      theme = pair.normal;
    }
    io.to(player.id).emit('round-start', {
      round: lobby.round,
      totalRounds: lobby.totalRounds,
      theme,
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

  const impostorIds = lobby.impostorIds;
  const eliminatedIsImpostor = impostorIds.includes(eliminated);

  if (eliminatedIsImpostor) {
    lobby.players.forEach(p => {
      if (!impostorIds.includes(p.id)) p.score += 1;
    });
  } else {
    impostorIds.forEach(impId => {
      const impostor = lobby.players.find(p => p.id === impId);
      if (impostor) impostor.score += 2;
    });
  }

  const voteDetails = [];
  for (const [voterId, votedId] of lobby.votes) {
    const voter = lobby.players.find(p => p.id === voterId);
    const voted = lobby.players.find(p => p.id === votedId);
    if (voter && voted) voteDetails.push({ voter: voter.name, voted: voted.name });
  }

  const impostorNames = impostorIds.map(id => lobby.players.find(p => p.id === id)?.name).filter(Boolean);

  lobby.state = 'results';
  io.to(lobby.code).emit('round-results', {
    impostorNames,
    impostorFound: eliminatedIsImpostor,
    eliminatedName: lobby.players.find(p => p.id === eliminated)?.name,
    themePair: lobby.themePair,
    misterWhite: lobby.misterWhite,
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
