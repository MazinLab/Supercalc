# Supercalc — Superconducting Properties Calculator

A static, browser-based calculator for superconducting thin-film properties, with a
Star Trek: TNG / LCARS theme. No build step, no dependencies, no server-side code —
deployable as-is on GitHub Pages.

> ## ⚠️ Disclaimer — advisory only, no warranty
>
> Every number Supercalc produces is an **approximate estimate** from idealized models
> and literature values that are sample-, deposition-, and measurement-dependent. The
> results are **advisory only** and come with **no warranty of any kind** as to accuracy,
> completeness, or fitness for any purpose. Do not rely on them as the sole basis for any
> design, fabrication, procurement, safety, or financial decision. **Verify every result
> against primary references and your own measurements before acting on it.** Use is
> entirely at your own risk. See [`LICENSE`](LICENSE) for the full terms.

## Panels

1. **Surface impedance.** Six linked fields: critical temperature Tc, normal state
   resistivity ρ, sheet resistance R□, film thickness t, sheet inductance L□, and the gap
   ratio Δ/(k_B·Tc). Enter any three of {Tc, ρ, t, L□} and the rest follow by constraint
   propagation, with the penetration depth λ and gap energy Δ shown as readouts. The gap
   ratio defaults to 1.764 (BCS). **Leave it blank to solve it** from four measured values,
   and the solved value appears greyed in the empty field.

   R□, L□, and Tc alone fix t only through the excess of L□ over its thin film limit
   ħR□/(πΔ). That excess is second order in t/λ, so the solver leaves t unsolved rather
   than amplify rounding. Enter t or ρ as well. An L□ below the thin film limit is
   rejected. Click a material preset to prefill it. Presets hold ρ, Tc, and the gap, so
   changing the thickness updates L□.

2. **Density of states N₀ / pulse height.** Uses the gap and thickness from panel 1 plus a
   measured single photon response:
   - photon energy or wavelength
   - the inductor's metal area (not its outline), which with t gives the active volume V
   - the loaded Q, f₀, and bath temperature, which must be below Tc/2
   - optionally the pulse decay time τ_qp
   - the phase pulse height θ in degrees, as a loop phase θ₁ or a linearized phase θ₂
   - α_k and η_pb

   It computes the single spin N₀ in eV⁻¹·µm⁻³ and J⁻¹·m⁻³, and, with ρ from panel 1,
   the diffusion constant D and the dirty limit coherence length ξ. The panel also runs
   backward, from an entered N₀ to the predicted θ. Choosing a material or clearing panel 1
   resets this panel, and the three paper device presets fill it with their resonator and a
   2 eV photon. Editing a film property in panel 1 recomputes it.

3. **Material explorer.** A periodic table of the ambient pressure elemental
   superconductors. Each clickable cell shows its Tc (gold above 1.3 K, blue below). Click
   one to prefill panel 1 with its Tc, and with ρ where a low temperature film value is
   stored.

## Physics

