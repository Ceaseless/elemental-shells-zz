import { SINGLE_ELEMENTS } from "./data.js";
// Floor with a tiny epsilon so floating point precision doesn't mess stuff up
const floor = (x) => Math.floor(x + 1e-9);

/**
 * Two-step calculation, run once per element component
 *
 * Step 1 (internal elemental):
 *   (weaponElement + sigils) > comboMod > xAttackUp > drug > tenran > elemAttack > furious > zSigil
 *   Floor after every step
 *
 * Step 2 (total value), with M = xAttackUp * drug * tenran * elemAttack * furious:
 *   single: floor(floor((floor(internal * shellMod) + sigils) * M * penalty) * transcend)
 *   combo:  floor(floor(floor(internal * shellMod) * M * penalty + sigils) * transcend)
 *   
 *   For combined hits
 *   single: floor(floor((floor(internal * shellMod) + sigils) * M * penalty * 2) * transcend)
 *   combo: floor(floor(floor(internal * shellMod) * M * penalty * 2 + sigils) * transcend)
 * 
 * @param {{
 *   weaponElement: number, sigils: number,
 *   element: import("./data.js").ElementDef,
 *   elementAttackUp: Record<string, number>,
 *   drug: number, tenran: number, elemAttack: number, furious: number,
 *   zSigil: number, transcend: number, shellMod: number, penalty: number,
 * }} i
 */
export function calculateElementalValues(i) {
  const names = Object.keys(i.element.components);
  // Find returns first match
  const transcendTarget = i.element.combo
    ? SINGLE_ELEMENTS.find((e) => names.includes(e))
    : names[0];
 
  const components = Object.entries(i.element.components).map(([element, comboMod]) => {
    
    const xau = i.elementAttackUp[element] ?? 1;
    
    let internal = floor((i.weaponElement + i.sigils) * comboMod);
    for (const m of [xau, i.drug, i.tenran, i.elemAttack, i.furious, i.zSigil]) {
      internal = floor(internal * m);
    }
        
    // Furious 1 bug -> Game loads 1.04 instead of 1.05
    const multipliers = xau * i.drug * i.tenran * i.elemAttack * (i.furious === 1.05 ? 1.04 : i.furious); 

    const transcended = element === transcendTarget;
    const transcend = transcended ? i.transcend : 1;

    const appliedShellMod = floor(internal * i.shellMod);
    const value = i.element.combo
      ? floor(floor(appliedShellMod * multipliers * i.penalty + i.sigils) * transcend)
      : floor(floor((appliedShellMod + i.sigils) * multipliers * i.penalty) * transcend);

    const combinedValue = i.element.combo
      ? floor(floor(appliedShellMod * multipliers * i.penalty * 2 + i.sigils) * transcend)
      : floor(floor((appliedShellMod + i.sigils) * multipliers * i.penalty * 2) * transcend);
    return { element, comboMod, elementAttackUp: xau, internal, transcend, value, combinedValue };
  });

  return { components, total: components.reduce((sum, p) => sum + p.value, 0), combinedTotal: components.reduce((sum, p) => sum + p.combinedValue, 0) };
}

/**
 * Final damage per hit:
 *   per component: calculatedElement * (hitzone / 100)
 *   final:    floor((sum of components + 1) * defense)
 *   combined: same thing using combinedValues
 *   return 1 if final < 1
 * Oddly enough keeps decimal places for the element sum
 * Might still go wrong because of floating point shenanigans on hitzones
 *
 * @param {{ element: string, value: number }[]} components  Calculated element per component.
 * @param {boolean} quickReload                              Apply quick-reload multiplier.
 * @param {Record<string, number>} hitzones             Integer hitzone per element component.
 * @param {number} defense                              Non-negative defense value.
 */
export function calculateFinalHitDamage(components, quickReload, hitzones, defense) {
  const perComp = components.map((p) => {
    const hitzone = hitzones[p.element] / 100 ?? 0;
    return { element: p.element, hitzone, value: (p.value * hitzone), combinedValue: (p.combinedValue * hitzone) };
  });
  const sum = perComp.reduce((a, p) => a + p.value, 0) * (quickReload ? 1.5 : 1);
  const combinedSum = perComp.reduce((a, p) => a + p.combinedValue, 0); // Combined Hits with Quick-Reload are impossible
  // Can't deal 0 damage
  const final = Math.max(floor((sum + 1) * defense),1);
  const combinedFinal = Math.max(floor((combinedSum + 1) * defense),1);
  return { perComp: perComp, sum, final: final, combinedFinal: combinedFinal };
}

/**
 * @param {{ perComp: number, sum: number, final: number, combinedFinal: number }} damageValues 
 * @param {number} shellCount                              
 */
export function getPerShellDamage(damageValues, shellCount) {
  if (shellCount > 8 || shellCount < 1) {
    return [];
  }

  if (shellCount < 5) {
    return Array(shellCount).fill(damageValues.final);
  }  

  const combShells = shellCount - 4;
  const normShells = 4 - combShells;
  return [
    ...Array(normShells).fill(damageValues.final),
    ...Array(combShells).fill(damageValues.combinedFinal)
  ];
  
}