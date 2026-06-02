import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeN0, predictTheta } from '../js/n0.js';

const close = (a, b, rel = 1e-9) =>
  assert.ok(Math.abs(a - b) <= rel * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

// A representative inductor + photon for round-trip checks.
const base = {
  e_eV: 1.0, h_um: 20, w_um: 1, t_nm: 60, q: 1e5,
  alpha_k: 0.8, eta_pb: 0.57, s2: 1.0, tc_mK: 410,
};

test('computeN0 then predictTheta recovers the input pulse height', () => {
  const theta_in = 0.05;                                  // rad
  const { n0_SI } = computeN0({ ...base, theta_rad: theta_in });
  const theta_out = predictTheta({ ...base, n0_SI });
  close(theta_out, theta_in, 1e-9);
});

test('computeN0 reports both SI and eV⁻¹µm⁻³ (factor 1.602e-37)', () => {
  const r = computeN0({ ...base, theta_rad: 0.05 });
  close(r.n0_eVum3, r.n0_SI * 1.602176634e-37, 1e-9);
});

test('predictTheta inverts a known SI N0 to a positive radian pulse', () => {
  const theta = predictTheta({ ...base, n0_SI: 6.93e46 });
  assert.ok(theta > 0 && Number.isFinite(theta));
});

test('N0 scales inversely with measured pulse height', () => {
  const a = computeN0({ ...base, theta_rad: 0.05 }).n0_SI;
  const b = computeN0({ ...base, theta_rad: 0.10 }).n0_SI;
  close(b, a / 2, 1e-9);
});

test('computeN0 scales as 1/gapRatio² (Δ ∝ gapRatio)', () => {
  const a = computeN0({ ...base, theta_rad: 0.05, gapRatio: 1.764 }).n0_SI;
  const b = computeN0({ ...base, theta_rad: 0.05, gapRatio: 3.528 }).n0_SI;
  close(b, a / 4, 1e-9);
});

test('computeN0 rejects non-positive θ, Q, volume, and Tc', () => {
  assert.throws(() => computeN0({ ...base, theta_rad: 0 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta_rad: -0.05 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta_rad: 0.05, q: 0 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta_rad: 0.05, h_um: 0 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta_rad: 0.05, w_um: -1 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta_rad: 0.05, t_nm: 0 }), RangeError);
  assert.throws(() => computeN0({ ...base, theta_rad: 0.05, tc_mK: -410 }), RangeError);
});

test('predictTheta rejects non-positive N0', () => {
  assert.throws(() => predictTheta({ ...base, n0_SI: 0 }), RangeError);
  assert.throws(() => predictTheta({ ...base, n0_SI: -1e46 }), RangeError);
});
