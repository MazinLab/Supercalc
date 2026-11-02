import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gap_J, penetrationDepth_m, sheetInductance_H, responseGamma, solveTop, InconsistentInputError,
} from '../js/superconductor.js';
import { GAP_RATIO, K_B, HBAR, MU_0 } from '../js/constants.js';

const close = (a, b, rel = 1e-9) =>
  assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} ≈ ${b}`);

const NB = { tc_mK: 8550.88, rho: 5.810, t_nm: 125 };   // UCSB Nb: t/λ ≈ 1.4

test('gap_J is GAP_RATIO·k_B·Tc with Tc in K', () => {
  close(gap_J(0.41), GAP_RATIO * K_B * 0.41);
});

test('penetration depth is ≈ 105 nm·√(ρ[µΩcm]/Tc[K]) (Zmuidzinas 2012 Eq. 8)', () => {
  close(penetrationDepth_m(1e-8, gap_J(1.0)) * 1e9, 105, 0.01);
});

test('sheet inductance reduces to ħR□/(πΔ) for t ≪ λ and μ₀λ/2 for t ≫ λ', () => {
  const lambda = 1e-6, delta = gap_J(1.0);
  const rho = Math.PI * MU_0 * delta * lambda ** 2 / HBAR;
  close(sheetInductance_H(lambda, 1e-9), HBAR * (rho / 1e-9) / (Math.PI * delta), 1e-6);
  close(sheetInductance_H(lambda, 1e-4), MU_0 * lambda / 2, 1e-12);
});

test('responseGamma is 1 thin, ½ thick, and 0.860 for 125 nm Nb', () => {
  close(responseGamma(1e-9, 1e-6), 1, 1e-6);
  close(responseGamma(1e-3, 1e-7), 0.5, 1e-12);
  close(responseGamma(125e-9, 86.3277e-9), 0.860243, 1e-5);
});

test('solveTop matches MKIDopt ThinFilm for UCSB Nb, where the thin limit is 15% low', () => {
  const s = solveTop(NB);
  close(s.lsq, 0.087575, 1e-4);          // mkidopt ThinFilm.L_sq_pH; thin limit 0.074920
  close(s.lambda_nm, 86.328, 1e-4);
  close(s.rs, 0.4648, 1e-9);
});

test('solveTop matches MKIDopt ThinFilm for the HfTa preset at its measured gap', () => {
  const s = solveTop({ tc_mK: 800, rho: 85.25, t_nm: 55, gap: 1.683 });
  close(s.lsq, 27.995611, 1e-6);
  close(s.delta_ueV, 116.0238, 1e-6);
});

test('solveTop recovers each core quantity from the other three (thick Nb film)', () => {
  const { lsq } = solveTop(NB);
  close(solveTop({ tc_mK: NB.tc_mK, rho: NB.rho, lsq }).t_nm, NB.t_nm, 1e-9);
  close(solveTop({ tc_mK: NB.tc_mK, t_nm: NB.t_nm, lsq }).rho, NB.rho, 1e-9);
  close(solveTop({ rho: NB.rho, t_nm: NB.t_nm, lsq }).tc_mK, NB.tc_mK, 1e-9);
  close(solveTop({ ...NB, lsq, gap: null }).gap, GAP_RATIO, 1e-9);
});

test('solveTop recovers thickness from L□ for a thin film (t ≪ λ)', () => {
  const fwd = solveTop({ tc_mK: 450, rho: 70.7, t_nm: 50 });
  close(solveTop({ tc_mK: 450, rho: 70.7, lsq: fwd.lsq }).t_nm, 50, 1e-9);
});

test('solveTop solves films many λ thick, where L□ has saturated at μ₀λ/2', () => {
  for (const t_nm of [3000, 4000]) {
    const s = solveTop({ ...NB, t_nm });
    close(s.lsq, MU_0 * s.lambda_nm * 1e-9 / 2 * 1e12, 1e-9);
  }
});

test('solveTop leaves t unsolved from R□ and L□ alone, where it is ill-conditioned', () => {
  const s = solveTop({ tc_mK: 930, rs: 6.739, lsq: 10 });
  assert.equal(s.t_nm, undefined);
  assert.equal(s.rho, undefined);
});

test('solveTop rejects L□ below the thin-film limit ħR□/(πΔ)', () => {
  assert.throws(() => solveTop({ tc_mK: 1000, rs: 1, lsq: 0.001 }), InconsistentInputError);
});

test('solveTop rejects L□ at or below the thick-film limit μ₀λ/2', () => {
  // Nb λ ≈ 86 nm, so μ₀λ/2 ≈ 0.054 pH/sq: no thickness gives 0.05 pH/sq.
  assert.throws(() => solveTop({ tc_mK: NB.tc_mK, rho: NB.rho, lsq: 0.05 }), InconsistentInputError);
});

test('solveTop throws on contradictory inputs', () => {
  assert.throws(() => solveTop({ ...NB, lsq: 0.1 }), InconsistentInputError);
});

test('solveTop honors a fixed non-BCS gap ratio (thin film: L□ ∝ 1/gap)', () => {
  const bcs = solveTop({ tc_mK: 410, rho: 100, t_nm: 20, gap: 1.764 });
  const strong = solveTop({ tc_mK: 410, rho: 100, t_nm: 20, gap: 3.528 });
  close(strong.lsq, bcs.lsq / 2, 1e-4);
});

test('solveTop rejects non-positive Tc, thickness, resistivity, and gap', () => {
  assert.throws(() => solveTop({ tc_mK: -410, rs: 10.2 }), RangeError);
  assert.throws(() => solveTop({ tc_mK: 410, rho: 10, t_nm: 0 }), RangeError);
  assert.throws(() => solveTop({ tc_mK: 410, rho: -10, t_nm: 100 }), RangeError);
  assert.throws(() => solveTop({ tc_mK: 410, rs: 10.2, gap: 0 }), RangeError);
  assert.throws(() => solveTop({ tc_mK: 410, rs: 10.2, gap: -1.5 }), RangeError);
});
