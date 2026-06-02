/**
 * Pre-stored superconductor data. PRESETS feed the panel-1 material box; ELEMENT_DATA
 * (keyed by element symbol) feeds the periodic-table prefill. Film values preferred over
 * bulk where readily available in the literature; each carries a kind tag and a source.
 * Resistivities are representative normal-state values just above Tc and are approximate
 * (deposition-dependent for films); null where no reliable value was found.
 */

/**
 * Lab films for the surface-impedance panel. A preset may carry `solve_gap: true` (the four
 * measured top-panel values over-determine the BCS gap, so the calculator solves the effective
 * Δ/(k_B·Tc) from them) and an `n0_prefill` object to populate the N₀ panel on click.
 */
export const PRESETS = [
  {
    id: 'zobrist-hf',
    name: 'UCSB Hf (Zobrist 2019)',
    tc_mK: 395, rho_uohmcm: 97, rs_ohm_sq: null, t_nm: 125, lsq_pH: 16.7,
    solve_gap: true,
    source: 'Zobrist 2019, 10.1063/1.5127768',
    n0_prefill: { lambda_nm: 808, theta_deg: 90, alpha_k: 0.96, h_um: 40, w_um: 40, q: 15700 },
  },
  {
    id: 'ucsb-ptsi',
    name: 'UCSB PtSi (Szypryt 2017)',
    tc_mK: 930, rho_uohmcm: null, rs_ohm_sq: null, t_nm: 50, lsq_pH: 10.5,
    source: 'Szypryt 2017, 10.1364/oe.25.025894',
    n0_prefill: { lambda_nm: 808, theta_deg: 90, alpha_k: 0.96, h_um: 35, w_um: 47, q: 15100 },
  },
  {
    id: 'ucsb-whf',
    name: 'UCSB WHf',
    tc_mK: 450, rho_uohmcm: 70.7, rs_ohm_sq: null, t_nm: null, lsq_pH: null,
    source: 'UCSB WHf bilayer',
  },
];

/**
 * Ambient-pressure elemental superconductors (31), ordered by atomic number.
 * Each: { tc_mK, rho_uohmcm: number|null, kind: 'film'|'bulk', source }.
 */
export const ELEMENT_DATA = {
  Li: { tc_mK: 0.4,   rho_uohmcm: null, kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Be: { tc_mK: 26,    rho_uohmcm: null, kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Al: { tc_mK: 1200,  rho_uohmcm: 0.5,  kind: 'film', source: 'Cooke 2011 / standard MKID Al film' },
  Ti: { tc_mK: 510,   rho_uohmcm: 140,  kind: 'film', source: 'IEEE Trans. Appl. Supercond. 9191808' },
  V:  { tc_mK: 5380,  rho_uohmcm: 18,   kind: 'bulk', source: 'CRC Handbook (bulk); film ≈ bulk Tc' },
  Zn: { tc_mK: 850,   rho_uohmcm: 1.0,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Ga: { tc_mK: 1091,  rho_uohmcm: 13,   kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Zr: { tc_mK: 546,   rho_uohmcm: 40,   kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Nb: { tc_mK: 9200,  rho_uohmcm: 15,   kind: 'film', source: 'Dobrovolskiy 2025, arXiv:2502.03299' },
  Mo: { tc_mK: 920,   rho_uohmcm: 5.5,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Tc: { tc_mK: 7770,  rho_uohmcm: null, kind: 'bulk', source: 'CRC Handbook (bulk); radioactive' },
  Ru: { tc_mK: 660,   rho_uohmcm: 19.5, kind: 'film', source: 'Sidorenkov 2025, arXiv:2503.00233' },
  Rh: { tc_mK: 0.325, rho_uohmcm: null, kind: 'bulk', source: 'Becker 1983, Phys. Rev. Lett. 50 64' },
  Cd: { tc_mK: 517,   rho_uohmcm: 2.0,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  In: { tc_mK: 3414,  rho_uohmcm: 2.0,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Sn: { tc_mK: 3722,  rho_uohmcm: 2.8,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  La: { tc_mK: 6000,  rho_uohmcm: 57,   kind: 'bulk', source: 'CRC Handbook (bulk); Tc purity-sensitive' },
  Hf: { tc_mK: 400,   rho_uohmcm: 90,   kind: 'film', source: 'Cecil 2020, arXiv:2004.00736 (MKID Hf)' },
  Ta: { tc_mK: 4400,  rho_uohmcm: 1.5,  kind: 'film', source: 'α-Ta film; Hälg 2024, arXiv:2405.12417' },
  W:  { tc_mK: 15,    rho_uohmcm: 18,   kind: 'film', source: 'α-W film; Cirillo 2021 Thin Solid Films' },
  Re: { tc_mK: 1700,  rho_uohmcm: 18,   kind: 'film', source: 'Re film; Dalmau 1982 Thin Solid Films' },
  Os: { tc_mK: 655,   rho_uohmcm: 8,    kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Ir: { tc_mK: 112,   rho_uohmcm: 15,   kind: 'film', source: 'Teixeira 2020, arXiv:2010.00772' },
  // Mercury (Hg) is an ambient-pressure elemental superconductor but is INTENTIONALLY omitted
  // (liquid metal — not a usable thin film for these calculations), so 30 elements are clickable,
  // not the 31 on the reference chart. See test/materials.test.js for the invariant.
  Tl: { tc_mK: 2390,  rho_uohmcm: 6,    kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Pb: { tc_mK: 7193,  rho_uohmcm: 4.5,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Bi: { tc_mK: 0.53,  rho_uohmcm: 107,  kind: 'bulk', source: 'Prakash 2017 Science 355 52' },
  Th: { tc_mK: 1368,  rho_uohmcm: 10,   kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Pa: { tc_mK: 1400,  rho_uohmcm: null, kind: 'bulk', source: 'CRC Handbook (bulk); rare actinide' },
  U:  { tc_mK: 800,   rho_uohmcm: null, kind: 'bulk', source: 'CRC Handbook (bulk); actinide' },
  Am: { tc_mK: 790,   rho_uohmcm: null, kind: 'bulk', source: 'CRC Handbook (bulk); radioactive' },
};
