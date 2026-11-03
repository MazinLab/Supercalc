import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS, ELEMENT_DATA } from '../js/materials.js';
import { ELEMENTS } from '../js/periodic-table.js';
import { solveTop, responseGamma } from '../js/superconductor.js';
import { computeN0, mattisBardeenS2, pulsePeakAmplitude } from '../js/n0.js';
import { E_CHARGE } from '../js/constants.js';

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

test('MKIDopt paper resonators give back the N₀ that MKIDopt derives from η₀', () => {
  // SimulationResult.N0_from_eta_per_J_m3 for each config; Supercalc adds the γ ≈ 1 factor.
  const expected = { 'mkidopt-hfta': 1.474230250e47, 'mkidopt-ptsi': 8.714958854e46, 'mkidopt-inhf': 6.656746769e46 };
  for (const [id, n0_eta] of Object.entries(expected)) {
    const p = PRESETS.find((q) => q.id === id);
    const ph = p.photon;
    const film = solveTop({ tc_mK: p.tc_mK, rho: p.rho_uohmcm, t_nm: p.t_nm, gap: p.gap_ratio });
    const delta_J = film.delta_ueV * E_CHARGE * 1e-6;
    const hmax = pulsePeakAmplitude(ph.tau_us * 1e-6, ph.q / (Math.PI * ph.f0_GHz * 1e9));
    const gamma = responseGamma(p.t_nm, film.lambda_nm);
    const n0 = computeN0({
      e_eV: ph.e_eV, volume_um3: ph.area_um2 * p.t_nm / 1000, q: ph.q, alpha_k: ph.alpha_k, gamma,
      eta_pb: ph.eta_pb, s2: mattisBardeenS2(delta_J, ph.temp_mK / 1000, ph.f0_GHz * 1e9), delta_J,
      theta2_rad: ph.theta2_peak_deg * Math.PI / 180 / hmax,
    });
    assert.ok(Math.abs(n0 - gamma * n0_eta) < 1e-4 * n0_eta, `${id}: N₀ ${n0} ≈ ${gamma * n0_eta}`);
  }
});
