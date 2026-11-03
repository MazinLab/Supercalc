/**
 * DOM wiring for Supercalc. Imports pure physics + data; owns all unit conversions and DOM
 * access. The surface-impedance panel constraint-propagates from the user's most recent
 * edits; the N₀ panel holds whichever of θ and N₀ the user entered last and computes the
 * other; presets and the periodic table prefill panel 1.
 */

import { E_CHARGE, K_B, GAP_RATIO, nmToEv, evToNm } from './constants.js';
import { solveTop, responseGamma, InconsistentInputError } from './superconductor.js';
import {
  ETA_PB, mattisBardeenS2, pulsePeakAmplitude, linearizedPhase, loopPhase, computeN0, predictTheta2,
  n0ToEvUm3, diffusionConstant_m2s, coherenceLength_m,
} from './n0.js';
import { PRESETS } from './materials.js';
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
const show = (id, v) => { $(id).textContent = fmt(v) || '—'; };
const DEG_PER_RAD = 180 / Math.PI;

/* ---- Panel 1: surface impedance --------------------------------------- */

const IMP = { tc_mK: 'f_tc', rho: 'f_rho', rs: 'f_rs', t_nm: 'f_t', lsq: 'f_lsq' };
const IMP_KEYS = Object.keys(IMP);
const impEl = Object.fromEntries(IMP_KEYS.map((k) => [k, $(IMP[k])]));
let pinOrder = [];                       // user-set fields, most-recent first
let film = {};                           // latest panel-1 solution, read by the N₀ panel

function pin(key) {
  pinOrder = pinOrder.filter((k) => k !== key);
  if (impEl[key].value.trim() !== '') pinOrder.unshift(key);
}

function recomputeImpedance() {
  const gap = num($('f_gap'));           // empty or invalid → solve for it, shown as the placeholder
  let pins = pinOrder.slice();
  let warn = '';
  for (;;) {
    const known = { gap };
    for (const k of pins) { const v = num(impEl[k]); if (v != null) known[k] = v; }
    try { film = solveTop(known); break; }
    catch (err) {
      if (!(err instanceof InconsistentInputError) || !pins.length) throw err;
      warn = 'Inputs were over-determined or unphysical; using your most recent entries.';
      pins = pins.slice(0, -1);
    }
  }
  pinOrder = pins;                       // keep only the pins that actually solved
  for (const k of IMP_KEYS) {
    if (pins.includes(k)) continue;      // leave the still-pinned fields as entered
    impEl[k].value = fmt(film[k]);       // overwrite derived AND dropped fields with the solution
  }
  $('f_gap').placeholder = gap == null ? fmt(film.gap) : '';
  show('f_lambda', film.lambda_nm);
  show('f_delta', film.delta_ueV);
  $('impedance_msg').textContent = warn;
  recomputeN0();
}

for (const k of IMP_KEYS) {
  impEl[k].addEventListener('input', () => { pin(k); recomputeImpedance(); });
}
$('f_gap').addEventListener('input', recomputeImpedance);
$('clearImpedance').addEventListener('click', () => loadFields({}));

/** Prefill the linked fields; a missing gap resets to the BCS ratio. */
function loadFields({ tc_mK, rho, t_nm, gap }) {
  pinOrder = [];
  for (const k of IMP_KEYS) impEl[k].value = '';
  const provided = { tc_mK, rho, t_nm };
  for (const [k, v] of Object.entries(provided)) {
    if (v != null) { impEl[k].value = fmt(v); pin(k); }
  }
  $('f_gap').value = fmt(gap ?? GAP_RATIO);
  recomputeImpedance();
}

/* ---- Panel 2: N0 / pulse height --------------------------------------- */

let n0Driver = 'theta';                  // 'theta' computes N₀; 'n0' computes θ
let isPulseFromPreset = false;           // θ came from a preset's resonator, not the user

