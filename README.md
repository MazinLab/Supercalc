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

1. **Surface impedance** (Zmuidzinas 2012, Eq. 8) — six linked fields: critical temperature
   Tc, normal-state resistivity ρ, sheet resistance Rₙ, film thickness t, sheet kinetic
   inductance L□, and the gap ratio Δ/(k_B·Tc). Enter any three of {Tc, ρ, t, L□} and the
   rest solve by constraint propagation (Rₙ is a convenience field). The gap ratio defaults
   to 1.764 (BCS); **leave it blank to solve it** from four over-determined measured values.
   Click a saved lab film to prefill it — presets hold ρ and the gap constant, so changing
   thickness updates L□.

2. **Density of states N₀ / pulse height** — from the material gap (panel 1) plus a measured
   single-photon response: photon energy (or wavelength), inductor height and width
   (thickness is inherited from panel 1), loaded quality factor Q, phase pulse height θ in
   **degrees**, kinetic-inductance fraction αₖ, pair-breaking efficiency η_pb, and the
   Mattis–Bardeen factor S₂. Computes the single-spin density of states N₀ in both
   eV⁻¹·µm⁻³ and SI (J⁻¹·m⁻³). Bidirectional: enter θ to get N₀, or enter N₀ to get the
   predicted θ.

3. **Material explorer** — a periodic table of the ambient-pressure elemental
   superconductors. Each clickable cell shows its Tc (gold above 1.3 K, blue below). Click
   one to prefill panel 1 with a best-guess Tc and resistivity.

## Physics

With Δ = (gap ratio)·k_B·Tc, Rₙ = 10·ρ[µΩ·cm]/t[nm], and the thin-film limit of Eq. 8:

```
L□[pH/sq] = ħ·Rₙ / (π·Δ) · 1e12
N₀        = η_pb·αₖ·S₂·Q·E / (4·Δ²·V·θ)      (V = h·w·t, θ in radians)
```

The default gap ratio is the BCS weak-coupling value 1.764; real films often deviate (the
Zobrist 2019 Hf preset solves to ≈2.86), so it is adjustable.

References:
- J. Zmuidzinas, *Superconducting Microresonators: Physics and Applications*, Annu. Rev.
  Condens. Matter Phys. **3**, 169 (2012) — Eq. 8.
- N₀ inversion follows the Mazin Lab MKIDopt responsivity model.

## Stored data

All material data is pre-stored (no live fetch).

- **Presets:** UCSB Hf (Zobrist 2019, 10.1063/1.5127768), UCSB PtSi (Szypryt 2017,
  10.1364/oe.25.025894), UCSB WHf.
- **Elements:** Tc and ρ for the 30 ambient-pressure elemental superconductors, preferring
  thin-film literature values over bulk where available; each is tagged `film` or `bulk`
  with a source. Resistivities are representative and approximate; several are unavailable
  (stored as null). See the disclaimer above.

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
