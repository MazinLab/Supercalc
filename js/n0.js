/**
 * Single-spin density of states N0 from a measured single-photon resonator response.
 * Inverts the Mazin Lab MKIDopt phase-responsivity relation:
 *   N0 = η_pb·α_k·S2·Q·E / (4·Δ²·V·θ)        [J⁻¹ m⁻³]
 * where E = photon energy [J], V = inductor volume [m³], θ = phase pulse height [rad].
 */

import { E_CHARGE, GAP_RATIO } from './constants.js';
import { gap_J } from './superconductor.js';

// Inductor volume [m³] from height/width [µm] and thickness [nm].
const volume_m3 = (h_um, w_um, t_nm) => h_um * w_um * (t_nm / 1000) * 1e-18;

// Guard: every listed quantity must be a strictly positive finite number.
const assertPositive = (entries) => {
  for (const [name, v] of entries) {
    if (!(typeof v === 'number' && Number.isFinite(v) && v > 0)) {
      throw new RangeError(`${name} must be a positive number, got ${v}`);
    }
  }
};

/**
 * @param {object} p  e_eV, h_um, w_um, t_nm, q, theta_rad, alpha_k, tc_mK; optional eta_pb, s2.
 * @returns {{n0_SI:number, n0_eVum3:number}} N0 in J⁻¹m⁻³ and eV⁻¹µm⁻³.
 */
export function computeN0({ e_eV, h_um, w_um, t_nm, q, theta_rad, alpha_k, eta_pb = 0.57, s2 = 1.0, tc_mK, gapRatio = GAP_RATIO }) {
  assertPositive([
    ['e_eV', e_eV], ['h_um', h_um], ['w_um', w_um], ['t_nm', t_nm], ['q', q],
    ['theta_rad', theta_rad], ['alpha_k', alpha_k], ['eta_pb', eta_pb], ['s2', s2],
    ['tc_mK', tc_mK], ['gapRatio', gapRatio],
  ]);
  const E = e_eV * E_CHARGE;
  const V = volume_m3(h_um, w_um, t_nm);
  const delta = gap_J(tc_mK / 1000, gapRatio);
  const n0_SI = (eta_pb * alpha_k * s2 * q * E) / (4 * delta * delta * V * theta_rad);
  const n0_eVum3 = n0_SI * E_CHARGE * 1e-18;   // J⁻¹m⁻³ → eV⁻¹µm⁻³
  return { n0_SI, n0_eVum3 };
}

/**
 * Predicted phase pulse height [rad] for a given N0 [J⁻¹m⁻³].
 * @param {object} p  n0_SI, e_eV, h_um, w_um, t_nm, q, alpha_k, tc_mK; optional eta_pb, s2.
 */
export function predictTheta({ n0_SI, e_eV, h_um, w_um, t_nm, q, alpha_k, eta_pb = 0.57, s2 = 1.0, tc_mK, gapRatio = GAP_RATIO }) {
  assertPositive([
    ['n0_SI', n0_SI], ['e_eV', e_eV], ['h_um', h_um], ['w_um', w_um], ['t_nm', t_nm], ['q', q],
    ['alpha_k', alpha_k], ['eta_pb', eta_pb], ['s2', s2], ['tc_mK', tc_mK], ['gapRatio', gapRatio],
  ]);
  const E = e_eV * E_CHARGE;
  const V = volume_m3(h_um, w_um, t_nm);
  const delta = gap_J(tc_mK / 1000, gapRatio);
  return (eta_pb * alpha_k * s2 * q * E) / (4 * delta * delta * V * n0_SI);
}
