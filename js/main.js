import { calculateElementalValues, calculateFinalHitDamage } from "./calc.js";
import {
  ALL_ELEMENTS, COMBOS, SINGLES, MULTIPLIERS, X_ATTACK_UP_OPTIONS,
  SHELL_TYPES, SHELL_LEVELS, getShellMod, getPenalty,
} from "./data.js";

// querySelector snippet
const $ = (id) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id}`);
  return el;
};

// 1 decimnal, strip trailing zeroes
const fmt = (n) => n.toFixed(1).replace(/\.0$/, "");
// At most 2 decimals
const fmtMultipliers = (n) => String(Number(n.toFixed(2)));

function makeSelect(id, options, onChange) {
  const s = document.createElement("select");
  s.id = id;
  for (const o of options) s.add(new Option(fmtMultipliers(o), String(o)));
  s.addEventListener("change", onChange);
  return s;
}

function makeField(label, control) {
  const wrap = document.createElement("label");
  wrap.className = "field";
  const span = document.createElement("span");
  span.textContent = label;
  wrap.append(span, control);
  return wrap;
}

function parseNonNegative(input, { integer = false } = {}) {
  const n = Number(input.value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return integer ? Math.floor(n) : n;
}

const weaponEl = $("weaponElement");
const sigils = $("sigils");
const elementSel = $("element");
const xauBox = $("xau");
const multBox = $("multipliers");
const results = $("results");
const defenseEl = $("defense");
const hitzoneBox = $("hitzones");
const shellTypeSel = $("shellType");
const shellLevelSel = $("shellLevel");
const gRankBox = $("gRank");
const fullBurstBox = $("fullBurst");
const quickReloadBox = $("quickReload");
const shellModOut = $("shellModOut");
const penaltyOut = $("penaltyOut");

// Store per-component X Attack Up and hitzone values
const xauValues = {};
const hitzoneValues = {};


function getCurrentElement() {
  return ALL_ELEMENTS.find((e) => e.name === elementSel.value) ?? ALL_ELEMENTS[0];
}

function renderXattackUp() {
  const el = getCurrentElement();
  xauBox.replaceChildren();
  for (const part of Object.keys(el.components)) {
    const sel = makeSelect(`xau-${part}`, X_ATTACK_UP_OPTIONS, () => {
      xauValues[part] = Number(sel.value);
      update();
    });
    if (xauValues[part] !== undefined) sel.value = String(xauValues[part]);
    xauBox.appendChild(makeField(`${part} Attack Up S/L`, sel));
  }
}

function renderHitzones() {
  const el = getCurrentElement();
  hitzoneBox.replaceChildren();
  for (const part of Object.keys(el.components)) {
    const input = document.createElement("input");
    input.id = `hz-${part}`;
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.inputMode = "numeric";
    input.value = String(hitzoneValues[part] ?? 100);
    input.addEventListener("input", () => {
      hitzoneValues[part] = parseNonNegative(input, true);
      update();
    });
    hitzoneBox.appendChild(makeField(`Hitzone - ${part}`, input));
  }
}

function renderElementalValues(r) {
  results.replaceChildren();
  const ul = document.createElement("ul");
  for (const p of r.components) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = `${p.element} `;
    const small = document.createElement("small");
    const comboText = `×${fmtMultipliers(p.comboMod)}`
    small.textContent = `${element.combo ? comboText : ""} · internal ${p.internal}${p.transcend > 1 ? " · transcend" : ""}`;
    name.appendChild(small);
    const val = document.createElement("b");
    val.textContent = `${fmt(p.value)} ${fullBurstBox.checked ? `(${fmt(p.combinedValue)})` : ""}`;
    li.append(name, val);
    ul.appendChild(li);
  }
  results.appendChild(ul);
}

function renderFinalPerHitDamage(f) {
  finalResults.replaceChildren();

  const ul = document.createElement("ul");
  for (const p of f.perComp) {
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = `${p.element} `;
    const val = document.createElement("b");
    val.textContent = `${fmt(p.value)} ${fullBurstBox.checked ? `(${fmt(p.combinedValue)})` : ""}`;
    li.append(name, val);
    ul.appendChild(li);
  }
  finalResults.appendChild(ul);

  const ft = document.createElement("div");
  ft.className = "final-total";
  const fl = document.createElement("span");
  fl.textContent = "Damage per elemental hit";
  const fn = document.createElement("strong");
  fn.textContent = `${fmt(f.final)} ${fullBurstBox.checked ? `(${fmt(f.combinedFinal)})` : ""}`;
  ft.append(fl, fn);
  finalResults.appendChild(ft);
}

function populateControls() {
  for (const t of SHELL_TYPES) shellTypeSel.add(new Option(t, t));
  for (const l of SHELL_LEVELS) shellLevelSel.add(new Option(String(l), String(l)));

  for (const [label, group] of [["Single", SINGLES], ["Combo", COMBOS]]) {
    const og = document.createElement("optgroup");
    og.label = label;
    for (const e of group) og.appendChild(new Option(e.name, e.name));
    elementSel.appendChild(og);
  }

  for (const m of MULTIPLIERS) {
    multBox.appendChild(makeField(m.label, makeSelect(`mul-${m.id}`, m.options, update)));
  }
}

function update() {
  const element = getCurrentElement();
  const xAttackUp = {};
  for (const comp of Object.keys(element.components)) {
    xAttackUp[comp] = Number($(`xau-${comp}`).value);
  }
  const shell = getShellMod(shellTypeSel.value, Number(shellLevelSel.value));
  const pen = getPenalty(shellTypeSel.value, gRankBox.checked, fullBurstBox.checked);
  shellModOut.textContent = fmtMultipliers(shell);
  penaltyOut.textContent = fmtMultipliers(pen);

  const mul = (id) => Number($(`mul-${id}`).value);
  const eleValues = calculateElementalValues({
    weaponElement: parseNonNegative(weaponEl, true),
    sigils: parseNonNegative(sigils, true),
    element,
    elementAttackUp: xAttackUp,
    drug: mul("drug"),
    tenran: mul("tenran"),
    elemAttack: mul("elemAtk"),
    furious: mul("furious"),
    zSigil: mul("zSigil"),
    transcend: mul("transcend"),
    shellMod: shell,
    penalty: pen,
  });

  const hitzones = {};
  for (const comp of Object.keys(element.components)) hitzones[comp] = parseNonNegative($(`hz-${comp}`));
  const applyQuickReload = fullBurstBox.checked ? false : quickReloadBox.checked;
  const finalValues = calculateFinalHitDamage(eleValues.components, applyQuickReload, hitzones, parseNonNegative(defenseEl));

  renderElementalValues(eleValues);
  renderFinalPerHitDamage(finalValues);

}

elementSel.addEventListener("change", () => { renderXattackUp(); renderHitzones(); update(); });
defenseEl.addEventListener("input", update);
weaponEl.addEventListener("input", update);
for (const el of [shellTypeSel, shellLevelSel, gRankBox, fullBurstBox, quickReloadBox]) el.addEventListener("change", update);
sigils.addEventListener("input", update);

populateControls();
renderXattackUp();
renderHitzones();
update();