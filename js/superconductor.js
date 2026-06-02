/**
 * Surface-impedance physics for the top panel — Zmuidzinas 2012, Eq. 8 (thin-film limit):
 *   Ls = ħ·Rs / (π·Δ),   Δ = GAP_RATIO·k_B·Tc,   Rs = 10·ρ[µΩcm]/t[nm].
 * All formulas are pure; the UI handles unit display.
 */

import { HBAR, K_B, GAP_RATIO } from './constants.js';

/** Superconducting gap [J] from Tc [K] and gap ratio Δ/(k_B·Tc). */
export const gap_J = (tc_K, gapRatio = GAP_RATIO) => gapRatio * K_B * tc_K;

/** Normal-state sheet resistance [Ω/sq] from resistivity [µΩ·cm] and thickness [nm]. */
export const sheetResistance = (rho_uohmcm, t_nm) => 10 * rho_uohmcm / t_nm;

/** Resistivity [µΩ·cm] from sheet resistance [Ω/sq] and thickness [nm]. */
export const resistivityFromRs = (rs_ohm_sq, t_nm) => rs_ohm_sq * t_nm / 10;

/** Sheet kinetic inductance [pH/sq] from sheet resistance [Ω/sq], Tc [K], gap ratio. */
export const sheetInductance_pH = (rs_ohm_sq, tc_K, gapRatio = GAP_RATIO) =>
  HBAR * rs_ohm_sq / (Math.PI * gap_J(tc_K, gapRatio)) * 1e12;

// Gap-independent prefactor: Lsq[pH/sq] = K0 · Rs[Ω/sq] / (gapRatio · Tc[mK])  (≈ 2431.6).
const K0_MK = (HBAR * 1e15) / (Math.PI * K_B);

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Constraint-propagate the linked film quantities over two equations:
 *   Rs = 10·ρ/t  and  Lsq = K0·Rs / (gap·Tc),  gap = Δ/(k_B·Tc).
 * @param {{tc_mK?:number, rho?:number, rs?:number, t_nm?:number, lsq?:number, gap?:number|null}} state
 *        rho in µΩ·cm, rs in Ω/sq, t_nm in nm, lsq in pH/sq, tc_mK in mK.
 *        gap: a finite number fixes it; explicit `null` marks it solvable (computed from the
 *        other three of {Lsq, Rs, Tc}); omitted defaults to the BCS ratio.
 * @returns the state with every derivable field filled in.
 * @throws if a provided value contradicts one derived from the others.
 */
export function solveTop(state) {
  const s = { ...state };
  // Physical quantities must be strictly positive; reject nonsensical inputs up front.
  for (const k of ['tc_mK', 'rho', 'rs', 't_nm', 'lsq']) {
    if (s[k] != null && !(Number.isFinite(s[k]) && s[k] > 0)) {
      throw new RangeError(`${k} must be a positive number, got ${s[k]}`);
    }
  }
  if (s.gap === null) delete s.gap;          // explicit null → solve for it
  else if (!isNum(s.gap)) s.gap = GAP_RATIO; // omitted → BCS default
  else if (s.gap <= 0) throw new RangeError(`gap must be a positive number, got ${s.gap}`);

  const TOL = 1e-6;
  const set = (k, v) => {
    if (!Number.isFinite(v)) return false;
    if (isNum(s[k])) {
      if (Math.abs(s[k] - v) > TOL * Math.max(1, Math.abs(v))) {
        throw new Error(`inconsistent input for ${k}: have ${s[k]}, derived ${v}`);
      }
      return false;
    }
    s[k] = v;
    return true;
  };

  let changed = true;
  while (changed) {
    changed = false;
    // Eq A: Rs = 10·ρ/t
    if (isNum(s.rho) && isNum(s.t_nm)) changed = set('rs', 10 * s.rho / s.t_nm) || changed;
    if (isNum(s.rs) && isNum(s.t_nm)) changed = set('rho', s.rs * s.t_nm / 10) || changed;
    if (isNum(s.rs) && isNum(s.rho) && s.rs !== 0) changed = set('t_nm', 10 * s.rho / s.rs) || changed;
    // Eq B: Lsq = K0·Rs / (gap·Tc)
    if (isNum(s.rs) && isNum(s.gap) && isNum(s.tc_mK)) changed = set('lsq', K0_MK * s.rs / (s.gap * s.tc_mK)) || changed;
    if (isNum(s.lsq) && isNum(s.gap) && isNum(s.tc_mK)) changed = set('rs', s.lsq * s.gap * s.tc_mK / K0_MK) || changed;
    if (isNum(s.lsq) && isNum(s.rs) && isNum(s.tc_mK) && s.lsq !== 0) changed = set('gap', K0_MK * s.rs / (s.lsq * s.tc_mK)) || changed;
    if (isNum(s.lsq) && isNum(s.rs) && isNum(s.gap) && s.lsq !== 0) changed = set('tc_mK', K0_MK * s.rs / (s.lsq * s.gap)) || changed;
  }
  return s;
}
