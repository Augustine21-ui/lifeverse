export const getLevelFromXP = (xp) => {
  // Level 1: 0 XP
  // Level 2: 500 XP
  // Level 3: 1500 XP
  // Level 4: 3000 XP
  // Level 5: 5000 XP
  // etc.
  if (xp < 500) return 1;
  if (xp < 1500) return 2;
  if (xp < 3000) return 3;
  if (xp < 5000) return 4;
  if (xp < 7500) return 5;
  if (xp < 10500) return 6;
  if (xp < 14000) return 7;
  if (xp < 18000) return 8;
  if (xp < 22500) return 9;
  return 10;
};