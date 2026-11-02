import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeN0, predictTheta2, mattisBardeenS2, pulsePeakAmplitude, linearizedPhase, loopPhase,
  n0ToEvUm3, diffusionConstant_m2s, coherenceLength_m,
} from '../js/n0.js';
import { gap_J } from '../js/superconductor.js';

const close = (a, b, rel = 1e-9) =>
  assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} ≈ ${b}`);

const HFTA_DELTA = gap_J(0.80, 1.683);
const PTSI_DELTA = gap_J(0.93, 1.764);

// A 1 eV photon in a HfTa inductor, with MKIDopt's reference numbers below.
const base = { e_eV: 1.0, volume_um3: 66.0, q: 2e4, alpha_k: 0.8, gamma: 1, eta_pb: 0.59, s2: 1.0, delta_J: HFTA_DELTA };

test('predictTheta2 matches MKIDopt η₀·α_k·Q·E/V (no factor of 4)', () => {
  // mkidopt.resonator.compute_responsivity_from_N0(1.54e47, Δ, 0.59, 1.0) × 0.8 × 2e4 / 66 × 1 eV
  close(predictTheta2({ ...base, n0_SI: 1.54e47 }), 0.43062868968606477, 1e-12);
});

test('a thick film responds less: θ₂ scales with γ', () => {
  const thin = predictTheta2({ ...base, n0_SI: 1.54e47 });
  close(predictTheta2({ ...base, gamma: 0.5, n0_SI: 1.54e47 }), thin / 2, 1e-12);
});

test('computeN0 inverts predictTheta2', () => {
  const theta2 = predictTheta2({ ...base, n0_SI: 1.54e47 });
  close(computeN0({ ...base, theta2_rad: theta2 }), 1.54e47, 1e-12);
});

test('n0ToEvUm3: PtSi 1.5523e47 J⁻¹m⁻³ is 2.487e10 eV⁻¹µm⁻³', () => {
  close(n0ToEvUm3(1.5523e47), 2.487e10, 1e-3);
});

test('mattisBardeenS2 matches scipy (MKIDopt) in both series branches', () => {
  close(mattisBardeenS2(HFTA_DELTA, 0.010, 3.80104140032e9), 2.2409043365, 1e-9);   // ξ ≈ 9
  close(mattisBardeenS2(HFTA_DELTA, 0.0047, 3.80104140032e9), 2.2310852951675626, 1e-12); // ξ ≈ 19.4
  close(mattisBardeenS2(HFTA_DELTA, 0.0042, 3.80104140032e9), 2.230197378020055, 1e-12);  // ξ ≈ 21.7
  close(mattisBardeenS2(PTSI_DELTA, 0.100, 5.674489e9), 2.2587483960, 1e-9);        // ξ ≈ 1.4
});

test('mattisBardeenS2 flattens to 1 + √(2Δ/(π²ħω)) as T → 0, not to 1', () => {
  close(mattisBardeenS2(PTSI_DELTA, 1e-6, 5.674489e9), 2.1048571673084364, 1e-6);
});

test('pulsePeakAmplitude matches MKIDopt and stays finite for a slow rise', () => {
  close(pulsePeakAmplitude(45e-6, 1.97e-6), 0.8338624966, 1e-9);
  close(pulsePeakAmplitude(46.32e-6, 19343 / (Math.PI * 5.674489e9)), 0.8943721037, 1e-9);
  close(pulsePeakAmplitude(1e-6, 1e10), 1e-16 / Math.E, 1e-6);    // r → 0: h_max → r/e
});

test('a 90° loop phase linearizes to θ₂ = 2 rad and back', () => {
  close(linearizedPhase(Math.PI / 2), 2, 1e-12);
  close(loopPhase(2), Math.PI / 2, 1e-12);
});

test('D and ξ reproduce the MKIDopt HfTa and PtSi cross-checks', () => {
  const D_hfta = diffusionConstant_m2s(1.54e47, 85.25e-8);
  close(D_hfta * 1e4, 1.5, 0.05);                                  // 1.5 cm²/s
  close(coherenceLength_m(D_hfta, HFTA_DELTA) * 1e9, 29, 0.03);     // 29 nm
  const D_ptsi = diffusionConstant_m2s(1.5523e47, 33.697e-8);
  close(D_ptsi * 1e4, 3.72, 0.01);
  close(coherenceLength_m(D_ptsi, PTSI_DELTA) * 1e9, 42, 0.03);
});

test('computeN0 rejects non-positive θ, Q, volume, and gap', () => {
  assert.throws(() => computeN0({ ...base, theta2_rad: 0 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta2_rad: -0.05 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta2_rad: 0.05, q: 0 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta2_rad: 0.05, volume_um3: 0 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta2_rad: 0.05, delta_J: -1 }), RangeError);
});

test('predictTheta2 rejects non-positive N0', () => {
  assert.throws(() => predictTheta2({ ...base, n0_SI: 0 }), RangeError);
  assert.throws(() => predictTheta2({ ...base, n0_SI: -1e46 }), RangeError);
});
