let gameMode = '';
let playerTurn = 1;
let choices = {};
let perks = { 1: [], 2: [] };
let tokens = { 1: 5, 2: 5 };
let wildUsed = { 1: false, 2: false };
let lockedCards = { 1: {}, 2: {} };
let cardPlayCounts = { 1: {}, 2: {} };
let gameHistory = [];
let consecutiveWins = { 1: 0, 2: 0 };
let playerEmojis = { 1: '🐼', 2: '🐼' };
let activePerks = { 1: null, 2: null }; // Track active perks for each player
let cpuEnabled = false;
let playerHistory = [];
let cpuHistory = [];
let cpuWeights = { 'ATTACK': 1, 'DEFEND': 1, 'SUBMIT': 1, 'TRAP': 1, 'WILD': 0.5 };

const GAME_MODES = {
  'Easy': { tokens: 14, intensity: 1 },    // 7 pieces of clothing
  'Medium': { tokens: 10, intensity: 1 },  // 5 pieces of clothing
  'Hard': { tokens: 6, intensity: 1 },     // 3 pieces of clothing
  'Extreme': { tokens: 6, intensity: 1 }   // 3 pieces of clothing
};

function showTutorial() {
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("tutorial-screen").classList.remove("hidden");
}

function hideTutorial() {
  document.getElementById("tutorial-screen").classList.add("hidden");
  document.getElementById("home-screen").classList.remove("hidden");
}

function startGame(mode) {
  gameMode = mode;
  const modeConfig = GAME_MODES[mode];
  
  // Store selected emojis
  const p1Selected = document.querySelector('#player1-emoji-options .emoji-circle.selected');
  const p2Selected = document.querySelector('#player2-emoji-options .emoji-circle.selected');
  playerEmojis[1] = p1Selected ? p1Selected.getAttribute('data-emoji') : '🐼';
  playerEmojis[2] = p2Selected ? p2Selected.getAttribute('data-emoji') : '🐼';

  // CPU toggle
  cpuEnabled = document.getElementById('cpu-toggle').checked;
  playerHistory = [];
  cpuHistory = [];
  cpuWeights = { 'ATTACK': 1, 'DEFEND': 1, 'SUBMIT': 1, 'TRAP': 1, 'WILD': 0.5 };

  // Reset game state
  tokens = { 1: modeConfig.tokens, 2: modeConfig.tokens };
  perks = { 1: [], 2: [] };
  wildUsed = { 1: false, 2: false };
  choices = {};
  playerTurn = 1;
  lockedCards = { 1: {}, 2: {} };
  cardPlayCounts = { 1: {}, 2: {} };
  gameHistory = [];
  consecutiveWins = { 1: 0, 2: 0 };

  // Update UI
  document.getElementById("mode").innerText = `Mode: ${gameMode}`;
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  updatePlayerUI();
  updateTurnIndicator();
}

function returnHome() {
  if (confirm("Are you sure you want to return to the home screen? All progress will be lost.")) {
    location.reload();
  }
}

function updateTurnIndicator() {
  const indicator = document.getElementById("turn-indicator");
  indicator.innerText = `Player ${playerTurn}'s Turn`;
  indicator.style.color = playerTurn === 1 ? '#ffd700' : '#ff6b6b';
}