function recomputeN0() {
  const e_eV = num($('n_e')), area_um2 = num($('n_area')), q = num($('n_q'));
  const f0_GHz = num($('n_f0')), temp_mK = num($('n_temp')), tau_us = num($('n_tau'));
  const alpha_k = num($('n_alpha')), eta_pb = num($('n_eta'));
  const isTauBlank = $('n_tau').value.trim() === '';
  const delta_J = film.delta_ueV != null ? film.delta_ueV * E_CHARGE * 1e-6 : null;
  const volume_um3 = area_um2 != null && film.t_nm != null ? area_um2 * film.t_nm / 1000 : null;
  const gamma = film.t_nm != null && film.lambda_nm != null ? responseGamma(film.t_nm, film.lambda_nm) : null;
  // S₂ and a temperature-independent gap need k_BT ≪ Δ; stop at Tc/2 for a BCS gap.
  const isTooWarm = temp_mK != null && delta_J != null && K_B * temp_mK / 1000 >= delta_J / (2 * GAP_RATIO);
  const s2 = delta_J && temp_mK && f0_GHz && !isTooWarm
    ? mattisBardeenS2(delta_J, temp_mK / 1000, f0_GHz * 1e9) : null;
  // Without a decay time, θ is taken as the exponential amplitude itself (h_max = 1).
  const hmax = isTauBlank ? 1
    : tau_us && q && f0_GHz ? pulsePeakAmplitude(tau_us * 1e-6, q / (Math.PI * f0_GHz * 1e9)) : null;
  show('n_vol', volume_um3);
  show('n_s2', s2);
  show('n_gamma', gamma);
  show('n_hmax', hmax);

  const required = {
    'photon energy': e_eV, 'metal area': area_um2, Q: q, 'f₀': f0_GHz, 'bath temperature': temp_mK,
    'αₖ': alpha_k, 'ηₚᵦ': eta_pb, 'Tc and gap (panel 1)': delta_J, 'thickness (panel 1)': film.t_nm,
    'ρ or L□ (panel 1, for λ)': film.lambda_nm,
  };
  const missing = Object.keys(required).filter((k) => required[k] == null);
  const isLoop = $('n_theta_kind').value === 'loop';
  const outputId = n0Driver === 'theta' ? 'n_n0_ev' : 'n_theta';
  const p = { e_eV, volume_um3, q, alpha_k, gamma, eta_pb, s2, delta_J };
  const theta_deg = num($('n_theta')), n0_in_eV = num($('n_n0_ev'));
  const msg = missing.length ? `Enter ${missing.join(', ')} to relate θ and N₀.`
    : !isTauBlank && tau_us == null ? 'τqp must be positive, or blank to take θ as the amplitude.'
    : isTooWarm ? 'The bath must be well below Tc (under Tc/2): S₂ and the gap assume k_BT ≪ Δ.'
    : n0Driver === 'theta' && theta_deg == null ? 'Enter a phase pulse height θ to compute N₀.'
    : n0Driver === 'theta' && isLoop && theta_deg >= 180 ? 'A loop phase θ₁ cannot reach 180°.'
    : n0Driver === 'n0' && n0_in_eV == null ? 'Enter N₀ to predict the pulse height.'
    : '';
  $(outputId).value = '';
  let theta2 = null;
  if (!msg && n0Driver === 'theta') {
    const peak = theta_deg / DEG_PER_RAD;
    theta2 = (isLoop ? linearizedPhase(peak) : peak) / hmax;
    $('n_n0_ev').value = fmt(n0ToEvUm3(computeN0({ ...p, theta2_rad: theta2 })));
  } else if (!msg) {
    theta2 = predictTheta2({ ...p, n0_SI: n0_in_eV / n0ToEvUm3(1) });
    const peak = theta2 * hmax;
    $('n_theta').value = fmt((isLoop ? loopPhase(peak) : peak) * DEG_PER_RAD);
  }
  show('n_theta2', theta2 == null ? null : theta2 * DEG_PER_RAD);

  const n0_eV = num($('n_n0_ev'));
  const n0_SI = n0_eV == null ? null : n0_eV / n0ToEvUm3(1);
  const D_m2s = n0_SI && film.rho ? diffusionConstant_m2s(n0_SI, film.rho * 1e-8) : null;
  show('n_n0_si', n0_SI);
  show('n_diff', D_m2s && D_m2s * 1e4);
  show('n_xi', D_m2s && delta_J ? coherenceLength_m(D_m2s, delta_J) * 1e9 : null);
  $('n0_msg').textContent = msg;
}

