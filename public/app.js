const socket = io();

let myId = null;
let lobbyCode = null;
let isHost = false;
let myName = null;
let currentPlayers = [];
let hasVoted = false;
let customThemes = [];

socket.on('connect', () => { myId = socket.id; });

// --- NAVIGATION ---
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

document.querySelectorAll('.btn-back').forEach(btn => {
  btn.addEventListener('click', () => showScreen(btn.dataset.back));
});

// --- HOME ---
document.getElementById('btn-create').addEventListener('click', () => showScreen('create'));
document.getElementById('btn-join').addEventListener('click', () => showScreen('join'));

// --- CREATE LOBBY ---
document.getElementById('btn-do-create').addEventListener('click', () => {
  const name = document.getElementById('create-name').value.trim();
  if (!name) return showError('create-error', 'Entre un pseudo');

  myName = name;
  socket.emit('create-lobby', name, (res) => {
    if (res.success) {
      lobbyCode = res.code;
      isHost = true;
      customThemes = [];
      renderCustomThemes();
      updateLobbyUI(res.lobby);
      showScreen('lobby');
    } else {
      showError('create-error', res.error);
    }
  });
});

// --- JOIN LOBBY ---
document.getElementById('btn-do-join').addEventListener('click', () => {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim().toUpperCase();
  if (!name) return showError('join-error', 'Entre un pseudo');
  if (!code || code.length < 5) return showError('join-error', 'Code invalide');

  myName = name;
  socket.emit('join-lobby', code, name, (res) => {
    if (res.success) {
      lobbyCode = code;
      isHost = false;
      updateLobbyUI(res.lobby);
      showScreen('lobby');
    } else {
      showError('join-error', res.error);
    }
  });
});

// --- COPY CODE ---
document.getElementById('btn-copy-code').addEventListener('click', () => {
  navigator.clipboard.writeText(lobbyCode).then(() => toast('Code copié !'));
});

// --- MAX PLAYERS UPDATE ---
document.getElementById('max-players-select').addEventListener('change', () => {
  if (lobbyCode) {
    const maxPlayers = parseInt(document.getElementById('max-players-select').value);
    socket.emit('update-settings', lobbyCode, { maxPlayers });
  }
});

// --- TOGGLE CUSTOM THEMES ---
document.getElementById('toggle-custom-themes').addEventListener('change', (e) => {
  document.getElementById('custom-themes-section').style.display = e.target.checked ? 'block' : 'none';
});

// --- CUSTOM THEMES ---
document.getElementById('btn-add-theme').addEventListener('click', addCustomTheme);
document.getElementById('custom-theme-impostor').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addCustomTheme();
});

function addCustomTheme() {
  const normalInput = document.getElementById('custom-theme-normal');
  const impostorInput = document.getElementById('custom-theme-impostor');
  const normal = normalInput.value.trim();
  const impostor = impostorInput.value.trim();
  if (!normal || !impostor) return;

  customThemes.push({ normal, impostor });
  normalInput.value = '';
  impostorInput.value = '';
  normalInput.focus();
  renderCustomThemes();
}

function renderCustomThemes() {
  const list = document.getElementById('custom-themes-list');
  list.innerHTML = '';
  customThemes.forEach((t, i) => {
    const div = document.createElement('div');
    div.className = 'custom-theme-item';
    div.innerHTML = `
      <span class="themes-text"><strong>${esc(t.normal)}</strong> vs <strong>${esc(t.impostor)}</strong></span>
      <button class="btn-remove-theme" data-index="${i}">✕</button>
    `;
    div.querySelector('.btn-remove-theme').addEventListener('click', () => {
      customThemes.splice(i, 1);
      renderCustomThemes();
    });
    list.appendChild(div);
  });

  const info = document.getElementById('custom-themes-info');
  info.textContent = customThemes.length > 0
    ? `${customThemes.length} thème(s) personnalisé(s) — seuls ceux-ci seront utilisés`
    : 'Si vide, les thèmes par défaut seront utilisés';
}

// --- START GAME ---
document.getElementById('btn-start-game').addEventListener('click', () => {
  const rounds = parseInt(document.getElementById('rounds-select').value);
  const maxPlayers = parseInt(document.getElementById('max-players-select').value);
  const numImpostors = parseInt(document.getElementById('impostors-select').value);
  const misterWhite = document.getElementById('toggle-mister-white').checked;
  const useCustomThemes = document.getElementById('toggle-custom-themes').checked;
  socket.emit('start-game', lobbyCode, {
    rounds,
    maxPlayers,
    numImpostors,
    misterWhite,
    customThemes: useCustomThemes ? customThemes : [],
  }, (res) => {
    if (!res.success) showError('start-error', res.error || 'Erreur');
  });
});