function updatePlayerUI() {
  // Update token displays
  document.getElementById("player1-tokens").innerText = tokens[1];
  document.getElementById("player2-tokens").innerText = tokens[2];
  
  // Update perk displays with icons
  const perkIcons = {
    'Control': '🎮',
    'Reverse': '↩️',
    'Trap': '🪤'
  };
  
  const formatPerks = (perkList) => {
    if (perkList.length === 0) return "None";
    return perkList.map(perk => `${perkIcons[perk]} ${perk}`).join(", ");
  };
  
  document.getElementById("player1-perks").innerHTML = formatPerks(perks[1]);
  document.getElementById("player2-perks").innerHTML = formatPerks(perks[2]);

  // Update perk buttons
  updatePerkButtons(1);
  updatePerkButtons(2);

  // Disable Player 2's card grid if CPU is active and it's Player 2's turn
  const p2Grid = document.getElementById('player2-card-grid');
  if (cpuEnabled && playerTurn === 2) {
    p2Grid.classList.add('cpu-disabled');
  } else {
    p2Grid.classList.remove('cpu-disabled');
  }

  // Update last turn info
  const lastEntry = gameHistory[gameHistory.length - 1];
  if (lastEntry) {
    document.getElementById("player1-last-turn").style.display = '';
    document.getElementById("player2-last-turn").style.display = '';
    // Player 1's view
    document.getElementById("player1-last-turn").innerHTML =
      `<div style='font-size:1em;'><b>Your last turn:</b> ${lastEntry.p1 || 'N/A'}</div>` +
      `<div style='font-size:1em;'><b>Opponent's last turn:</b> ${lastEntry.p2 || 'N/A'}</div>`;
    // Player 2's view
    document.getElementById("player2-last-turn").innerHTML =
      `<div style='font-size:1em;'><b>Your last turn:</b> ${lastEntry.p2 || 'N/A'}</div>` +
      `<div style='font-size:1em;'><b>Opponent's last turn:</b> ${lastEntry.p1 || 'N/A'}</div>`;
  } else {
    document.getElementById("player1-last-turn").style.display = 'none';
    document.getElementById("player2-last-turn").style.display = 'none';
  }

  // Update locked cards
  updateLockedCards(1);
  updateLockedCards(2);

  // Handle wildcard visibility
  const p1Wildcard = document.querySelector("#player1 .wildcard");
  const p2Wildcard = document.querySelector("#player2 .wildcard");
  if (p1Wildcard) p1Wildcard.style.display = wildUsed[1] ? "none" : "inline-block";
  if (p2Wildcard) p2Wildcard.style.display = wildUsed[2] ? "none" : "inline-block";
}

function updatePerkButtons(player) {
  const perkButtons = document.getElementById(`player${player}-perk-buttons`);
  const perkIcons = {
    'Control': '🎮',
    'Reverse': '↩️',
    'Trap': '🪤'
  };
  
  // Clear existing buttons
  perkButtons.innerHTML = '';
  
  // Add buttons for each perk
  perks[player].forEach(perk => {
    const button = document.createElement('button');
    button.className = 'perk-button';
    button.innerHTML = `${perkIcons[perk]} ${perk}`;
    button.onclick = () => usePerk(player, perk);
    perkButtons.appendChild(button);
  });
}

function usePerk(player, perkType) {
  if (player !== playerTurn) {
    alert("You can only use perks on your turn!");
    return;
  }
  
  const opponent = player === 1 ? 2 : 1;
  let used = false;
  
  switch (perkType) {
    case 'Control':
      // Let player choose opponent's next card
      const cardOptions = ['ATTACK', 'DEFEND', 'SUBMIT', 'TRAP'];
      const forcedCard = prompt(`Choose which card Player ${opponent} must play next (ATTACK/DEFEND/SUBMIT/TRAP):`);
      if (forcedCard && cardOptions.includes(forcedCard.toUpperCase())) {
        activePerks[player] = {
          type: 'Control',
          forcedCard: forcedCard.toUpperCase(),
          target: opponent
        };
        used = true;
        alert(`Player ${opponent} will be forced to play ${forcedCard.toUpperCase()} next turn!`);
      }
      break;
      
    case 'Reverse':
      // Reverse the next punishment
      activePerks[player] = {
        type: 'Reverse',
        active: true
      };
      used = true;
      alert("The next punishment will be reversed!");
      break;
      
    case 'Trap':
      // Set a trap that activates on opponent's next move
      const trapOptions = ['ATTACK', 'DEFEND', 'SUBMIT', 'TRAP'];
      const trapCard = prompt(`Choose which card to trap (ATTACK/DEFEND/SUBMIT/TRAP):`);
      if (trapCard && trapOptions.includes(trapCard.toUpperCase())) {
        activePerks[player] = {
          type: 'Trap',
          trappedCard: trapCard.toUpperCase(),
          target: opponent
        };
        used = true;
        alert(`If Player ${opponent} plays ${trapCard.toUpperCase()}, they will lose an extra token!`);
      }
      break;
  }
  
  if (used) {
    perks[player] = perks[player].filter(p => p !== perkType);
    updatePlayerUI();
  }
}

