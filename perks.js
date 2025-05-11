function grantPerk(perkList, type) {
    if (!perkList.includes(type) && perkList.length < 3) {
      perkList.push(type);
    }
    return perkList;
  }
  
  function usePerk(perkList, type) {
    const index = perkList.indexOf(type);
    if (index !== -1) {
      perkList.splice(index, 1);
      return true;
    }
    return false;
  }
  
  function hasPerk(perkList, type) {
    return perkList.includes(type);
  }
  
  // Optional: add triggered effects later
  function triggerControl(player) {
    // Let player choose outcome or punishment
  }
  
  function triggerReverse(player) {
    // Reverse incoming punishment
  }
  
  function triggerDisarm(opponentPerks) {
    if (usePerk(opponentPerks, "trap")) {
      return "Opponent trap nullified.";
    }
    return null;
  }
  