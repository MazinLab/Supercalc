/**
 * Physical constants (SI) and unit conversions for the superconducting calculator.
 * Values are standard SI, consistent with the Mazin Lab MKIDopt model.
 */

export const K_B = 1.380649e-23;        // Boltzmann constant [J/K]
export const HBAR = 1.054571817e-34;    // reduced Planck constant [J·s]
export const H_PLANCK = 6.62607015e-34; // Planck constant [J·s]
export const E_CHARGE = 1.602176634e-19;// elementary charge [C]; also Joules per eV

// Superconducting gap ratio Δ/(k_B·Tc). BCS weak-coupling value; held as one
// named constant so it can later be promoted to a user-editable field.
export const GAP_RATIO = 1.764;

// Photon energy/wavelength: E[eV] = HC_EV_NM / λ[nm].
export const HC_EV_NM = 1239.8;

export const eVtoJ = (e_eV) => e_eV * E_CHARGE;
export const nmToEv = (lambda_nm) => HC_EV_NM / lambda_nm;
export const evToNm = (e_eV) => HC_EV_NM / e_eV;
