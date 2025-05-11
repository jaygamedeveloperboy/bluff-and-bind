const PERK_TYPES = {
  CONTROL: 'Control',
  REVERSE: 'Reverse',
  TRAP: 'Trap'
};

// Card relationships
const CARD_RELATIONSHIPS = {
  'ATTACK': {
    strongAgainst: ['SUBMIT'],
    weakAgainst: ['DEFEND'],
    counters: ['TRAP', 'WILD']
  },
  'DEFEND': {
    strongAgainst: ['ATTACK', 'WILD'],
    weakAgainst: ['SUBMIT'],
    counters: ['TRAP']
  },
  'SUBMIT': {
    strongAgainst: ['DEFEND'],
    weakAgainst: ['ATTACK', 'WILD'],
    counters: ['TRAP']
  },
  'TRAP': {
    strongAgainst: ['ATTACK', 'SUBMIT', 'WILD'],
    weakAgainst: ['DEFEND'],
    counters: []
  },
  'WILD': {
    strongAgainst: ['SUBMIT'],
    weakAgainst: ['DEFEND', 'TRAP', 'ATTACK'],
    counters: []
  }
};

// Define primary and secondary counters
const counters = {
  'ATTACK': {
    primary: 'DEFEND',
    secondary: 'TRAP'
  },
  'DEFEND': {
    primary: 'SUBMIT',
    secondary: 'ATTACK'
  },
  'SUBMIT': {
    primary: 'ATTACK',
    secondary: 'DEFEND'
  },
  'TRAP': {
    primary: 'SUBMIT',
    secondary: 'ATTACK'
  }
};

function getRandomPunishment(difficulty, count = 2) {
  const punishments = PUNISHMENTS[difficulty];
  console.log('getRandomPunishment called:', { difficulty, punishments, count });
  if (!punishments || punishments.length === 0) return [];
  // Shuffle and pick unique punishments
  const shuffled = punishments.slice().sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);
  console.log('Selected punishments:', selected);
  return selected;
}

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
    'ATTACK': ['TRAP', 'WILD'],
    'DEFEND': ['TRAP', 'WILD'],
    'SUBMIT': ['TRAP', 'WILD'],
    'TRAP': ['SUBMIT', 'WILD'],
    'WILD': ['DEFEND', 'TRAP', 'ATTACK']
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
    result.instructions = `${p1 === 'SUBMIT' ? 'Both players must be punished!' : 'Stalemate. Nothing happens.'}`;
    // Double Wild: both get punished and both get a perk
    if (p1 === 'WILD') {
      result.instructions = 'Both players played WILD! Both lose a token, both are punished, and both gain a perk!';
      result.tokens[1] = Math.max(0, result.tokens[1] - 1);
      result.tokens[2] = Math.max(0, result.tokens[2] - 1);
      // Both get a punishment (use next difficulty)
      const punishmentDiff = nextDifficulty[state.gameMode] || state.gameMode;
      result.punishments[1] = getRandomPunishment(punishmentDiff, 2);
      result.punishments[2] = getRandomPunishment(punishmentDiff, 2);
      // Both get a random perk
      const availablePerks = ['Control', 'Reverse', 'Trap'];
      const randomPerk1 = availablePerks[Math.floor(Math.random() * availablePerks.length)];
      const randomPerk2 = availablePerks[Math.floor(Math.random() * availablePerks.length)];
      result.perks[1] = grantPerk(result.perks[1], randomPerk1);
      result.perks[2] = grantPerk(result.perks[2], randomPerk2);
    }
  } else {
    // Check strong counters
    if (strongCounters[p1] && strongCounters[p1].includes(p2)) {
      if (p1 === 'WILD') {
        wildWin = true; wildWinner = 1;
        tokenLossP2 = 1;
        result.instructions = 'Player 1 wins with WILD! Player 2 gives a token to Player 1.';
      } else {
        tokenLossP2 = 1;
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
        tokenLossP1 = 1;
        result.instructions = 'Player 2 wins with WILD! Player 1 gives a token to Player 2.';
      } else {
        tokenLossP1 = 1;
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
      tokenLossP2 = 0.5;
      result.instructions = 'Player 1 wins the round. Player 2 loses half a token.';
    } else if (normalCounters[p2] && normalCounters[p2].includes(p1)) {
      tokenLossP1 = 0.5;
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
    result.tokens[2] = Math.max(0, result.tokens[2] - 1);
    result.tokens[1] = Math.min(result.tokens[1] + 1, 99); // Arbitrary max
  } else if (wildWin && wildWinner === 2) {
    result.tokens[1] = Math.max(0, result.tokens[1] - 1);
    result.tokens[2] = Math.min(result.tokens[2] + 1, 99);
  } else {
    result.tokens[1] = Math.max(0, (result.tokens[1] - tokenLossP1));
    result.tokens[2] = Math.max(0, (result.tokens[2] - tokenLossP2));
  }

  // Assign punishments only if a full token is lost (integer part decreases)
  let punishmentDiff = state.gameMode;
  if (wildWin) {
    punishmentDiff = nextDifficulty[state.gameMode] || state.gameMode;
  }
  if (Math.floor(result.tokens[1]) < prevTokens1) {
    if (wildWin && wildWinner === 2 && state.gameMode === 'Extreme') {
      // Both punishments, no choice
      result.punishments[1] = getRandomPunishment('Extreme', 2);
    } else {
      result.punishments[1] = getRandomPunishment(punishmentDiff, 2);
    }
    console.log('Punishment assigned to Player 1:', result.punishments[1]);
  }
  if (Math.floor(result.tokens[2]) < prevTokens2) {
    if (wildWin && wildWinner === 1 && state.gameMode === 'Extreme') {
      result.punishments[2] = getRandomPunishment('Extreme', 2);
    } else {
      result.punishments[2] = getRandomPunishment(punishmentDiff, 2);
    }
    console.log('Punishment assigned to Player 2:', result.punishments[2]);
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