function updateLockedCards(player) {
  const grid = document.querySelector(`#player${player}-card-grid`);
  const cards = grid.querySelectorAll('.card');
  
  cards.forEach(card => {
    const img = card.querySelector('img');
    if (!img) return;
    const cardType = img.alt.toUpperCase();
    if (lockedCards[player][cardType]) {
      card.classList.add('locked');
      img.onclick = null;
    } else {
      card.classList.remove('locked');
      img.onclick = () => selectCard(cardType);
    }
  });
}

function selectCard(card) {
  let cardType = card.toUpperCase();
  if (cardType === "WILDCARD") cardType = "WILD";
  if (cardType === "WILD" && wildUsed[playerTurn]) {
    alert("You've already used your wildcard!");
    return;
  }

  if (lockedCards[playerTurn][cardType]) {
    alert("This card is locked for 2 more rounds!");
    return;
  }

  // Only prompt for Wild if human is playing
  if (cardType === "WILD" && (!cpuEnabled || playerTurn === 1)) {
    if (!confirm("Are you sure you want to use your wildcard? This can only be used once per game!")) {
      return;
    }
  }

  choices[playerTurn] = cardType;
  if (playerTurn === 1) playerHistory.push(cardType);
  if (playerTurn === 2) cpuHistory.push(cardType);
  if (cardType === "WILD") wildUsed[playerTurn] = true;

  // Track how many times this card has been played
  if (!cardPlayCounts[playerTurn][cardType]) cardPlayCounts[playerTurn][cardType] = 0;
  cardPlayCounts[playerTurn][cardType]++;

  // Only lock the card after it has been played twice
  if (cardPlayCounts[playerTurn][cardType] === 2) {
    lockedCards[playerTurn][cardType] = 2;
  }

  if (playerTurn === 1) {
    playerTurn = 2;
    updateTurnIndicator();
    fadeSwitch(document.getElementById("player1"), () => {
      document.getElementById("player1").classList.add("hidden");
      document.getElementById("player2").classList.remove("hidden");
      updatePlayerUI();
      updateTurnIndicator();
      fadeIn(document.getElementById("player2"));
      if (cpuEnabled) setTimeout(cpuMove, 900);
    });
  } else {
    const p2Panel = document.getElementById("player2");
    if (p2Panel.classList.contains("hidden")) {
      showResult();
    } else {
      fadeSwitch(p2Panel, () => {
        p2Panel.classList.add("hidden");
        showResult();
      });
    }
  }
}