The equations follow the Mazin Lab [MKIDopt](https://github.com/MazinLab/MKIDopt) model
(`mkidopt/materials.py`, `resonator.py`, `optimal_filter.py`, `coordinates.py`).

**Sheet inductance.** With Δ = (gap ratio)·k_B·Tc and ρ the normal state resistivity just
above Tc:

```
λ  = √(ħρ / (πμ₀Δ))  ≈ 105 nm·√(ρ[µΩ·cm] / Tc[K])      Zmuidzinas 2012, Eq. 8
L□ = (μ₀λ/2)·coth(t/2λ)
```

For t ≪ λ this is ħR□/(πΔ) (Zmuidzinas Eqs. 7, 8, 12). For t ≫ λ it saturates at μ₀λ/2.
The coth form is the London slab result for a strip carrying current on both faces, as in
MKIDopt. A film over a ground plane, with field on one side only, has the same thin limit
but a thick limit of μ₀λ. The thin limit is 15% low for 125 nm Nb (λ ≈ 86 nm) and below
0.3% for the Hf, HfTa, and PtSi presets.

**N₀ from a photon pulse** (Zmuidzinas Eqs. 64–72 and Gao 2008 thesis, Eqs. 2.96–2.99):

```
δn_qp = η_pb·E/(ΔV),  δσ₂/σ₂ = −S₂·δn_qp/(2N₀Δ),  δx = (α_k·γ/2)|δσ₂/σ₂|,  θ₂ = 4Q·δx
⇒  N₀ = γ·η_pb·S₂·α_k·Q·E / (Δ²·V·θ₂)
```

- **γ:** with λ ∝ σ₂^(−1/2), the coth formula gives
  γ = −dln L□/dln σ₂ = ½[1 + (t/λ)/sinh(t/λ)]. That is 1 for t ≪ λ and ½ for t ≫ λ
  (Zmuidzinas Eq. 13). MKIDopt takes γ = 1, within 0.3% for its thin films. For 125 nm Nb
  it is 0.86. α_k is the fraction of the total inductance contributed by L□.

- **θ₂:** the exponential amplitude of the pulse in the linearized loop center phase
  (Zobrist et al. 2021, JATIS 7, 010501).
- **Loop phase:** a measured loop phase θ₁, with the tone on resonance, linearizes as
  θ₂ = 2·tan(θ₁/2). At 90° that is 27% above θ₁. This assumes the pulse shifts the
  frequency without changing the dissipation. Large pulses with a real dissipation response
  mix the quadratures (Zobrist 2021), so enter a θ₂ linearized from both quadratures for
  those.
- **Pulse peak:** an observed pulse peak is h_max·θ₂, where h_max is the maximum of
  (1 − e^(−t/τ_rise))·e^(−t/τ_qp) and τ_rise = Q/(πf₀). With τ_qp left blank, θ is taken as
  the amplitude.
- **S₂:** the thermal Mattis–Bardeen factor,
  S₂ = 1 + √(2Δ/(πk_BT))·e^(−ξ)·I₀(ξ) with ξ = ħω/(2k_BT) (Zmuidzinas Eq. 72), at the bath
  temperature. As T → 0 it tends to 1 + √(2Δ/(π²ħω)), not 1. That limit is 2.10 for the
  PtSi preset at 5.67 GHz.
- **η_pb:** defaults to 0.59 (Zobrist et al. 2022).
- **D and ξ:** with N₀ and ρ, D = 1/(2e²N₀ρ) and ξ = √(ħD/Δ).

References:
- J. Zmuidzinas, *Superconducting Microresonators: Physics and Applications*, Annu. Rev.
  Condens. Matter Phys. **3**, 169 (2012).
- J. Gao, PhD thesis, Caltech (2008).
- N. Zobrist et al., J. Astron. Telesc. Instrum. Syst. **7**, 010501 (2021).

## Stored data

All material data is stored in `js/materials.js` (no live fetch).

- **Presets:**
  - UCSB films from four probe runs: Nb (125 nm), Hf (Tc 503 mK), and HfTa at three Ta
    powers (Tc 836, 1107, and 2986 mK). Each uses ρ = ρ(300 K)/RRR and the low end of the
    resistive transition as Tc.
  - From MKIDopt:
    - HfTa with Tc = 0.8 K (unpublished 2026, provisional)
    - PtSi from the MEC array (Zobrist et al. 2019, APL 115, 042601)
    - the In/Hf bilayer (Zobrist et al. 2022, PRL 129, 017701)
    - the UE2 default Hf film

  The MKIDopt TOML configs carry the full provenance of each MKIDopt preset. For the HfTa,
  PtSi, and In/Hf devices the preset also holds the resonator (loaded Q, metal area of the
  meander legs, f₀, bath temperature, τ_qp, α_k) and the θ₂ peak that MKIDopt simulates for
  a 2 eV photon from the measured responsivity η₀. From that pulse the N₀ panel recovers
  N₀ = η_pb·S₂/(Δ²·η₀): 1.47e47, 8.71e46, and 6.66e46 J⁻¹·m⁻³. MKIDopt's material blocks
  still hold earlier values for PtSi (1.55e47) and In/Hf (1.23e47, the published
  supplement value), about 1.8× higher.
- **Elements:** Tc for the 30 ambient pressure elemental superconductors (Hg excluded), each
  tagged `film` or `bulk` with a source. A resistivity is stored only where a low
  temperature film value was found (Al, Ru, Ta). A bulk metal's residual resistivity is
  set by its purity, and a room temperature handbook value overstates the film value by the
  RRR, so neither belongs in the L□ formula. See the disclaimer above.

## Run locally

ES modules require HTTP (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Test

Pure physics modules are unit-tested with Node's built-in runner:

```bash
npm test          # → node --test
```

## Deploy (GitHub Pages)

Static site, no build step. Settings → Pages → **Deploy from a branch** → `main` → `/(root)`.
Pushing to `main` updates the live site.

## License

BSD 3-Clause, with an additional advisory/no-warranty disclaimer for the scientific
calculations — see [`LICENSE`](LICENSE). The LCARS theme is an unaffiliated homage.
