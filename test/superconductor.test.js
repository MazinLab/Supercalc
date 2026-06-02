import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  gap_J, sheetResistance, resistivityFromRs, sheetInductance_pH, solveTop,
} from '../js/superconductor.js';
import { GAP_RATIO, K_B } from '../js/constants.js';

const close = (a, b, rel = 1e-9) =>
  assert.ok(Math.abs(a - b) <= rel * Math.max(1, Math.abs(b)), `${a} ≈ ${b}`);

test('gap_J is GAP_RATIO·k_B·Tc with Tc in K', () => {
  close(gap_J(0.41), GAP_RATIO * K_B * 0.41);
});

test('sheetResistance: Rs = 10·ρ/t', () => {
  close(sheetResistance(102, 100), 10.2);          // 102 µΩcm / 100 nm → 10.2 Ω/sq
});

test('resistivityFromRs inverts sheetResistance', () => {
  close(resistivityFromRs(10.2, 100), 102);
});

test('sheetInductance_pH: Hf (Rs=10.2 Ω/sq, Tc=0.41 K) → 34.3 pH/sq', () => {
  close(sheetInductance_pH(10.2, 0.41), 34.28, 1e-3);
});

test('solveTop fills Lsq from Tc+Rs (Hf preset path)', () => {
  const s = solveTop({ tc_mK: 410, rs: 10.2 });
  close(s.lsq, 34.28, 1e-3);
  assert.equal(s.rho, undefined);                  // ρ and t remain undetermined
  assert.equal(s.t_nm, undefined);
});

test('solveTop fills Lsq from Tc+ρ+t (WHf + thickness path)', () => {
  const s = solveTop({ tc_mK: 450, rho: 70.7, t_nm: 50 });
  close(s.rs, 14.14, 1e-3);
  close(s.lsq, 1378.0 * 14.14 / 450, 1e-3);
});

test('solveTop: Rs + thickness → resistivity', () => {
  const s = solveTop({ rs: 10.2, t_nm: 100 });
  close(s.rho, 102, 1e-9);
});

test('solveTop: Lsq round-trips back to thickness', () => {
  const fwd = solveTop({ tc_mK: 450, rho: 70.7, t_nm: 50 });
  const back = solveTop({ tc_mK: 450, rho: 70.7, lsq: fwd.lsq });
  close(back.t_nm, 50, 1e-6);
});

test('solveTop throws on contradictory inputs', () => {
  assert.throws(() => solveTop({ tc_mK: 410, rs: 10.2, lsq: 20.6 }), /inconsistent/);
});

test('solveTop solves the gap ratio from four measured values (Zobrist Hf)', () => {
  const s = solveTop({ tc_mK: 395, rho: 97, t_nm: 125, lsq: 16.7, gap: null });
  close(s.rs, 7.76, 1e-3);          // 10·97/125
  close(s.gap, 2.860, 1e-2);        // effective Δ/(k_B·Tc)
});

test('solveTop honors a fixed non-BCS gap ratio (Lsq ∝ 1/gap)', () => {
  const bcs = solveTop({ tc_mK: 410, rs: 10.2, gap: 1.764 });
  const strong = solveTop({ tc_mK: 410, rs: 10.2, gap: 3.528 });
  close(strong.lsq, bcs.lsq / 2, 1e-9);
});

test('solveTop rejects non-positive Tc, thickness, resistivity, and gap', () => {
  assert.throws(() => solveTop({ tc_mK: -410, rs: 10.2 }), RangeError);
  assert.throws(() => solveTop({ tc_mK: 410, rho: 10, t_nm: 0 }), RangeError);
  assert.throws(() => solveTop({ tc_mK: 410, rho: -10, t_nm: 100 }), RangeError);
  assert.throws(() => solveTop({ tc_mK: 410, rs: 10.2, gap: 0 }), RangeError);
  assert.throws(() => solveTop({ tc_mK: 410, rs: 10.2, gap: -1.5 }), RangeError);
});