function showResult() {
  console.log('showResult called'); // Debug log
  const p1 = choices[1];
  const p2 = choices[2];

  // Check for Control perk
  if (activePerks[1]?.type === 'Control' && activePerks[1].target === 2) {
    choices[2] = activePerks[1].forcedCard;
    activePerks[1] = null;
  } else if (activePerks[2]?.type === 'Control' && activePerks[2].target === 1) {
    choices[1] = activePerks[2].forcedCard;
    activePerks[2] = null;
  }

  // Check for Trap perk
  if (activePerks[1]?.type === 'Trap' && activePerks[1].target === 2 && p2 === activePerks[1].trappedCard) {
    tokens[2] = Math.max(0, tokens[2] - 1);
    alert("Trap activated! Player 2 loses an extra token!");
    activePerks[1] = null;
  } else if (activePerks[2]?.type === 'Trap' && activePerks[2].target === 1 && p1 === activePerks[2].trappedCard) {
    tokens[1] = Math.max(0, tokens[1] - 1);
    alert("Trap activated! Player 1 loses an extra token!");
    activePerks[2] = null;
  }

  const result = evaluateMatchup(p1, p2, {
    perks,
    tokens,
    gameMode,
    consecutiveWins
  });

  // Check for Reverse perk
  if (activePerks[1]?.type === 'Reverse' && result.punishments[1].length > 0) {
    result.punishments[2] = result.punishments[1];
    result.punishments[1] = [];
    alert("Punishment reversed! Player 2 receives the punishment instead!");
    activePerks[1] = null;
  } else if (activePerks[2]?.type === 'Reverse' && result.punishments[2].length > 0) {
    result.punishments[1] = result.punishments[2];
    result.punishments[2] = [];
    alert("Punishment reversed! Player 1 receives the punishment instead!");
    activePerks[2] = null;
  }

  // Ensure punishments is always defined
  result.punishments = result.punishments || {1: [], 2: []};

  tokens = result.tokens;
  perks = result.perks;
  consecutiveWins = result.consecutiveWins;

  // Update locked cards countdown
  Object.keys(lockedCards).forEach(player => {
    Object.keys(lockedCards[player]).forEach(card => {
      if (lockedCards[player][card] > 0) {
        lockedCards[player][card]--;
        if (lockedCards[player][card] === 0) {
          delete lockedCards[player][card];
          cardPlayCounts[player][card] = 0;
        }
      }
    });
  });

  // Add to game history
  const historyEntry = {
    round: gameHistory.length + 1,
    p1: p1,
    p2: p2,
    result: result.instructions,
    tokens: { ...tokens },
    punishments: { ...result.punishments }
  };
  gameHistory.push(historyEntry);
  updateGameHistory();

  // Hide both player areas
  document.getElementById("player1").classList.add("hidden");
  document.getElementById("player2").classList.add("hidden");

  // Calculate clothing removal
  const initialTokens = GAME_MODES[gameMode].tokens;
  const p1ClothingLost = Math.floor((initialTokens - tokens[1]) / 2);
  const p2ClothingLost = Math.floor((initialTokens - tokens[2]) / 2);

  // Format punishments for display
  const formatPunishments = (punishments) => {
    if (!punishments || punishments.length === 0) return "No punishment";
    if (punishments.length === 2) return `${punishments[0]} OR ${punishments[1]}`;
    return punishments.join(", ");
  };

  // --- Gamified Results Page ---
  // 1. Round result header
  let winner = null;
  let loser = null;
  let roundHeader = '';
  if (result.instructions.includes('Player 1 wins')) {
    winner = 1; loser = 2;
    roundHeader = `🏆 Player 1 Wins!`;
  } else if (result.instructions.includes('Player 2 wins')) {
    winner = 2; loser = 1;
    roundHeader = `🏆 Player 2 Wins!`;
  } else if (result.instructions.includes('Both players must be punished')) {
    roundHeader = `⚠️ Both Players Punished!`;
  } else {
    roundHeader = `🤝 Stalemate!`;
  }
  document.getElementById("round-result-header").innerHTML = roundHeader;

  // 2. Player avatars (use chosen emoji)
  document.getElementById("player1-avatar").innerText = playerEmojis[1] || "🧑";
  document.getElementById("player2-avatar").innerText = playerEmojis[2] || "🧑";

  // 2.5. Show what each player played
  const tokenIcon = '<img src="images/token.png" class="token-icon" style="width:22px;vertical-align:middle;">';
  document.getElementById("player1-result-tokens").innerHTML = `<div style='font-size:0.95em;color:#aaa;margin-bottom:2px;'>Played: <b>${p1}</b></div>` +
    `Tokens: ${tokenIcon.repeat(tokens[1])} <span style='font-size:0.9em;opacity:0.7;'>(${tokens[1]})</span>`;
  document.getElementById("player2-result-tokens").innerHTML = `<div style='font-size:0.95em;color:#aaa;margin-bottom:2px;'>Played: <b>${p2}</b></div>` +
    `Tokens: ${tokenIcon.repeat(tokens[2])} <span style='font-size:0.9em;opacity:0.7;'>(${tokens[2]})</span>`;

  // 4. Perks (with icons)
  const perkIcons = {
    'Control': '🎮',
    'Reverse': '↩️',
    'Trap': '🪤'
  };
  const formatPerks = (perkList) => {
    if (!perkList || perkList.length === 0) return "<span style='color:#aaa'>None</span>";
    return perkList.map(perk => `${perkIcons[perk] || ''} ${perk}`).join(", ");
  };
  document.getElementById("player1-result-perks").innerHTML = `Perks: ${formatPerks(perks[1])}`;
  document.getElementById("player2-result-perks").innerHTML = `Perks: ${formatPerks(perks[2])}`;

  // 5. Punishments
  let punishmentChoiceHTML = "";
  let pendingPunishment = null;
  if (result.punishments[1].length > 0 || result.punishments[2].length > 0) {
    if (result.punishments[1].length > 0) {
      winner = 2;
      loser = 1;
      pendingPunishment = result.punishments[1];
    } else if (result.punishments[2].length > 0) {
      winner = 1;
      loser = 2;
      pendingPunishment = result.punishments[2];
    }
    if (pendingPunishment && pendingPunishment.length === 2) {
      punishmentChoiceHTML = `<div id='punishment-choice'><b>Player ${winner}, choose a punishment for Player ${loser}:</b><br>
        <button onclick='assignPunishment(${loser}, 0)'>${pendingPunishment[0]}</button>
        <button onclick='assignPunishment(${loser}, 1)'>${pendingPunishment[1]}</button>
      </div>`;
    }
  }
  document.getElementById("punishment-choice-area").innerHTML = punishmentChoiceHTML;

  // 6. Punishment choice area
  let p1Punishment = formatPunishments(result.punishments[1]);
  let p2Punishment = formatPunishments(result.punishments[2]);
  if (punishmentChoiceHTML && loser === 1) {
    p1Punishment = "<span style='color:#aaa;font-style:italic;'>Choose...</span>";
  }
  if (punishmentChoiceHTML && loser === 2) {
    p2Punishment = "<span style='color:#aaa;font-style:italic;'>Choose...</span>";
  }
  document.getElementById("player1-result-punishment").innerHTML = `Punishment: <span>${p1Punishment}</span>`;
  document.getElementById("player2-result-punishment").innerHTML = `Punishment: <span>${p2Punishment}</span>`;

  // 7. Highlight winner/loser panel
  document.getElementById("player1-result-panel").style.borderColor = (winner === 1) ? '#FFD700' : (loser === 1 ? '#ff6b6b' : '#FFD700');
  document.getElementById("player2-result-panel").style.borderColor = (winner === 2) ? '#FFD700' : (loser === 2 ? '#ff6b6b' : '#FFD700');

  // 8. Show result screen
  const resultScreen = document.getElementById("round-result");
  resultScreen.classList.remove("hidden");
  resultScreen.style.display = "block";
  fadeIn(resultScreen);

  // Check for game over
  if (tokens[1] === 0 || tokens[2] === 0) {
    const winner = tokens[1] === 0 ? 2 : 1;
    const loser = tokens[1] === 0 ? 1 : 2;
    const totalClothingLost = Math.floor(initialTokens / 2);
    setTimeout(() => {
      alert(`Game Over! Player ${winner} wins!\nPlayer ${loser} has lost all ${totalClothingLost} items of clothing!\nFinal punishment: ${formatPunishments(result.punishments[loser])}`);
      returnHome();
    }, 1000);
  }
}

