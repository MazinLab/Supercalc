import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, ELEMENT_DATA } from '../js/materials.js';
import { ELEMENTS } from '../js/periodic-table.js';
import { solveTop } from '../js/superconductor.js';

test('ELEMENT_DATA holds 30 ambient elements; Hg is intentionally excluded', () => {
  assert.equal(Object.keys(ELEMENT_DATA).length, 30);
  assert.ok(!('Hg' in ELEMENT_DATA), 'mercury is intentionally not a usable element');
});

test('every ELEMENT_DATA key is a real element symbol', () => {
  const symbols = new Set(ELEMENTS.map(([, sym]) => sym));
  for (const k of Object.keys(ELEMENT_DATA)) {
    assert.ok(symbols.has(k), `${k} is a known element symbol`);
  }
});

test('every element entry is well-formed', () => {
  for (const [sym, d] of Object.entries(ELEMENT_DATA)) {
    assert.ok(Number.isFinite(d.tc_mK) && d.tc_mK > 0, `${sym}: Tc positive`);
    assert.ok(
      d.rho_uohmcm == null || (Number.isFinite(d.rho_uohmcm) && d.rho_uohmcm > 0),
      `${sym}: ρ positive or null`,
    );
    assert.ok(d.kind === 'film' || d.kind === 'bulk', `${sym}: kind is film|bulk`);
    assert.ok(typeof d.source === 'string' && d.source.length > 0, `${sym}: has a source`);
  }
});

test('every preset is well-formed', () => {
  assert.ok(PRESETS.length >= 1);
  for (const p of PRESETS) {
    assert.ok(typeof p.name === 'string' && p.name.length > 0, 'preset has a name');
    assert.ok(Number.isFinite(p.tc_mK) && p.tc_mK > 0, `${p.name}: Tc positive`);
    assert.ok(typeof p.source === 'string' && p.source.length > 0, `${p.name}: has a source`);
  }
});

test('MKIDopt presets reproduce the sheet inductance MKIDopt documents for them', () => {
  const expected = { 'mkidopt-hfta': 28.0, 'mkidopt-ptsi': 9.993, 'mkidopt-inhf': 10.0 };
  for (const [id, lsq] of Object.entries(expected)) {
    const p = PRESETS.find((q) => q.id === id);
    const s = solveTop({ tc_mK: p.tc_mK, rho: p.rho_uohmcm, t_nm: p.t_nm, gap: p.gap_ratio });
    assert.ok(Math.abs(s.lsq - lsq) < 1e-3 * lsq, `${id}: L□ ${s.lsq} ≈ ${lsq}`);
  }
});

test('gap-solving presets give a physical gap ratio (a room-temperature ρ gives ≈ 2.9)', () => {
  for (const p of PRESETS.filter((q) => q.solve_gap)) {
    const { gap } = solveTop({ tc_mK: p.tc_mK, rho: p.rho_uohmcm, t_nm: p.t_nm, lsq: p.lsq_pH, gap: null });
    assert.ok(gap > 1.6 && gap < 2.2, `${p.name}: Δ/(k_B·Tc) = ${gap}`);
  }
});
