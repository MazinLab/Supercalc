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
 * ratio (BCS when absent). The MKIDopt entries mirror ../MKIDopt/mkidopt/materials.py and the paper devices in its configs/*.toml,
 * whose comments carry the full provenance. Their `photon` block prefills the N₀ panel with
 * that resonator (loaded Q, metal area of the legs, f₀, bath temperature, phase decay time,
 * α_k) and the linearized peak θ₂ that MKIDopt's run_simulation gives for a 2 eV photon from
 * the measured responsivity, so the panel recovers N₀ = η_pb·S₂/(Δ²·η₀).
 */
export const PRESETS = [
  // UCSB four-probe runs: ρ = ρ(300 K)/RRR, Tc is the sheet's "transition temperature", the
  // low end of the resistive transition; the source notes its midpoint and onset.
  {
    id: 'ucsb-nb',
    name: 'UCSB Nb (125 nm)',
    tc_mK: 8551, rho_uohmcm: 21.98 / 3.783, t_nm: 124.9,
    source: '[Nb]-[20]C-[30]sccm-[1.2]mT-[200]W-[26.4]min. ρ(300 K) 21.98 µΩ·cm, RRR 3.78 '
      + '(less certain on this thick film); Tc midpoint 8833, onset 9116 mK',
  },
  {
    id: 'ucsb-hf',
    name: 'UCSB Hf, Tc 503 mK',
    tc_mK: 503, rho_uohmcm: 112.89 / 1.451, t_nm: 49.9,
    source: '[Hf]-[20]C-[30]sccm-[2]mT-[150]W-[5]min. ρ(300 K) 112.89 µΩ·cm, RRR 1.451; '
      + 'Tc midpoint 544, onset 584 mK',
  },
  {
    id: 'ucsb-hfta-836',
    name: 'UCSB HfTa, Tc 836 mK',
    tc_mK: 836, rho_uohmcm: 141.60 / 1.386, t_nm: 60.0,
    source: '[TaRF+Hf]-[20]C-[30]sccm-[2]mT-[32,150]W-[5]min. ρ(300 K) 141.60 µΩ·cm, RRR 1.386; '
      + 'Tc midpoint 857, onset 877 mK',
  },
  {
    id: 'ucsb-hfta-1107',
    name: 'UCSB HfTa, Tc 1107 mK',
    tc_mK: 1107, rho_uohmcm: 134.88 / 1.409, t_nm: 52.8,
    source: '[TaRF+Hf]-[20]C-[30]sccm-[2]mT-[40,150]W-[5]min. ρ(300 K) 134.88 µΩ·cm, RRR 1.409; '
      + 'Tc midpoint 1127, onset 1147 mK',
  },
  {
    id: 'ucsb-hfta-2986',
    name: 'UCSB HfTa, Tc 2986 mK',
    tc_mK: 2986, rho_uohmcm: 154.38 / 1.094, t_nm: 59.4,
    source: '[TaRF+Hf]-[20]C-[30]sccm-[2]mT-[100,150]W-[5]min. ρ(300 K) 154.38 µΩ·cm, RRR 1.094; '
      + 'broad transition: Tc midpoint 3460, onset 3935 mK',
  },
  {
    id: 'mkidopt-hfta',
    name: 'HfTa, Tc 0.8 K (MKIDopt)',
    tc_mK: 800, rho_uohmcm: 85.25, t_nm: 55, gap_ratio: 1.683,
    photon: {
      e_eV: 2, area_um2: 1200, q: 23503.0, f0_GHz: 3.8010414, temp_mK: 10, tau_us: 45,
      alpha_k: 0.752976, eta_pb: 0.59, theta2_peak_deg: 106.5536,
    },
    source: 'Unpublished 2026 (HfTa_Wo3_0p8K), 3.80 GHz resonator. Gap from a Mattis–Bardeen '
      + 'f₀(T) fit; ρ solved for L□ = 28 pH/sq. Provisional',
  },
  {
    id: 'mkidopt-ptsi',
    name: 'PtSi MEC (Zobrist 2019)',
    tc_mK: 930, rho_uohmcm: 33.697, t_nm: 50,
    photon: {
      e_eV: 2, area_um2: 1220.18, q: 19343.2, f0_GHz: 5.6745790, temp_mK: 100, tau_us: 46.32,
      alpha_k: 0.816365, eta_pb: 0.59, theta2_peak_deg: 126.6845,
    },
    source: 'Zobrist 2019, APL 115, 042601, MEC resonator. ρ from the Szypryt 2016 (APL 109, '
      + '151102) witness film, 8.2 pH/sq at 60 nm. MKIDopt\'s held material N₀ is 1.55e47',
  },
  {
    id: 'mkidopt-inhf',
    name: 'In/Hf bilayer (Zobrist 2022)',
    tc_mK: 786, rho_uohmcm: 125.16980282, t_nm: 220,
    photon: {
      e_eV: 2, area_um2: 1224, q: 17285.0, f0_GHz: 5.1112829, temp_mK: 13.6, tau_us: 386,
      alpha_k: 0.855395, eta_pb: 0.59, theta2_peak_deg: 49.89728,
    },
    source: 'Zobrist 2022, PRL 129, 017701. 220 nm Hf on 15 nm In; ρ solved for the measured '
      + '10 pH/sq. Supp. Table SI gives N₀ = 1.23e47 (published Hf values flagged as suspect)',
  },
  {
    id: 'mkidopt-hf',
    name: 'Hf, UE2 default (MKIDopt)',
    tc_mK: 400, rho_uohmcm: 60.6, t_nm: 200,
    source: 'MKIDopt HF_FILM: ρ is the Zobrist 2022 supplement Hf-on-Si value at 4 K',
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
