/**
 * Film electrodynamics for the surface-impedance panel, as in MKIDopt's ThinFilm
 * (mkidopt/materials.py; Zmuidzinas 2012). The dirty-limit penetration depth and the sheet
 * inductance of a film of any thickness t are
 *   λ = √(ħρ/(πμ₀Δ)),   Δ = gap·k_B·Tc,
 *   L□ = (μ₀λ/2)·coth(t/2λ),
 * which reduces to ħR□/(πΔ) for t ≪ λ and to μ₀λ/2 for t ≫ λ. Pure functions; the UI
 * handles unit display.
 */

import { HBAR, K_B, MU_0, E_CHARGE, GAP_RATIO } from './constants.js';

/** Thrown when entered values contradict each other or admit no physical film. */
export class InconsistentInputError extends Error {}

/** Superconducting gap [J] from Tc [K] and gap ratio Δ/(k_B·Tc). */
export const gap_J = (tc_K, gapRatio = GAP_RATIO) => gapRatio * K_B * tc_K;

/** Dirty-limit penetration depth [m] from resistivity [Ω·m] and gap [J]. */
export const penetrationDepth_m = (rho_ohm_m, delta_J) =>
  Math.sqrt(HBAR * rho_ohm_m / (Math.PI * MU_0 * delta_J));

/** Sheet inductance [H/sq] of a film of thickness t [m] and penetration depth λ [m]. */
export const sheetInductance_H = (lambda_m, t_m) =>
  MU_0 * lambda_m / (2 * Math.tanh(t_m / (2 * lambda_m)));

