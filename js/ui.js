/**
 * DOM wiring for Supercalc. Imports pure physics + data; owns all unit conversions and DOM
 * access. Surface-impedance panel constraint-propagates from the user's 3 most-recent edits;
 * the N0 panel is bidirectional (θ↔N0); presets and the periodic table prefill panel 1.
 */

import { E_CHARGE, GAP_RATIO, nmToEv, evToNm } from './constants.js';
import { solveTop } from './superconductor.js';
import { computeN0, predictTheta } from './n0.js';
import { PRESETS, ELEMENT_DATA } from './materials.js';
import { renderPeriodicTable } from './periodic-table.js';

const $ = (id) => document.getElementById(id);
// Every physical field in this calculator is strictly positive; treat empty, non-numeric,
// zero, and negative entries alike as "not provided" so invalid input never reaches the
// pure physics modules.
const num = (el) => {
  const v = parseFloat(el.value);
  return el.value.trim() !== '' && Number.isFinite(v) && v > 0 ? v : null;
};
const fmt = (v) => (v == null || !Number.isFinite(v) ? '' : String(Number(v.toPrecision(6))));

/* ---- Panel 1: surface impedance --------------------------------------- */

const IMP = { tc_mK: 'f_tc', rho: 'f_rho', rs: 'f_rs', t_nm: 'f_t', lsq: 'f_lsq' };
const IMP_KEYS = Object.keys(IMP);
const impEl = Object.fromEntries(IMP_KEYS.map((k) => [k, $(IMP[k])]));
let pinOrder = [];                       // user-set fields, most-recent first

function pin(key) {
  pinOrder = pinOrder.filter((k) => k !== key);
  if (impEl[key].value.trim() !== '') pinOrder.unshift(key);
}

function recomputeImpedance() {
  const gapNum = parseFloat($('f_gap').value);
  const gapSolvable = !(Number.isFinite(gapNum) && gapNum > 0);  // empty/invalid → solve it
  let pins = pinOrder.slice();
  let solved = {};
  let warn = '';
  for (;;) {
    const known = { gap: gapSolvable ? null : gapNum };
    for (const k of pins) { const v = num(impEl[k]); if (v != null) known[k] = v; }
    try { solved = solveTop(known); break; }
    catch {
      warn = 'Inputs were over-determined; using your most recent entries.';
      if (!pins.length) { solved = solveTop({ gap: known.gap }); break; }
      pins = pins.slice(0, -1);
    }
  }
  pinOrder = pins;                       // keep only the pins that actually solved
  for (const k of IMP_KEYS) {
    if (pins.includes(k)) continue;      // leave the still-pinned fields as entered
    impEl[k].value = fmt(solved[k]);     // overwrite derived AND dropped fields with the solution
  }
  if (gapSolvable && Number.isFinite(solved.gap)) $('f_gap').value = fmt(solved.gap);
  $('impedance_msg').textContent = warn;
  syncToN0();
}

for (const k of IMP_KEYS) {
  impEl[k].addEventListener('input', () => { pin(k); recomputeImpedance(); });
}
$('f_gap').addEventListener('input', recomputeImpedance);
$('clearImpedance').addEventListener('click', () => {
  pinOrder = [];
  for (const k of IMP_KEYS) impEl[k].value = '';
  $('f_gap').value = String(GAP_RATIO);
  $('impedance_msg').textContent = '';
  recomputeImpedance();
});

/**
 * Prefill the linked fields. `gap` is 'solve' (empty the gap field so it's computed from the
 * other four), a number (fix it), or omitted (reset to the BCS default).
 */
function loadFields({ tc_mK, rho, rs, t_nm, lsq, gap }) {
  pinOrder = [];
  for (const k of IMP_KEYS) impEl[k].value = '';
  const provided = { tc_mK, rho, rs, t_nm, lsq };
  for (const k of IMP_KEYS) {
    if (provided[k] != null) { impEl[k].value = fmt(provided[k]); pin(k); }
  }
  if (gap === 'solve') $('f_gap').value = '';
  else if (typeof gap === 'number') $('f_gap').value = fmt(gap);
  else $('f_gap').value = String(GAP_RATIO);
  recomputeImpedance();
}

/* ---- Panel 2: N0 / pulse height --------------------------------------- */

function syncToN0() {
  recomputeN0('forward');                // panel-1 thickness (f_t) and gap feed the N0 calc
}

// Prefill the N0 panel from a preset's measured single-photon response.
function loadN0Prefill(pf) {
  if (pf.lambda_nm != null) { $('n_lambda').value = fmt(pf.lambda_nm); $('n_e').value = fmt(nmToEv(pf.lambda_nm)); }
  else if (pf.e_eV != null) { $('n_e').value = fmt(pf.e_eV); $('n_lambda').value = fmt(evToNm(pf.e_eV)); }
  if (pf.h_um != null) $('n_h').value = fmt(pf.h_um);
  if (pf.w_um != null) $('n_w').value = fmt(pf.w_um);
  if (pf.q != null) $('n_q').value = fmt(pf.q);
  if (pf.alpha_k != null) $('n_alpha').value = fmt(pf.alpha_k);
  if (pf.theta_deg != null) $('n_theta').value = fmt(pf.theta_deg);
  recomputeN0('forward');
}