// Assign punishment function for winner to choose
function assignPunishment(loser, idx) {
  // Find the last result in gameHistory
  const lastResult = gameHistory[gameHistory.length - 1];
  // Assign the chosen punishment
  const chosen = lastResult.punishments[loser][idx];
  lastResult.punishments[loser] = [chosen];
  updateGameHistory();
  // Update the result display
  document.getElementById("punishment-choice-area").innerHTML = `<b>Punishment chosen:</b> ${chosen}`;
  document.getElementById(`player${loser}-result-punishment`).innerHTML = `Punishment: <span>${chosen}</span>`;
}

function updateGameHistory() {
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = gameHistory.map(entry => `
    <div class="history-item">
      Round ${entry.round}: ${entry.p1} vs ${entry.p2}
      <br>
      ${entry.result}
      <br>
      Tokens: P1(${entry.tokens[1]}) P2(${entry.tokens[2]})
      <br>
      P1 Punishment: ${(entry.punishments[1] || []).join(", ") || "None"}
      <br>
      P2 Punishment: ${(entry.punishments[2] || []).join(", ") || "None"}
    </div>
  `).join('');
  historyList.scrollTop = historyList.scrollHeight;
}

function nextRound() {
  playerTurn = 1;
  choices = {};
  const resultScreen = document.getElementById("round-result");
  resultScreen.classList.add("hidden");
  resultScreen.style.display = "none";
  document.getElementById("player1").classList.remove("hidden");
  document.getElementById("player2").classList.add("hidden");
  updatePlayerUI();
  updateTurnIndicator();
  fadeIn(document.getElementById("player1"));
}

function fadeIn(el) {
  el.classList.remove("hidden", "fade");
  el.offsetHeight; // Force reflow
  el.classList.add("fade-in");
}

function fadeSwitch(hideEl, callback) {
  hideEl.classList.remove("fade-in");
  hideEl.classList.add("fade");
  setTimeout(() => {
    hideEl.classList.add("hidden");
    hideEl.classList.remove("fade");
    callback();
  }, 400);
}

