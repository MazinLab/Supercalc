/**
 * Pre-stored superconductor data. PRESETS feed the panel-1 material box; ELEMENT_DATA
 * (keyed by element symbol) feeds the periodic-table prefill. Each entry carries a source.
 * Resistivities are normal-state values just above Tc (room-temperature values divided by
 * the RRR where that is how they were measured), since that is what sets the kinetic
 * inductance. Elements store a resistivity only where a low-temperature film value was
 * found: a bulk metal's residual resistivity is set by its purity, and a room-temperature
 * handbook value overstates it by the RRR.
 */

/**
 * Lab and literature films. Each holds Tc [mK], ρ [µΩ·cm], t [nm], and optionally the gap
 * ratio (BCS when absent), a measured L□ [pH/sq] with `solve_gap: true` (the four values
 * over-determine the film, so the effective Δ/(k_B·Tc) is solved from them), and N₀ [J⁻¹m⁻³]
 * to prefill the N₀ panel. The MKIDopt entries mirror ../MKIDopt/mkidopt/materials.py and
 * its configs/*.toml, whose comments carry the full provenance.
 */
export const PRESETS = [
  {
    id: 'ucsb-nb',
    name: 'UCSB Nb (125 nm)',
    tc_mK: 8550.88, rho_uohmcm: 5.810, t_nm: 125,
    source: 'Nb-20C-200W-300sccm-1.2mT, 26.4 min at 4.73 nm/min. 4-probe: ρ(300 K) 21.98 µΩ·cm, '
      + 'RRR 3.78; ρ, RRR less certain on this thick film. Tc midpoint 8833 mK',
  },
  {
    id: 'mkidopt-hfta',
    name: 'HfTa, Tc 0.8 K (MKIDopt)',
    tc_mK: 800, rho_uohmcm: 85.25, t_nm: 55, gap_ratio: 1.683, n0_per_J_m3: 1.54e47,
    source: 'Unpublished 2026 (HfTa_Wo3_0p8K). Gap from a Mattis–Bardeen f₀(T) fit; ρ solved '
      + 'for L□ = 28 pH/sq; N₀ from responsivity. Provisional',
  },
  {
    id: 'mkidopt-ptsi',
    name: 'PtSi MEC (Zobrist 2019)',
    tc_mK: 930, rho_uohmcm: 33.697, t_nm: 50, n0_per_J_m3: 1.5523e47,
    source: 'Zobrist 2019, APL 115, 042601. ρ from the Szypryt 2016 (APL 109, 151102) '
      + 'witness film, 8.2 pH/sq at 60 nm; N₀ from responsivity (MKIDopt)',
  },
  {
    id: 'mkidopt-inhf',
    name: 'In/Hf bilayer (Zobrist 2022)',
    tc_mK: 786, rho_uohmcm: 125.16980282, t_nm: 220, n0_per_J_m3: 1.23e47,
    source: 'Zobrist 2022, PRL 129, 017701. 220 nm Hf on 15 nm In; ρ solved for the measured '
      + '10 pH/sq; N₀ from Supp. Table SI (published Hf values flagged as suspect)',
  },
  {
    id: 'zobrist2019-hf',
    name: 'UCSB Hf (Zobrist 2019)',
    tc_mK: 395, rho_uohmcm: 97 / 1.6, t_nm: 125, lsq_pH: 16.7, solve_gap: true,
    source: 'Zobrist 2019, APL 115, 213503. ρ = 97 µΩ·cm at 300 K / RRR 1.6; L□ = 16.7 pH/sq '
      + 'from matching simulated to measured f₀',
  },
  {
    id: 'mkidopt-hf',
    name: 'Hf, UE2 default (MKIDopt)',
    tc_mK: 400, rho_uohmcm: 60.6, t_nm: 200,
    source: 'MKIDopt HF_FILM: ρ is the Zobrist 2022 supplement Hf-on-Si value at 4 K',
  },
  {
    id: 'ucsb-whf',
    name: 'UCSB WHf',
    tc_mK: 450, rho_uohmcm: 70.7, t_nm: null,
    source: 'UCSB WHf bilayer',
  },
];

/**
 * Ambient-pressure elemental superconductors (30; Hg excluded below), ordered by atomic number.
 * Each: { tc_mK, rho_uohmcm: number|null, kind: 'film'|'bulk', source }.
 */
export const ELEMENT_DATA = {
  Li: { tc_mK: 0.4,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Be: { tc_mK: 26,    rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Al: { tc_mK: 1200,  rho_uohmcm: 0.5,   kind: 'film', source: 'Typical MKID Al film (approximate)' },
  Ti: { tc_mK: 400,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  V:  { tc_mK: 5380,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk); film ≈ bulk Tc' },
  Zn: { tc_mK: 850,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Ga: { tc_mK: 1091,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Zr: { tc_mK: 546,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Nb: { tc_mK: 9250,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk); see the UCSB Nb preset' },
  Mo: { tc_mK: 920,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Tc: { tc_mK: 7770,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk); radioactive' },
  Ru: { tc_mK: 658,   rho_uohmcm: 19.5,  kind: 'film', source: 'Langa 2025, arXiv:2503.00233 (ρ at 1 K; Tc 557–658 mK)' },
  Rh: { tc_mK: 0.325, rho_uohmcm: null,  kind: 'bulk', source: 'Buchal 1983, Phys. Rev. Lett. 50, 64' },
  Cd: { tc_mK: 517,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  In: { tc_mK: 3414,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Sn: { tc_mK: 3722,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  La: { tc_mK: 6000,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk); Tc purity-sensitive' },
  Hf: { tc_mK: 400,   rho_uohmcm: null,  kind: 'film', source: 'Coiffard 2020, arXiv:2004.00736; see the Hf presets for ρ' },
  Ta: { tc_mK: 4140,  rho_uohmcm: 0.775, kind: 'film', source: 'α-Ta, van Schijndel 2024, arXiv:2405.12417 (ρ(300 K) 13.4 µΩ·cm / RRR 17.3)' },
  W:  { tc_mK: 15,    rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk α-W)' },
  Re: { tc_mK: 1700,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Os: { tc_mK: 655,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Ir: { tc_mK: 112,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  // Mercury (Hg) is an ambient-pressure elemental superconductor but is INTENTIONALLY omitted
  // (liquid metal — not a usable thin film for these calculations), so 30 elements are clickable,
  // not the 31 on the reference chart. See test/materials.test.js for the invariant.
  Tl: { tc_mK: 2390,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Pb: { tc_mK: 7193,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Bi: { tc_mK: 0.53,  rho_uohmcm: null,  kind: 'bulk', source: 'Prakash 2017, Science 355, 52' },
  Th: { tc_mK: 1368,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk)' },
  Pa: { tc_mK: 1400,  rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk); rare actinide' },
  U:  { tc_mK: 800,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk); actinide' },
  Am: { tc_mK: 790,   rho_uohmcm: null,  kind: 'bulk', source: 'CRC Handbook (bulk); radioactive' },
};
