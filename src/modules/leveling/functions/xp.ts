export function randXp() {
  return Math.floor(Math.random() * 15) + 25;
}

export function totalXp(level: number) {
  if (!level || !Number.isInteger(level)) {
    return 0;
  }
  let totalXp = 0;
  for (let i = 0; i < level; i++) {
    totalXp += getTargetXp(i);
  }
  return totalXp;
}

export function getTargetXp(level: number) {
  return 5 * level ** 2 + 50 * level + 100; // Thanks MEE6 for the formula :)
}
