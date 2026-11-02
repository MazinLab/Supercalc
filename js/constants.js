/**
 * Physical constants (SI) and unit conversions for the superconducting calculator.
 * Values match the Mazin Lab MKIDopt model (mkidopt/materials.py).
 */

export const K_B = 1.380649e-23;        // Boltzmann constant [J/K]
export const HBAR = 1.054571817e-34;    // reduced Planck constant [J·s]
export const H_PLANCK = 6.62607015e-34; // Planck constant [J·s]
export const E_CHARGE = 1.602176634e-19;// elementary charge [C]; also Joules per eV
export const MU_0 = 1.2566370614359173e-6; // vacuum permeability [H/m] (4π × 1e-7)

// BCS weak-coupling gap ratio Δ/(k_B·Tc), the default for films without a measured gap.
export const GAP_RATIO = 1.764;

// Photon energy/wavelength: E[eV] = HC_EV_NM / λ[nm].
export const HC_EV_NM = 1239.8419843320026;

export const nmToEv = (lambda_nm) => HC_EV_NM / lambda_nm;
export const evToNm = (e_eV) => HC_EV_NM / e_eV;