// --- SUBMIT LINK ---
document.getElementById('btn-submit-link').addEventListener('click', () => {
  const link = document.getElementById('music-link').value.trim();
  if (!link) return;
  socket.emit('submit-link', lobbyCode, link, (res) => {
    if (res.success) {
      document.getElementById('music-link').value = '';
    }
  });
});

// --- ENTER KEY SUPPORT ---
document.getElementById('create-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-do-create').click();
});
document.getElementById('join-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('join-code').focus();
});
document.getElementById('join-code').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-do-join').click();
});
document.getElementById('music-link').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-submit-link').click();
});

// --- NEXT ROUND ---
document.getElementById('btn-next-round').addEventListener('click', () => {
  socket.emit('next-round', lobbyCode);
});

// --- RESTART ---
document.getElementById('btn-restart').addEventListener('click', () => {
  socket.emit('restart-game', lobbyCode);
});

// =====================
// SOCKET EVENTS
// =====================

socket.on('lobby-updated', (lobby) => {
  updateLobbyUI(lobby);
});

socket.on('player-left', (data) => {
  updateLobbyUI(data.lobby);
  isHost = data.hostId === myId;
});

socket.on('round-start', (data) => {
  currentPlayers = data.players;
  showScreen('game');

  document.getElementById('game-round').textContent = `Manche ${data.round}/${data.totalRounds}`;
  document.getElementById('submissions-list').innerHTML = '';

  const themeEl = document.getElementById('my-theme');
  const themeBox = document.getElementById('theme-reveal');
  document.getElementById('impostor-badge').style.display = 'none';
  themeBox.style.borderColor = 'var(--border)';

  if (data.theme === '???') {
    themeEl.textContent = '???';
    themeEl.className = 'theme-value mister-white-theme';
  } else {
    themeEl.textContent = data.theme;
    themeEl.className = 'theme-value';
  }

  updateTurnUI(data.currentTurn, data.currentPlayerName);
});

socket.on('link-submitted', (data) => {
  const list = document.getElementById('submissions-list');
  const item = createSubmissionItem(data.playerName, data.link, data.turnIndex);
  list.appendChild(item);
});

socket.on('next-turn', (data) => {
  updateTurnUI(data.currentTurn, data.playerName);
});

socket.on('phase-changed', (data) => {
  if (data.state === 'voting') {
    showVoteScreen(data.lobby);
  }
});

socket.on('vote-cast', (data) => {
  document.getElementById('vote-status').textContent =
    `${data.voterCount}/${data.total} votes`;
});

socket.on('round-results', (data) => {
  showResults(data);
});

socket.on('game-finished', (data) => {
  showFinished(data);
});

socket.on('back-to-lobby', () => {
  showScreen('lobby');
});

// =====================
// UI HELPERS
// =====================

function updateLobbyUI(lobby) {
  document.getElementById('lobby-code').textContent = lobby.code;

  const list = document.getElementById('lobby-players');
  list.innerHTML = '';
  lobby.players.forEach((p, i) => {
    const div = document.createElement('div');
    div.className = 'player-item';
    div.innerHTML = `
      <div class="player-avatar avatar-${i % 10}">${p.name[0].toUpperCase()}</div>
      <span class="player-name">${esc(p.name)}</span>
      ${p.id === lobby.hostId ? '<span class="player-host-badge">HÔTE</span>' : ''}
    `;
    list.appendChild(div);
  });

  isHost = lobby.hostId === myId;
  document.getElementById('lobby-host-controls').style.display = isHost ? 'block' : 'none';
  document.getElementById('lobby-waiting').style.display = isHost ? 'none' : 'block';
}

function updateTurnUI(turnIndex, playerName) {
  const isMyTurn = currentPlayers[turnIndex]?.id === myId;
  document.getElementById('game-turn').textContent = `Tour ${turnIndex + 1}/${currentPlayers.length}`;

  document.getElementById('submit-section').style.display = isMyTurn ? 'block' : 'none';
  document.getElementById('waiting-turn').style.display = isMyTurn ? 'none' : 'block';
  document.getElementById('current-player-name').textContent = playerName;

  if (isMyTurn) {
    document.getElementById('music-link').focus();
  }
}

function createSubmissionItem(playerName, link, index) {
  const div = document.createElement('div');
  div.className = 'submission-item';

  const ytId = extractYouTubeId(link);
  div.innerHTML = `
    <div class="player-avatar avatar-${index % 10}" style="width:28px;height:28px;font-size:0.75rem;">${playerName[0].toUpperCase()}</div>
    <span class="player-name">${esc(playerName)}</span>
    <a href="${esc(link)}" target="_blank" rel="noopener">🎵 Écouter</a>
  `;

  if (ytId) {
    const iframe = document.createElement('iframe');
    iframe.className = 'yt-embed';
    iframe.src = `https://www.youtube.com/embed/${ytId}`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope';
    iframe.allowFullscreen = true;
    const wrapper = document.createElement('div');
    wrapper.appendChild(div);
    wrapper.appendChild(iframe);
    return wrapper;
  }

  return div;
}

