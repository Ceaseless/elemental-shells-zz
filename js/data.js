
// Also encodes transcend priority
export const SINGLE_ELEMENTS = ["Fire", "Water", "Thunder", "Dragon", "Ice"];

/** @typedef {{ name: string, components: Record<string, number>, combo: boolean }} ElementDef */
const combo = (name, components) => ({ name, components, combo: true });

/** @type {ElementDef[]} */
export const SINGLES = SINGLE_ELEMENTS.map((e) => ({ name: e, components: { [e]: 1 }, combo: false }));

/** @type {ElementDef[]} */
export const COMBOS = [
  combo("Blaze", { Fire: 0.7, Dragon: 0.7 }),
  combo("Light", { Fire: 0.7, Thunder: 0.7 }),
  combo("Thunder Pole", { Thunder: 0.7, Dragon: 0.7 }),
  combo("Tenshou", { Fire: 0.3, Water: 1, Thunder: 0.7 }),
  combo("Shitou", { Fire: 0.8, Dragon: 0.4, Ice: 0.8 }),
  combo("Black Flame", { Fire: 0.5, Dragon: 1.5 }),
  combo("Music", { Water: 1, Ice: 1 }),
  combo("Darkness", { Dragon: 0.8, Ice: 0.8 }),
  combo("Crimson Demon", { Fire: 1.5, Dragon: 1 }),
  combo("Wind", { Thunder: 0.8, Ice: 0.8 }),
  combo("Sound", { Water: 1, Dragon: 1 }),
  combo("Burning Zero", { Fire: 1.25, Ice: 1.25 }),
  combo("Emperor's Roar", { Thunder: 1.5, Dragon: 0.5 }),
];

export const ALL_ELEMENTS = [...SINGLES, ...COMBOS];

// First option = default.
export const MULTIPLIERS = [
  { id: "drug", label: "All Element Drug", options: [1.0, 1.1] },
  // Tenran: +0.02 per piece
  // Origin: +0.03 per piece
  // Only apply when using a gou line weapon
  { id: "tenran", label: "Tenran/Origin multiplier", options: [1.0, 1.02, 1.04, 1.06, 1.08, 1.1, 1.03, 1.06, 1.09, 1.12, 1.15] }, // TODO: Split into groups
  { id: "elemAtk", label: "Elemental Attack", options: [1.0, 1.1] },
  { id: "furious", label: "Furious", options: [1.0, 1.05, 1.1, 1.2] },
  {
    id: "zSigil", label: "Z Sigil", options: [
      1.0,
      1.4,
      1.5,
      1.6,
      1.7,
      1.8,
      1.9,
      2,
      2.1,
      2.2,
      2.3,
      2.4,
      2.5,
      2.6,
      2.7,
      2.8
    ]
  },
  {
    id: "transcend", label: "Transcend", options: [
      1.0,
      1.10,
      1.15,
      1.20,
      1.25,
      1.30,
      1.50,
      1.55,
      1.60,
      1.75,
      1.80,
      2.00
    ]
  },
];

// X Attack Up S/L applies for each element separately
export const X_ATTACK_UP_OPTIONS = [1.0, 1.1, 1.2];

// Shell settings
export const SHELL_TYPES = ["Normal", "Long", "Wide"];
export const SHELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Taken from https://web.archive.org/web/20191009194248/http://bake2sa.blog.fc2.com/blog-entry-14.html
// Verified via memory inspection
const SHELL_MOD = {
  Normal: [3, 3.13, 3.26, 3.39, 3.52, 3.65, 3.78, 3.91, 4.04],
  Long: [5, 5.13, 5.26, 5.39, 5.52, 5.65, 5.78, 5.91, 6.04],
  Wide: [5.5, 5.63, 5.76, 5.89, 6.02, 6.15, 6.28, 6.41, 6.54],
};

// [non-G quest, G-Rank quest]
// Nerf from G1 and Full-Burst penalty
const PENALTY = {
  Normal: [0.9, 0.8],
  Long: [0.7, 0.6],
  Wide: [0.8, 0.7],
};

export function getZSigilMod(zSigil) {
  return 1.3 + 0.1 * zSigil;
}

export function getShellMod(type, level) {
  return SHELL_MOD[type][level - 1];
}

export function getPenalty(type, gRank, fullBurst) {
  if (!fullBurst) {
    return gRank ? 0.9 : 1.0
  }
  return PENALTY[type][gRank ? 1 : 0];
}