function n0Inputs() {
  return {
    tc_mK: num($('f_tc')),
    e_eV: num($('n_e')),
    h_um: num($('n_h')), w_um: num($('n_w')), t_nm: num($('f_t')),
    q: num($('n_q')), alpha_k: num($('n_alpha')),
    eta_pb: num($('n_eta')) ?? 0.57, s2: num($('n_s2')) ?? 1.0,
    gapRatio: num($('f_gap')) ?? GAP_RATIO,
  };
}

// Blank the N0 outputs for the active direction (forward computes n_n0_ev; inverse computes
// n_theta). n_n0_si is always an output.
function clearN0Readouts(driver) {
  $('n_n0_si').textContent = '—';
  if (driver === 'inverse') $('n_theta').value = '';
  else $('n_n0_ev').value = '';
}

function recomputeN0(driver) {
  const p = n0Inputs();
  const need = ['tc_mK', 'e_eV', 'h_um', 'w_um', 't_nm', 'q', 'alpha_k'];
  if (need.some((k) => p[k] == null)) {
    $('n0_msg').textContent = 'Enter Tc (panel 1) plus all inductor and photon fields to compute N₀.';
    clearN0Readouts(driver);
    return;
  }
  const DEG2RAD = Math.PI / 180;         // θ is entered/displayed in degrees, physics in radians
  if (driver === 'inverse') {            // N0 (eV⁻¹µm⁻³) → θ
    const n0_ev = num($('n_n0_ev'));
    if (n0_ev == null) {
      $('n0_msg').textContent = 'Enter N₀ (eV⁻¹ µm⁻³) to get the predicted pulse height.';
      clearN0Readouts(driver);
      return;
    }
    const n0_SI = n0_ev / (E_CHARGE * 1e-18);
    $('n_theta').value = fmt(predictTheta({ ...p, n0_SI }) / DEG2RAD);
    $('n_n0_si').textContent = fmt(n0_SI);
    $('n0_msg').textContent = '';
  } else {                               // θ → N0
    const theta_deg = num($('n_theta'));
    if (theta_deg == null) {
      $('n0_msg').textContent = 'Enter a phase pulse height θ (deg) to compute N₀.';
      clearN0Readouts(driver);
      return;
    }
    const { n0_SI, n0_eVum3 } = computeN0({ ...p, theta_rad: theta_deg * DEG2RAD });
    $('n_n0_ev').value = fmt(n0_eVum3);
    $('n_n0_si').textContent = fmt(n0_SI);
    $('n0_msg').textContent = '';
  }
}

$('n_e').addEventListener('input', () => {
  const e = num($('n_e'));
  $('n_lambda').value = e ? fmt(evToNm(e)) : '';
  recomputeN0('forward');
});
$('n_lambda').addEventListener('input', () => {
  const l = num($('n_lambda'));
  $('n_e').value = l ? fmt(nmToEv(l)) : '';
  recomputeN0('forward');
});
for (const id of ['n_h', 'n_w', 'n_q', 'n_theta', 'n_alpha', 'n_eta', 'n_s2', 'f_tc']) {
  $(id).addEventListener('input', () => recomputeN0('forward'));
}
$('n_n0_ev').addEventListener('input', () => recomputeN0('inverse'));

/* ---- Presets ----------------------------------------------------------- */

for (const p of PRESETS) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'preset-btn';
  btn.innerHTML = `${p.name}<small>${p.source}</small>`;
  btn.addEventListener('click', () => {
    // Solve the consistent state from the measured values, then prefill holding the intrinsic
    // material properties (Tc, ρ, gap) and the thickness — so changing t recomputes L□, not ρ.
    const solved = solveTop({
      tc_mK: p.tc_mK, rho: p.rho_uohmcm, rs: p.rs_ohm_sq, t_nm: p.t_nm, lsq: p.lsq_pH,
      gap: p.solve_gap ? null : undefined,
    });
    loadFields({
      tc_mK: solved.tc_mK, rho: solved.rho, t_nm: solved.t_nm,
      gap: Number.isFinite(solved.gap) ? solved.gap : undefined,
    });
    if (p.n0_prefill) loadN0Prefill(p.n0_prefill);
    const where = solved.t_nm != null ? 'change thickness to update L□' : 'enter a thickness to get L□';
    $('impedance_msg').textContent = p.solve_gap
      ? `Loaded ${p.name}. Gap ratio Δ/(k_B·Tc)=${fmt(solved.gap)} solved from the measured values; ${where}.`
      : `Loaded ${p.name}. Holding ρ=${fmt(solved.rho)} µΩ·cm; ${where}.`;
  });
  $('presetList').appendChild(btn);
}

/* ---- Panel 3: periodic table ------------------------------------------ */

let selectedCell = null;
renderPeriodicTable($('ptableContainer'), (symbol, data) => {
  loadFields({ tc_mK: data.tc_mK, rho: data.rho_uohmcm });
  const rhoTxt = data.rho_uohmcm != null ? `${data.rho_uohmcm} µΩ·cm` : 'ρ unavailable';
  $('element_msg').textContent =
    `${symbol}: Tc ${data.tc_mK} mK, ${rhoTxt} (${data.kind}; ${data.source}). Enter a thickness for L□.`;
  if (selectedCell) selectedCell.classList.remove('selected');
  for (const c of $('ptableContainer').querySelectorAll('.pcell.super')) {
    if (c.querySelector('.psym').textContent === symbol) { c.classList.add('selected'); selectedCell = c; }
  }
});

recomputeN0('forward');                  // show the initial hint message