function showVoteScreen(lobby) {
  hasVoted = false;
  showScreen('vote');

  const recapEl = document.getElementById('all-submissions');
  recapEl.innerHTML = '';
  const subList = document.getElementById('submissions-list');
  recapEl.innerHTML = subList.innerHTML;

  const btnsEl = document.getElementById('vote-buttons');
  btnsEl.innerHTML = '';
  currentPlayers.forEach((p, i) => {
    if (p.id === myId) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-vote';
    btn.innerHTML = `<div class="player-avatar avatar-${i % 10}" style="width:28px;height:28px;font-size:0.75rem;display:inline-flex;vertical-align:middle;margin-right:8px;">${p.name[0].toUpperCase()}</div> ${esc(p.name)}`;
    btn.addEventListener('click', () => {
      if (hasVoted) return;
      socket.emit('vote', lobbyCode, p.id, (res) => {
        if (res.success) {
          hasVoted = true;
          btnsEl.querySelectorAll('.btn-vote').forEach(b => b.classList.remove('voted'));
          btn.classList.add('voted');
        } else {
          showError('vote-error', res.error);
        }
      });
    });
    btnsEl.appendChild(btn);
  });

  document.getElementById('vote-status').textContent = '0/' + currentPlayers.length + ' votes';
  document.getElementById('vote-error').textContent = '';
}

function showResults(data) {
  showScreen('results');

  const names = data.impostorNames;
  const isSingle = names.length === 1;
  const revealEl = document.getElementById('result-reveal');

  if (data.impostorFound) {
    revealEl.className = 'result-reveal found';
    revealEl.innerHTML = `<h3>✅ Imposteur démasqué !</h3><p><strong>${esc(data.eliminatedName)}</strong> était ${isSingle ? "l'imposteur" : "un des imposteurs"}</p>`;
  } else {
    revealEl.className = 'result-reveal not-found';
    revealEl.innerHTML = `<h3>❌ ${isSingle ? "L'imposteur s'en sort" : "Les imposteurs s'en sortent"} !</h3><p><strong>${esc(data.eliminatedName)}</strong> a été éliminé mais ${isSingle ? "l'imposteur était" : "les imposteurs étaient"} <strong>${names.map(n => esc(n)).join(' & ')}</strong></p>`;
  }

  const modeInfo = document.getElementById('result-mode-info');
  if (data.misterWhite) {
    modeInfo.textContent = '👻 Mode Mister White — l\'imposteur n\'avait aucun thème';
  } else {
    modeInfo.textContent = '';
  }

  const themesHtml = `
    <h4>Thèmes de la manche</h4>
    <div class="theme-row">
      <span>Thème normal</span>
      <span>${esc(data.themePair.normal)}</span>
    </div>
    <div class="theme-row">
      <span>Thème imposteur</span>
      <span style="color:var(--accent)">${data.misterWhite ? '??? (aucun)' : esc(data.themePair.impostor)}</span>
    </div>
  `;
  document.getElementById('result-themes').innerHTML = themesHtml;

  const votesEl = document.getElementById('result-votes');
  votesEl.innerHTML = '<h4>Détail des votes</h4>' +
    data.votes.map(v => `<div class="vote-detail"><strong>${esc(v.voter)}</strong> a voté → <strong>${esc(v.voted)}</strong></div>`).join('');

  renderScores(document.getElementById('result-scores'), data.scores);

  const nextBtn = document.getElementById('btn-next-round');
  nextBtn.style.display = isHost ? 'block' : 'none';
  nextBtn.textContent = data.round >= data.totalRounds ? 'Voir les résultats finaux' : 'Manche suivante →';
}

function showFinished(data) {
  showScreen('finished');

  const sorted = [...data.players].sort((a, b) => b.score - a.score);
  renderScores(document.getElementById('final-scores'), sorted);

  const winner = sorted[0];
  document.getElementById('winner-announce').innerHTML =
    `🏆 <strong>${esc(winner.name)}</strong> remporte la partie avec ${winner.score} pts !`;

  document.getElementById('btn-restart').style.display = isHost ? 'block' : 'none';
}

function renderScores(container, players) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const rankClass = ['gold', 'silver', 'bronze'];
  container.innerHTML = '<h4>Scores</h4>' + sorted.map((p, i) => `
    <div class="score-row">
      <span class="rank ${rankClass[i] || ''}">#${i + 1}</span>
      <span class="name">${esc(p.name)}</span>
      <span class="score">${p.score} pts</span>
    </div>
  `).join('');
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function showError(elemId, msg) {
  const el = document.getElementById(elemId);
  el.textContent = msg;
  setTimeout(() => el.textContent = '', 4000);
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function esc(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