// Root of a monotonic f on [lo, hi] (lo, hi > 0) by bisection in log space.
function bisectLog(f, lo, hi) {
  const sign_lo = Math.sign(f(lo));
  while (hi / lo > 1 + 1e-14) {
    const mid = Math.sqrt(lo * hi);
    if (Math.sign(f(mid)) === sign_lo) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

// λ from L□ and t. With u = t/2λ, L□ = (μ₀t/4)·coth(u)/u, and coth(u)/u falls monotonically
// from ∞ to 0, so every L□ > 0 has exactly one λ.
function lambdaFromSheetInductance(L_H, t_m) {
  const target = 4 * L_H / (MU_0 * t_m);
  const u = bisectLog((u) => 1 / (u * Math.tanh(u)) - target, 1e-12, 1e12);
  return t_m / (2 * u);
}

// t from L□ and λ: coth(t/2λ) = 2L□/(μ₀λ). A film can never go below the thick-film μ₀λ/2.
function thicknessFromSheetInductance(L_H, lambda_m) {
  const thickLimit_H = MU_0 * lambda_m / 2;
  if (L_H <= thickLimit_H) {
    throw new InconsistentInputError(
      `L□ ${L_H * 1e12} pH/sq is at or below the thick-film limit μ₀λ/2 = ${thickLimit_H * 1e12} pH/sq`);
  }
  return 2 * lambda_m * Math.atanh(thickLimit_H / L_H);
}

/**
 * Response of the sheet inductance to the superfluid conductivity,
 * γ = −dln L□/dln σ₂ = ½·[1 + (t/λ)/sinh(t/λ)], from λ ∝ σ₂^(−1/2): 1 for t ≪ λ and ½ for
 * t ≫ λ (the thin-film and local limits of Zmuidzinas 2012 Eq. 13).
 */
export function responseGamma(t_m, lambda_m) {
  const x = t_m / lambda_m;
  return 0.5 * (1 + x / Math.sinh(x));
}

// Entered field → [SI variable, SI value of one display unit].
const INPUTS = {
  tc_mK: ['tc', 1e-3], gap: ['gap', 1], rho: ['rho', 1e-8], rs: ['rs', 1], t_nm: ['t', 1e-9],
  lsq: ['L', 1e-12],
};
const OUTPUTS = { ...INPUTS, lambda_nm: ['lambda', 1e-9], delta_ueV: ['delta', E_CHARGE * 1e-6] };

// Four relations link eight variables:
//   Δ = gap·k_B·Tc,  R□ = ρ/t,  λ² = ħρ/(πμ₀Δ),  L□ = (μ₀λ/2)·coth(t/2λ).
// Each maps every variable of the relation to its solution from the others; the first entry
// is the forward formula, the well-conditioned one used to check a fully known relation.
const RELATIONS = [
  {
    delta: (s) => s.gap * K_B * s.tc,
    gap: (s) => s.delta / (K_B * s.tc),
    tc: (s) => s.delta / (K_B * s.gap),
  },
  {
    rs: (s) => s.rho / s.t,
    rho: (s) => s.rs * s.t,
    t: (s) => s.rho / s.rs,
  },
  {
    lambda: (s) => penetrationDepth_m(s.rho, s.delta),
    rho: (s) => Math.PI * MU_0 * s.delta * s.lambda ** 2 / HBAR,
    delta: (s) => HBAR * s.rho / (Math.PI * MU_0 * s.lambda ** 2),
  },
  {
    L: (s) => sheetInductance_H(s.lambda, s.t),
    lambda: (s) => lambdaFromSheetInductance(s.L, s.t),
    t: (s) => thicknessFromSheetInductance(s.L, s.lambda),
  },
];

// Display rounds to 6 significant figures, so a re-entered value can be off by 5e-6, and the
// relations raise relative errors to at most the second power.
const TOL = 1e-4;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function assertConsistent(name, have, derived) {
  if (Math.abs(have - derived) > TOL * Math.abs(derived)) {
    throw new InconsistentInputError(`inconsistent input for ${name}: have ${have}, derived ${derived}`);
  }
}

/**
 * Constraint-propagate the linked film quantities through the four relations above.
 * R□, L□, and Δ alone fix t only through the excess of L□ over its thin-film limit
 * ħR□/(πΔ), which is second order in t/λ; t, ρ, and λ stay unsolved there rather than
 * amplify rounding, but L□ is still checked against that lower bound.
 * @param {{tc_mK?:number, rho?:number, rs?:number, t_nm?:number, lsq?:number, gap?:number|null}} state
 *        tc_mK in mK, rho in µΩ·cm, rs in Ω/sq, t_nm in nm, lsq in pH/sq.
 *        gap = Δ/(k_B·Tc): a number fixes it, null marks it solvable, omitted means BCS.
 * @returns the state in the same units with every derivable field filled in, plus
 *          lambda_nm (penetration depth) and delta_ueV (gap energy) when they follow.
 * @throws {RangeError} if an entered value is not a positive number.
 * @throws {InconsistentInputError} if the entered values contradict each other.
 */
export function solveTop(state) {
  const entered = { ...state, gap: state.gap === undefined ? GAP_RATIO : state.gap };
  const s = {};
  for (const [field, [key, unit]] of Object.entries(INPUTS)) {
    const v = entered[field];
    if (v == null) continue;
    if (!(isNum(v) && v > 0)) throw new RangeError(`${field} must be a positive number, got ${v}`);
    s[key] = v * unit;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const relation of RELATIONS) {
      const unknown = Object.keys(relation).filter((k) => !(k in s));
      if (unknown.length === 1) { s[unknown[0]] = relation[unknown[0]](s); changed = true; }
    }
  }
  for (const relation of RELATIONS) {
    const [key, forward] = Object.entries(relation)[0];
    if (Object.keys(relation).every((k) => k in s)) assertConsistent(key, s[key], forward(s));
  }
  if ('rs' in s && 'delta' in s && 'L' in s) {
    const thinLimit_H = HBAR * s.rs / (Math.PI * s.delta);
    if (s.L < thinLimit_H * (1 - TOL)) {
      throw new InconsistentInputError(
        `L□ ${s.L * 1e12} pH/sq is below the thin-film limit ħR□/(πΔ) = ${thinLimit_H * 1e12} pH/sq`);
    }
  }

  const out = {};
  for (const [field, [key, unit]] of Object.entries(OUTPUTS)) {
    if (key in s) out[field] = s[key] / unit;
  }
  return out;
}