// Add emoji selection logic for home screen
window.addEventListener('DOMContentLoaded', () => {
  // Default selection
  document.querySelectorAll('#player1-emoji-options .emoji-circle')[0].classList.add('selected');
  document.querySelectorAll('#player2-emoji-options .emoji-circle')[0].classList.add('selected');

  document.querySelectorAll('.emoji-circle').forEach(el => {
    el.addEventListener('click', function() {
      const player = this.getAttribute('data-player');
      // Remove selected from all for this player
      document.querySelectorAll(`#player${player}-emoji-options .emoji-circle`).forEach(e => e.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
});

function cpuMove() {
  console.log('[CPU] cpuMove called.');
  // If forced by Control perk, obey
  if (activePerks[1]?.type === 'Control' && activePerks[1].target === 2) {
    console.log('[CPU] Forced by Control perk to play', activePerks[1].forcedCard);
    selectCard(activePerks[1].forcedCard);
    return;
  }
  // Get available cards
  const available = ['ATTACK', 'DEFEND', 'SUBMIT', 'TRAP', 'WILD'].filter(card => {
    if (lockedCards[2][card]) return false;
    if (card === 'WILD' && wildUsed[2]) return false;
    return true;
  });
  console.log('[CPU] Available cards:', available);
  if (available.length === 0) {
    alert('CPU has no valid moves! Forcing result.');
    showResult();
    return;
  }
  // Predict player move
  let prediction = predictPlayerMove();
  console.log('[CPU] Predicts player will play:', prediction);
  // Try to counter prediction
  let counter = getCounterCard(prediction, available);
  console.log('[CPU] Counter card selected:', counter);
  // If behind by 2+ tokens, consider using Wild
  if (tokens[2] + 2 <= tokens[1] && available.includes('WILD')) counter = 'WILD';
  // Use a perk if available and situation is good
  if (perks[2].length > 0) {
    // Use Reverse if about to be punished
    if (tokens[2] < tokens[1] && perks[2].includes('Reverse')) {
      console.log('[CPU] Using Reverse perk.');
      usePerk(2, 'Reverse');
      return setTimeout(cpuMove, 500);
    }
    // Use Trap if player repeats cards
    if (perks[2].includes('Trap') && playerHistory.length > 2 && playerHistory[playerHistory.length-1] === playerHistory[playerHistory.length-2]) {
      console.log('[CPU] Using Trap perk.');
      usePerk(2, 'Trap');
      return setTimeout(cpuMove, 500);
    }
    // Use Control if player is close to winning
    if (perks[2].includes('Control') && tokens[1] === 1) {
      console.log('[CPU] Using Control perk.');
      usePerk(2, 'Control');
      return setTimeout(cpuMove, 500);
    }
  }
  // Sometimes randomize to avoid being predictable
  if (Math.random() < 0.18) {
    counter = available[Math.floor(Math.random()*available.length)];
    console.log('[CPU] Randomizing move.');
  }
  selectCard(counter);
}

function predictPlayerMove() {
  // Use weighted history: more recent moves count more
  let weights = { 'ATTACK': 1, 'DEFEND': 1, 'SUBMIT': 1, 'TRAP': 1, 'WILD': 0.5 };
  for (let i = Math.max(0, playerHistory.length-3); i < playerHistory.length; i++) {
    let card = playerHistory[i];
    if (card) weights[card] = (weights[card] || 1) + (i === playerHistory.length-1 ? 2 : 1);
  }
  // Adapt weights if player repeats or avoids cards
  for (let card in weights) {
    let count = playerHistory.filter(c => c === card).length;
    if (count > 2) weights[card] += 1;
    if (count === 0) weights[card] -= 0.5;
  }
  // Find most likely
  let likely = Object.keys(weights).reduce((a,b) => weights[a] > weights[b] ? a : b);
  return likely;
}

function getCounterCard(card, available) {
  // Counter logic: try to pick a card that beats the predicted card
  const strongAgainst = {
    'ATTACK': ['DEFEND'],
    'DEFEND': ['SUBMIT'],
    'SUBMIT': ['ATTACK'],
    'TRAP': ['DEFEND'],
    'WILD': ['DEFEND']
  };
  for (let c of available) {
    if (strongAgainst[c] && strongAgainst[c].includes(card)) return c;
  }
  // Otherwise, pick a random available card
  return available[Math.floor(Math.random()*available.length)];
}
