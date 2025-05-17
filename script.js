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
let customPunishments = [];
let isEscalatingMode = false;
let currentMode = '';
let startingTokens = { 1: 5, 2: 5 }; // Track starting tokens for escalating mode

const GAME_MODES = {
  'Easy': { intensity: 1 },
  'Medium': { intensity: 1 },
  'Hard': { intensity: 1 },
  'Extreme': { intensity: 1 },
  'escalating': { intensity: 1 }
};

function showTutorial() {
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("tutorial-screen").classList.remove("hidden");
}

function hideTutorial() {
  document.getElementById("tutorial-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.add("hidden");
  document.getElementById("home-screen").classList.remove("hidden");
}

function showHomeScreen() {
  // ... existing code ...
  const modeButtons = document.createElement('div');
  modeButtons.className = 'mode-buttons';
  modeButtons.innerHTML = `
    <button onclick="startGame('easy')">Easy Mode</button>
    <button onclick="startGame('hard')">Hard Mode</button>
    <button onclick="startGame('extreme')">Extreme Mode</button>
    <button onclick="startGame('escalating')">Escalating Mode</button>
  `;
  // ... existing code ...
}

function startGame(mode) {
  if (mode === 'escalating') {
    currentMode = 'easy';
    isEscalatingMode = true;
  } else {
    currentMode = mode;
    isEscalatingMode = false;
  }
  gameMode = mode;
  document.getElementById("mode").innerText = `Mode: ${gameMode}`;
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

  // Get clothing values from dropdowns (tokens = clothing)
  const p1Clothing = parseInt(document.getElementById('player1-clothing')?.value || '3', 10);
  const p2Clothing = parseInt(document.getElementById('player2-clothing')?.value || '3', 10);

  // Reset game state
  tokens = { 1: p1Clothing, 2: p2Clothing };
  startingTokens = { 1: p1Clothing, 2: p2Clothing }; // Store starting tokens for escalating mode
  perks = { 1: [], 2: [] };
  wildUsed = { 1: false, 2: false };
  choices = {};
  playerTurn = 1;
  lockedCards = { 1: {}, 2: {} };
  cardPlayCounts = { 1: {}, 2: {} };
  gameHistory = [];
  consecutiveWins = { 1: 0, 2: 0 };

  // Hide all main screens except game
  document.getElementById("home-screen").classList.add("hidden");
  document.getElementById("tutorial-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  updatePlayerUI();
  updateTurnIndicator();
}

function returnHome() {
  if (confirm("Are you sure you want to return to the home screen? All progress will be lost.")) {
    // Reset all game state variables
    gameMode = '';
    playerTurn = 1;
    choices = {};
    perks = { 1: [], 2: [] };
    tokens = { 1: 5, 2: 5 };
    wildUsed = { 1: false, 2: false };
    lockedCards = { 1: {}, 2: {} };
    cardPlayCounts = { 1: {}, 2: {} };
    gameHistory = [];
    consecutiveWins = { 1: 0, 2: 0 };
    playerEmojis = { 1: '🐼', 2: '🐼' };
    activePerks = { 1: null, 2: null };
    cpuEnabled = false;
    playerHistory = [];
    cpuHistory = [];
    cpuWeights = { 'ATTACK': 1, 'DEFEND': 1, 'SUBMIT': 1, 'TRAP': 1, 'WILD': 0.5 };

    // Hide all main screens except home
    document.getElementById("tutorial-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("home-screen").classList.remove("hidden");

    // Reset mode label
    document.getElementById("mode").innerText = "Mode:";
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
  
  // Show clickable perk buttons under Perks: label
  const updatePerkBar = (player) => {
    const perkBar = document.getElementById(`player${player}-perks`);
    const container = document.createElement('span');
    if (perks[player].length === 0) {
      perkBar.innerHTML = '<span style="color:#aaa;font-style:italic;">None</span>';
      return;
    }
    perks[player].forEach(perk => {
      const button = document.createElement('button');
      button.className = 'perk-button';
      button.innerHTML = `${perkIcons[perk]} ${perk}`;
      button.onclick = () => usePerk(player, perk);
      if (player !== playerTurn) button.disabled = true;
      container.appendChild(button);
    });
    perkBar.innerHTML = '';
    perkBar.appendChild(container);
  };
  updatePerkBar(1);
  updatePerkBar(2);

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

  // Control Perk: If the current player is being controlled, only enable the forced card
  let controlActive = false;
  let forcedCard = null;
  let controlledPlayer = null;
  if (activePerks[1]?.type === 'Control' && activePerks[1].target === 1) {
    controlActive = true;
    forcedCard = activePerks[1].forcedCard;
    controlledPlayer = 1;
  } else if (activePerks[2]?.type === 'Control' && activePerks[2].target === 2) {
    controlActive = true;
    forcedCard = activePerks[2].forcedCard;
    controlledPlayer = 2;
  }
  if (controlActive) {
    const grid = document.querySelector(`#player${controlledPlayer}-card-grid`);
    const cards = grid.querySelectorAll('.card');
    cards.forEach(card => {
      const img = card.querySelector('img');
      if (!img) return;
      const cardType = img.alt.toUpperCase();
      if (cardType === forcedCard && !lockedCards[controlledPlayer][cardType]) {
        card.classList.remove('locked');
        img.onclick = () => selectCard(cardType);
      } else {
        card.classList.add('locked');
        img.onclick = null;
      }
    });
    // If the controlled player has already picked, override their choice
    if (choices[controlledPlayer] && choices[controlledPlayer] !== forcedCard) {
      choices[controlledPlayer] = forcedCard;
      alert(`Player ${controlledPlayer}'s card was changed to ${forcedCard} by the Control perk!`);
    }
  } else {
    updateLockedCards(1);
    updateLockedCards(2);
  }

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
        // If opponent has already chosen, override their choice immediately
        if (choices[opponent]) {
          choices[opponent] = forcedCard.toUpperCase();
          alert(`Player ${opponent}'s card was changed to ${forcedCard.toUpperCase()} by the Control perk!`);
          updatePlayerUI();
        } else {
          alert(`Player ${opponent} will be forced to play ${forcedCard.toUpperCase()} next turn!`);
        }
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

  // Control Perk: Only allow forced card for the controlled player, regardless of turn
  let controlled = null;
  let forcedCard = null;
  if (activePerks[1]?.type === 'Control' && activePerks[1].target === 1) {
    controlled = 1;
    forcedCard = activePerks[1].forcedCard;
  } else if (activePerks[2]?.type === 'Control' && activePerks[2].target === 2) {
    controlled = 2;
    forcedCard = activePerks[2].forcedCard;
  }
  if (controlled && playerTurn === controlled) {
    if (cardType !== forcedCard) {
      alert(`You are being controlled! You must play ${forcedCard}.`);
      return;
    }
    if (lockedCards[playerTurn][forcedCard]) {
      alert(`The forced card (${forcedCard}) is locked. Control perk will not be used.`);
      // Remove the control perk so the game can proceed
      if (activePerks[1]?.type === 'Control' && activePerks[1].target === playerTurn) activePerks[1] = null;
      if (activePerks[2]?.type === 'Control' && activePerks[2].target === playerTurn) activePerks[2] = null;
      updatePlayerUI();
      return;
    }
  }

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
    // Always show results after player 2's turn, regardless of mode
    fadeSwitch(document.getElementById("player2"), () => {
      document.getElementById("player2").classList.add("hidden");
      showResult();
    });
  }
}

function showResult() {
  // Always update the mode label for results screen
  document.getElementById("mode").innerText = `Mode: ${gameMode}`;
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
  // Always clear any remaining Trap perks at the end of the round
  if (activePerks[1]?.type === 'Trap') activePerks[1] = null;
  if (activePerks[2]?.type === 'Trap') activePerks[2] = null;

  const prevTokens = { 1: tokens[1], 2: tokens[2] };
  const result = evaluateMatchup(p1, p2, {
    perks,
    tokens,
    gameMode,
    consecutiveWins
  });

  // Ensure result is defined before proceeding
  if (!result) {
    console.error('Error: evaluateMatchup returned undefined result');
    return;
  }

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

  // Clothing removal message (for every full token lost)
  const initialTokens = startingTokens[1];
  const prevClothing1 = Math.floor(initialTokens - prevTokens[1]);
  const prevClothing2 = Math.floor(initialTokens - prevTokens[2]);
  const currClothing1 = Math.floor(initialTokens - result.tokens[1]);
  const currClothing2 = Math.floor(initialTokens - result.tokens[2]);
  if (currClothing1 > prevClothing1) {
    result.instructions += ` Player 1: Remove ${currClothing1 - prevClothing1} piece${currClothing1 - prevClothing1 > 1 ? 's' : ''} of clothing!`;
  }
  if (currClothing2 > prevClothing2) {
    result.instructions += ` Player 2: Remove ${currClothing2 - prevClothing2} piece${currClothing2 - prevClothing2 > 1 ? 's' : ''} of clothing!`;
  }

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
        <button onclick='assignPunishment(${loser}, 1)'>${pendingPunishment[1]}</button><br>
        <button style='margin-top:8px;color:#fff;background:#ff6b6b;' onclick='forfeitPunishment(${loser})'>Forfeit Punishment (Lose 1 Token)</button>
      </div>`;
    } else if (pendingPunishment && pendingPunishment.length > 0) {
      punishmentChoiceHTML = `<div id='punishment-choice'><b>Player ${loser}, you have a punishment:</b><br>
        <span>${pendingPunishment.join(', ')}</span><br>
        <button style='margin-top:8px;color:#fff;background:#ff6b6b;' onclick='forfeitPunishment(${loser})'>Forfeit Punishment (Lose 1 Token)</button>
      </div>`;
    }
  }
  document.getElementById("punishment-choice-area").innerHTML = punishmentChoiceHTML;

  // 6. Punishment choice area
  let p1Punishment = formatPunishments(result.punishments[1]);
  let p2Punishment = formatPunishments(result.punishments[2]);
  // Show 'Choose...' if the player has a pending punishment (any length)
  if ((result.punishments[1] && result.punishments[1].length > 0) && loser === 1) {
    p1Punishment = "<span style='color:#aaa;font-style:italic;'>Choose...</span>";
  }
  if ((result.punishments[2] && result.punishments[2].length > 0) && loser === 2) {
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
    // Count punishments for each player
    let p1Punishments = 0;
    let p2Punishments = 0;
    gameHistory.forEach(entry => {
      if (entry.punishments[1] && entry.punishments[1].length > 0) p1Punishments++;
      if (entry.punishments[2] && entry.punishments[2].length > 0) p2Punishments++;
    });
    // Upgrade final punishment to next difficulty if possible
    const nextDifficulty = {
      'Easy': 'Medium',
      'Medium': 'Hard',
      'Hard': 'Extreme',
      'Extreme': 'Extreme'
    };
    const finalDiff = nextDifficulty[gameMode] || gameMode;
    if (result.punishments[loser] && result.punishments[loser].length > 0) {
      result.punishments[loser] = getRandomPunishment(finalDiff, 2);
    }
    setTimeout(() => {
      alert(`Game Over! Player ${winner} wins!\nPlayer ${loser} has lost all ${totalClothingLost} items of clothing!\nFinal punishment: ${formatPunishments(result.punishments[loser])}\n\nPunishments received:\nPlayer 1: ${p1Punishments}\nPlayer 2: ${p2Punishments}`);
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

function forfeitPunishment(player) {
  // Remove the punishment for this player in the last result
  const lastResult = gameHistory[gameHistory.length - 1];
  lastResult.punishments[player] = [];
  // Subtract a token (minimum 0)
  tokens[player] = Math.max(0, tokens[player] - 1);
  lastResult.tokens[player] = tokens[player];
  // Log the forfeit in the result display
  document.getElementById(`player${player}-result-punishment`).innerHTML = `<span style='color:#aaa;font-style:italic;'>Punishment forfeited (lost 1 token)</span>`;
  document.getElementById("punishment-choice-area").innerHTML = `<b>Punishment forfeited!</b> Player ${player} lost 1 token instead.`;
  updateGameHistory();
  // Update token display to match main results logic
  const tokenIcon = '<img src="images/token.png" class="token-icon" style="width:22px;vertical-align:middle;">';
  document.getElementById(`player${player}-result-tokens`).innerHTML =
    `Tokens: ${tokenIcon.repeat(tokens[player])} <span style='font-size:0.9em;opacity:0.7;'>(${tokens[player]})</span>`;
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

  // Party Mode and CPU toggle logic
  const cpuToggle = document.getElementById('cpu-toggle');
  const partyToggle = document.getElementById('party-toggle');
  const customArea = document.getElementById('custom-punishments-area');
  if (cpuToggle && partyToggle) {
    cpuToggle.addEventListener('change', function() {
      if (cpuToggle.checked) {
        partyToggle.checked = false;
        partyToggle.disabled = true;
        if (customArea) customArea.style.display = 'none';
      } else {
        partyToggle.disabled = false;
      }
    });
    partyToggle.addEventListener('change', function() {
      if (partyToggle.checked) {
        cpuToggle.checked = false;
        cpuToggle.disabled = true;
        if (customArea) customArea.style.display = '';
      } else {
        cpuToggle.disabled = false;
        if (customArea) customArea.style.display = 'none';
      }
    });
    // On load, ensure only one is enabled if both are checked
    if (cpuToggle.checked) { partyToggle.disabled = true; if (customArea) customArea.style.display = 'none'; }
    if (partyToggle.checked) { cpuToggle.disabled = true; if (customArea) customArea.style.display = ''; }
  }

  // Custom punishment logic
  const addBtn = document.getElementById('add-custom-punishment-btn');
  const input = document.getElementById('custom-punishment-input');
  const list = document.getElementById('custom-punishments-list');
  if (addBtn && input && list) {
    addBtn.addEventListener('click', function() {
      const value = input.value.trim();
      if (!value) return;
      if (customPunishments.includes(value)) return;
      customPunishments.push(value);
      const li = document.createElement('li');
      li.textContent = value;
      list.appendChild(li);
      input.value = '';
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') addBtn.click();
    });
  }
});

function cpuMove() {
  console.log('[CPU] cpuMove called.');
  // If forced by Control perk, obey
  if ((activePerks[1]?.type === 'Control' && activePerks[1].target === 2) ||
      (activePerks[2]?.type === 'Control' && activePerks[2].target === 2)) {
    let forcedCard = (activePerks[1]?.type === 'Control' && activePerks[1].target === 2) ? activePerks[1].forcedCard : activePerks[2].forcedCard;
    if (!lockedCards[2][forcedCard]) {
      selectCard(forcedCard);
      return;
    } else {
      // If forced card is locked, remove the control perk and proceed as normal
      if (activePerks[1]?.type === 'Control' && activePerks[1].target === 2) activePerks[1] = null;
      if (activePerks[2]?.type === 'Control' && activePerks[2].target === 2) activePerks[2] = null;
      updatePlayerUI();
    }
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

// --- Punishment Wheel Logic ---
function getPunishmentSummary(punishment) {
  // Remove leading articles and take first 2 significant words
  let words = punishment.replace(/^(to |a |an |the |be |and |or |if |for |with |by |on |in |at |of |from |as |is |are |was |were |has |have |had |do |does |did |will |would |can |could |should |may |might |must )/i, '').split(' ');
  // Remove punctuation from start/end of each word, but keep spaces
  words = words.map(w => w.replace(/^[^\w\d]+|[^\w\d]+$/g, ''));
  return words.slice(0, 2).join(' ');
}

function showPunishmentWheel(punishments, onResult) {
  const embed = document.getElementById('punishment-wheel-embed');
  const canvas = document.getElementById('punishment-wheel-canvas');
  const spinBtn = document.getElementById('spin-punishment-wheel-btn');
  const resultDiv = document.getElementById('punishment-wheel-result');
  if (!embed || !canvas || !spinBtn || !resultDiv) return;

  // Build summaries for display
  const summaries = punishments.map(getPunishmentSummary);

  let spinning = false;
  let selectedIndex = null;
  let angle = 0;
  let spinTimeout = null;

  function drawWheel(highlightIdx = null) {
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const num = punishments.length;
    const arc = (2 * Math.PI) / num;
    ctx.clearRect(0, 0, size, size);
    for (let i = 0; i < num; i++) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(size/2, size/2);
      ctx.arc(size/2, size/2, size/2-8, i*arc+angle, (i+1)*arc+angle, false);
      ctx.closePath();
      if (highlightIdx === i) {
        ctx.fillStyle = '#e6be39';
      } else {
        ctx.fillStyle = (i % 2 === 0) ? '#141414' : '#a62a28';
      }
      ctx.fill();
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(size/2, size/2);
      ctx.rotate(i*arc + arc/2 + angle);
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px Merriweather, serif';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 2;
      ctx.fillText(summaries[i], size/2-24, 8);
      ctx.restore();
      ctx.restore();
    }
    // Draw pointer (at 3 o'clock, right side)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(size-20, size/2);
    ctx.lineTo(size-40, size/2-16);
    ctx.lineTo(size-40, size/2+16);
    ctx.closePath();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }

  function spinWheel() {
    if (spinning) return;
    spinning = true;
    resultDiv.textContent = '';
    let velocity = Math.random() * 0.25 + 0.35;
    let decel = 0.995 + Math.random()*0.002;
    function animate() {
      angle += velocity;
      velocity *= decel;
      drawWheel();
      if (velocity > 0.01) {
        spinTimeout = requestAnimationFrame(animate);
      } else {
        angle = angle % (2*Math.PI);
        const num = punishments.length;
        const arc = (2 * Math.PI) / num;
        let selected = Math.floor(((2*Math.PI - angle) % (2*Math.PI)) / arc) % num;
        selectedIndex = selected;
        angle = (2*Math.PI - (selectedIndex * arc) - arc/2) % (2*Math.PI);
        drawWheel(selectedIndex);
        // Show full punishment text in result
        resultDiv.textContent = `Selected: ${punishments[selectedIndex]}`;
        spinning = false;
        if (onResult) onResult(punishments[selectedIndex]);
      }
    }
    animate();
  }

  // Setup UI
  drawWheel();
  resultDiv.textContent = '';
  embed.classList.remove('hidden');
  spinBtn.disabled = false;

  spinBtn.onclick = () => {
    if (!spinning) spinWheel();
  };
}

// --- Integrate with game flow ---
const originalShowResult = showResult;
showResult = function() {
  const partyToggle = document.getElementById('party-toggle');
  const isPartyMode = partyToggle && partyToggle.checked;
  originalShowResult();
  const lastResult = gameHistory[gameHistory.length-1];
  const embed = document.getElementById('punishment-wheel-embed');
  const choiceArea = document.getElementById('punishment-choice-area');
  if (embed) embed.classList.add('hidden');
  if (!isPartyMode || !lastResult) return;
  // Only show the wheel if a punishment is actually pending
  if ((lastResult.punishments[1] && lastResult.punishments[1].length > 0) || (lastResult.punishments[2] && lastResult.punishments[2].length > 0)) {
    // Build pool: 20 random unique punishments from difficulty + custom
    let pool = [];
    let difficulty = gameMode;
    if (typeof PUNISHMENTS !== 'undefined' && PUNISHMENTS[difficulty]) {
      let base = Array.from(PUNISHMENTS[difficulty]);
      // Remove duplicates with custom
      let all = Array.from(new Set([...base, ...customPunishments]));
      // Shuffle and pick 20
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      pool = all.slice(0, 20);
    } else {
      pool = Array.from(new Set([...customPunishments]));
    }
    // Fallback: if less than 20, use all available
    if (pool.length < 1) return;
    // Hide standard punishment choice UI
    if (choiceArea) choiceArea.innerHTML = '';
    showPunishmentWheel(pool, function(selected) {
      if (lastResult.punishments[1] && lastResult.punishments[1].length > 0) lastResult.punishments[1] = [selected];
      if (lastResult.punishments[2] && lastResult.punishments[2].length > 0) lastResult.punishments[2] = [selected];
      updateGameHistory();
    });
  }
};

function evaluateMatchup(p1, p2, state) {
  const result = {
    summary: `Player 1 played: ${p1}\nPlayer 2 played: ${p2}`,
    instructions: '',
    tokens: { ...state.tokens },
    perks: { ...state.perks },
    consecutiveWins: { ...state.consecutiveWins },
    punishments: { 1: [], 2: [] }
  };

  // Track tokens as decimals
  let tokenLossP1 = 0;
  let tokenLossP2 = 0;

  // Define strong and normal counters
  const strongCounters = {
    'ATTACK': ['SUBMIT'],
    'DEFEND': ['ATTACK'],
    'SUBMIT': ['DEFEND'],
    'TRAP': ['ATTACK'],
    'WILD': ['SUBMIT']
  };
  const normalCounters = {
    'WILD': ['ATTACK', 'DEFEND', 'TRAP'],
    'ATTACK': ['TRAP', 'WILD'],
    'DEFEND': ['TRAP', 'WILD'],
    'SUBMIT': ['TRAP', 'WILD'],
    'TRAP': ['SUBMIT', 'WILD']
  };

  // Helper for next difficulty
  const nextDifficulty = {
    'Easy': 'Medium',
    'Medium': 'Hard',
    'Hard': 'Extreme',
    'Extreme': 'Extreme'
  };

  // Determine outcome
  let wildWin = false;
  let wildWinner = null;
  if (p1 === p2) {
    if (p1 === 'WILD') {
      result.instructions = 'Both players played WILD! Both lose a token, both are punished, and both gain a perk!';
      result.tokens[1] = Math.max(0, result.tokens[1] - 0.5); // was 1
      result.tokens[2] = Math.max(0, result.tokens[2] - 0.5); // was 1
      // Both get the same punishment (use next difficulty)
      const punishmentDiff = nextDifficulty[state.gameMode] || state.gameMode;
      const [punishment] = getRandomPunishment(punishmentDiff, 1);
      result.punishments[1] = [punishment];
      result.punishments[2] = [punishment];
      // Both get a random perk
      const availablePerks = ['Control', 'Reverse', 'Trap'];
      const randomPerk1 = availablePerks[Math.floor(Math.random() * availablePerks.length)];
      const randomPerk2 = availablePerks[Math.floor(Math.random() * availablePerks.length)];
      result.perks[1] = grantPerk(result.perks[1], randomPerk1);
      result.perks[2] = grantPerk(result.perks[2], randomPerk2);
    } else if (p1 === 'SUBMIT') {
      result.instructions = 'Both players must be punished!';
    } else {
      result.instructions = 'Stalemate. Nothing happens.';
    }
  } else {
    // Check strong counters
    if (strongCounters[p1] && strongCounters[p1].includes(p2)) {
      if (p1 === 'WILD') {
        wildWin = true; wildWinner = 1;
        tokenLossP2 = 0.5; // was 1
        result.instructions = 'Player 1 wins with WILD! Player 2 gives a token to Player 1.';
      } else {
        tokenLossP2 = 0.5; // was 1
        result.instructions = 'Player 1 wins the round. Player 2 loses a token.';
        // Award perk if won with SUBMIT
        if (p1 === 'SUBMIT') {
          const availablePerks = ['Control', 'Reverse', 'Trap'];
          const randomPerk = availablePerks[Math.floor(Math.random() * availablePerks.length)];
          result.perks[1] = grantPerk(result.perks[1], randomPerk);
          result.instructions += ` Player 1 gains the ${randomPerk} perk!`;
        }
      }
    } else if (strongCounters[p2] && strongCounters[p2].includes(p1)) {
      if (p2 === 'WILD') {
        wildWin = true; wildWinner = 2;
        tokenLossP1 = 0.5; // was 1
        result.instructions = 'Player 2 wins with WILD! Player 1 gives a token to Player 2.';
      } else {
        tokenLossP1 = 0.5; // was 1
        result.instructions = 'Player 2 wins the round. Player 1 loses a token.';
        // Award perk if won with SUBMIT
        if (p2 === 'SUBMIT') {
          const availablePerks = ['Control', 'Reverse', 'Trap'];
          const randomPerk = availablePerks[Math.floor(Math.random() * availablePerks.length)];
          result.perks[2] = grantPerk(result.perks[2], randomPerk);
          result.instructions += ` Player 2 gains the ${randomPerk} perk!`;
        }
      }
    } else if (normalCounters[p1] && normalCounters[p1].includes(p2)) {
      tokenLossP2 = 0.25; // was 0.5
      result.instructions = 'Player 1 wins the round. Player 2 loses half a token.';
    } else if (normalCounters[p2] && normalCounters[p2].includes(p1)) {
      tokenLossP1 = 0.25; // was 0.5
      result.instructions = 'Player 2 wins the round. Player 1 loses half a token.';
    } else {
      result.instructions = 'No clear winner this round.';
    }
  }

  // Store previous whole tokens for punishment check
  const prevTokens1 = Math.floor(result.tokens[1]);
  const prevTokens2 = Math.floor(result.tokens[2]);

  // Apply token loss (track decimals)
  if (wildWin && wildWinner === 1) {
    result.tokens[2] = Math.max(0, result.tokens[2] - 0.5); // was 1
    result.tokens[1] = Math.min(result.tokens[1] + 0.5, 99); // was 1
  } else if (wildWin && wildWinner === 2) {
    result.tokens[1] = Math.max(0, result.tokens[1] - 0.5); // was 1
    result.tokens[2] = Math.min(result.tokens[2] + 0.5, 99); // was 1
  } else {
    result.tokens[1] = Math.max(0, (result.tokens[1] - tokenLossP1));
    result.tokens[2] = Math.max(0, (result.tokens[2] - tokenLossP2));
  }

  // Assign punishments every time a player loses a hand (not just for full token loss)
  let punishmentDiff = state.gameMode;
  if (wildWin) {
    punishmentDiff = nextDifficulty[state.gameMode] || state.gameMode;
  }
  // Escalating mode: determine punishment difficulty based on tokens lost
  function getEscalatingDifficulty(player) {
    const lost = startingTokens[player] - result.tokens[player];
    if (lost >= 4) return 'Extreme';
    if (lost >= 3) return 'Hard';
    if (lost >= 2) return 'Medium';
    return 'Easy';
  }
  if (isEscalatingMode) {
    if (tokenLossP1 > 0) {
      const diff = getEscalatingDifficulty(1);
      result.punishments[1] = getRandomPunishment(diff, 2);
      console.log('Punishment assigned to Player 1:', result.punishments[1]);
    }
    if (tokenLossP2 > 0) {
      const diff = getEscalatingDifficulty(2);
      result.punishments[2] = getRandomPunishment(diff, 2);
      console.log('Punishment assigned to Player 2:', result.punishments[2]);
    }
  } else {
    if (tokenLossP1 > 0) {
      result.punishments[1] = getRandomPunishment(punishmentDiff, 2);
      console.log('Punishment assigned to Player 1:', result.punishments[1]);
    }
    if (tokenLossP2 > 0) {
      result.punishments[2] = getRandomPunishment(punishmentDiff, 2);
      console.log('Punishment assigned to Player 2:', result.punishments[2]);
    }
  }

  // Update consecutive wins
  if (tokenLossP2 > 0 && tokenLossP1 === 0) {
    result.consecutiveWins[1]++;
    result.consecutiveWins[2] = 0;
  } else if (tokenLossP1 > 0 && tokenLossP2 === 0) {
    result.consecutiveWins[2]++;
    result.consecutiveWins[1] = 0;
  } else {
    result.consecutiveWins[1] = 0;
    result.consecutiveWins[2] = 0;
  }
  return result;
}
