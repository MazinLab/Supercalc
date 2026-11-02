/**
 * Single-spin density of states N₀ from a measured single-photon phase pulse, following
 * MKIDopt's responsivity chain (mkidopt/resonator.py; Zmuidzinas 2012 Eqs. 64–72; Gao 2008
 * thesis Eqs. 2.96–2.99):
 *   δn_qp = η_pb·E/(Δ·V),   δσ₂/σ₂ = −S₂·δn_qp/(2N₀Δ),   δx = (α_k·γ/2)·|δσ₂/σ₂|,   θ₂ = 4Q·δx,
 * so the linearized phase amplitude obeys θ₂·N₀ = γ·η_pb·S₂·α_k·Q·E/(Δ²·V). MKIDopt takes the
 * thin-film γ = 1; responseGamma in superconductor.js gives γ for any thickness.
 * θ₂ is the exponential amplitude of the pulse in MKIDopt's linearized loop-center phase
 * (Zobrist et al. 2021, JATIS 7, 010501); the helpers below convert a measured loop phase
 * and pulse peak to it.
 */

import { HBAR, K_B, E_CHARGE } from './constants.js';

/** Pair-breaking efficiency adopted by Zobrist et al. 2022 (PRL 129, 017701) and MKIDopt. */
export const ETA_PB = 0.59;

const assertPositive = (entries) => {
  for (const [name, v] of Object.entries(entries)) {
    if (!(typeof v === 'number' && Number.isFinite(v) && v > 0)) {
      throw new RangeError(`${name} must be a positive number, got ${v}`);
    }
  }
};

// e^{−x}·I₀(x) for x ≥ 0: power series below 20, asymptotic series above, both to ~1e-15.
function besselI0e(x) {
  let term = 1, sum = 1;
  if (x < 20) {
    for (let k = 1; term > 1e-17 * sum; k++) { term *= (x / (2 * k)) ** 2; sum += term; }
    return sum * Math.exp(-x);
  }
  for (let k = 1; k <= 30; k++) { term *= (2 * k - 1) ** 2 / (8 * k * x); sum += term; }
  return sum / Math.sqrt(2 * Math.PI * x);
}

/**
 * Thermal Mattis–Bardeen factor S₂(ω, T) = 1 + √(2Δ/(πk_BT))·e^{−ξ}·I₀(ξ), ξ = ħω/(2k_BT),
 * valid for k_BT, ħω ≪ Δ (Zmuidzinas 2012 Eq. 72). MKIDopt evaluates it at the bath
 * temperature; below about f₀·h/k_B it flattens to 1 + √(2Δ/(π²ħω)), not to 1.
 * @param {number} delta_J  gap Δ [J]
 * @param {number} T_K      bath temperature [K]
 * @param {number} f_hz     resonance frequency [Hz]
 */
export function mattisBardeenS2(delta_J, T_K, f_hz) {
  assertPositive({ delta_J, T_K, f_hz });
  const kT = K_B * T_K;
  const xi = HBAR * 2 * Math.PI * f_hz / (2 * kT);
  return 1 + Math.sqrt(2 * delta_J / (Math.PI * kT)) * besselI0e(xi);
}

/**
 * Peak h_max of the unit-amplitude pulse h(t) = (1 − e^{−t/τ_rise})·e^{−t/τ_qp}, so the
 * observed peak is h_max times the exponential amplitude (MKIDopt pulse_peak_amplitude).
 * The resonator ring-up gives τ_rise = Q/(π·f₀).
 * @param {number} tau_qp_s    quasiparticle decay time [s]
 * @param {number} tau_rise_s  rise time [s]
 */
export function pulsePeakAmplitude(tau_qp_s, tau_rise_s) {
  assertPositive({ tau_qp_s, tau_rise_s });
  // The peak sits at t* = τ_rise·ln(1 + r), r = τ_qp/τ_rise, where h(t*) = r/(1+r)·(1+r)^(−1/r).
  const r = tau_qp_s / tau_rise_s;
  return r / (1 + r) * Math.exp(-Math.log1p(r) / r);
}

/**
 * Linearized phase θ₂ = 2·tan(θ₁/2) [rad] from the loop-center phase θ₁ [rad], for a tone on
 * resonance and a pulse that shifts the frequency without changing the dissipation.
 */
export const linearizedPhase = (theta1_rad) => 2 * Math.tan(theta1_rad / 2);

/** Loop-center phase θ₁ = 2·arctan(θ₂/2) [rad], which saturates at π. */
export const loopPhase = (theta2_rad) => 2 * Math.atan(theta2_rad / 2);

/**
 * θ₂·N₀ = γ·η_pb·S₂·α_k·Q·E/(Δ²·V)  [rad·J⁻¹·m⁻³].
 * @param {{e_eV:number, volume_um3:number, q:number, alpha_k:number, gamma:number, eta_pb:number, s2:number, delta_J:number}} p
 *        photon energy [eV], active inductor volume [µm³], loaded Q, kinetic-inductance
 *        fraction of the total inductance, thickness response γ, pair-breaking efficiency,
 *        Mattis–Bardeen S₂, gap [J].
 */
function thetaN0Product({ e_eV, volume_um3, q, alpha_k, gamma, eta_pb, s2, delta_J }) {
  assertPositive({ e_eV, volume_um3, q, alpha_k, gamma, eta_pb, s2, delta_J });
  return gamma * eta_pb * s2 * alpha_k * q * e_eV * E_CHARGE / (delta_J ** 2 * volume_um3 * 1e-18);
}

/** N₀ [J⁻¹·m⁻³] from the linearized phase amplitude `theta2_rad` plus the thetaN0Product inputs. */
export function computeN0(p) {
  assertPositive({ theta2_rad: p.theta2_rad });
  return thetaN0Product(p) / p.theta2_rad;
}

/** Linearized phase amplitude θ₂ [rad] from `n0_SI` [J⁻¹·m⁻³] plus the thetaN0Product inputs. */
export function predictTheta2(p) {
  assertPositive({ n0_SI: p.n0_SI });
  return thetaN0Product(p) / p.n0_SI;
}

/** N₀ in eV⁻¹·µm⁻³ from J⁻¹·m⁻³. */
export const n0ToEvUm3 = (n0_SI) => n0_SI * E_CHARGE * 1e-18;

/** Normal-state diffusion constant D = 1/(2e²N₀ρ) [m²/s] (σ_n = 2e²N₀D, single-spin N₀). */
export const diffusionConstant_m2s = (n0_SI, rho_ohm_m) => 1 / (2 * E_CHARGE ** 2 * n0_SI * rho_ohm_m);

/** Dirty-limit coherence length ξ = √(ħD/Δ) [m]. */
export const coherenceLength_m = (D_m2s, delta_J) => Math.sqrt(HBAR * D_m2s / delta_J);