$('n_e').addEventListener('input', () => {
  const e = num($('n_e'));
  $('n_lambda').value = e ? fmt(evToNm(e)) : '';
  recomputeN0();
});
$('n_lambda').addEventListener('input', () => {
  const l = num($('n_lambda'));
  $('n_e').value = l ? fmt(nmToEv(l)) : '';
  recomputeN0();
});
$('n_theta').addEventListener('input', () => { n0Driver = 'theta'; isPulseFromPreset = false; recomputeN0(); });
$('n_n0_ev').addEventListener('input', () => { n0Driver = 'n0'; isPulseFromPreset = false; recomputeN0(); });
for (const id of ['n_area', 'n_q', 'n_f0', 'n_temp', 'n_tau', 'n_alpha', 'n_eta']) {
  $(id).addEventListener('input', recomputeN0);
}
$('n_theta_kind').addEventListener('change', recomputeN0);

/**
 * Prefill the N₀ panel with a preset's paper resonator and photon pulse. A material without
 * one clears a pulse or N₀ that belonged to the previous material; a θ the user typed stays.
 */
function loadPhoton(photon) {
  if (photon) {
    const fields = {
      n_e: photon.e_eV, n_lambda: evToNm(photon.e_eV), n_area: photon.area_um2, n_q: photon.q,
      n_f0: photon.f0_GHz, n_temp: photon.temp_mK, n_tau: photon.tau_us, n_alpha: photon.alpha_k,
      n_eta: photon.eta_pb, n_theta: photon.theta2_peak_deg,
    };
    for (const [id, v] of Object.entries(fields)) $(id).value = fmt(v);
    $('n_theta_kind').value = 'linear';
    n0Driver = 'theta';
    isPulseFromPreset = true;
  } else if (isPulseFromPreset || n0Driver === 'n0') {
    $('n_theta').value = '';
    $('n_n0_ev').value = '';
    n0Driver = 'theta';
    isPulseFromPreset = false;
  }
  recomputeN0();
}

/* ---- Presets ----------------------------------------------------------- */

for (const p of PRESETS) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'preset-btn';
  btn.innerHTML = `${p.name}<small>${p.source}</small>`;
  btn.addEventListener('click', () => {
    // Hold the intrinsic material properties (Tc, ρ, gap) and the thickness, so changing t
    // recomputes L□, not ρ.
    loadFields({ tc_mK: p.tc_mK, rho: p.rho_uohmcm, t_nm: p.t_nm, gap: p.gap_ratio });
    loadPhoton(p.photon);
    const where = p.t_nm != null ? 'change thickness to update L□' : 'enter a thickness to get L□';
    const n0Note = p.photon
      ? ` Its paper resonator and a ${fmt(p.photon.e_eV)} eV photon fill the N₀ panel.` : '';
    $('impedance_msg').textContent =
      `Loaded ${p.name}. Holding ρ = ${fmt(p.rho_uohmcm)} µΩ·cm; ${where}.${n0Note}`;
  });
  $('presetList').appendChild(btn);
}

/* ---- Panel 3: periodic table ------------------------------------------ */

let selectedCell = null;
renderPeriodicTable($('ptableContainer'), (symbol, data) => {
  loadFields({ tc_mK: data.tc_mK, rho: data.rho_uohmcm });
  loadPhoton(null);
  const rhoTxt = data.rho_uohmcm != null
    ? `ρ ${data.rho_uohmcm} µΩ·cm`
    : 'no low-temperature film ρ stored, so enter your film\'s';
  $('element_msg').textContent =
    `${symbol}: Tc ${data.tc_mK} mK, ${rhoTxt} (${data.kind}; ${data.source}). Enter a thickness for L□.`;
  if (selectedCell) selectedCell.classList.remove('selected');
  for (const c of $('ptableContainer').querySelectorAll('.pcell.super')) {
    if (c.querySelector('.psym').textContent === symbol) { c.classList.add('selected'); selectedCell = c; }
  }
});

$('n_eta').value = String(ETA_PB);
recomputeImpedance();                    // show the initial readouts and hint message
