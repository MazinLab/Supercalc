/**
 * Periodic-table layout + DOM grid renderer for the bottom panel. Element list and the
 * ambient-superconductor set are ported from ../generate_superconducting_periodic_table.py.
 * Teal (clickable) cells are exactly the keys of ELEMENT_DATA.
 */

import { ELEMENT_DATA } from './materials.js';

// Compact Tc label for a cell: K for ≥1 K, mK below (range spans 0.3 mK to 9.5 K).
const formatTc = (tc_mK) =>
  tc_mK >= 1000 ? `${Number((tc_mK / 1000).toPrecision(3))} K` : `${Number(tc_mK.toPrecision(3))} mK`;

// Ported from the Python ELEMENTS list: [z, symbol, group, period].
// Lanthanides use period 8, actinides period 9 (rendered as the two detached rows).
export const ELEMENTS = [
  [1, 'H', 1, 1], [2, 'He', 18, 1],
  [3, 'Li', 1, 2], [4, 'Be', 2, 2], [5, 'B', 13, 2], [6, 'C', 14, 2], [7, 'N', 15, 2], [8, 'O', 16, 2], [9, 'F', 17, 2], [10, 'Ne', 18, 2],
  [11, 'Na', 1, 3], [12, 'Mg', 2, 3], [13, 'Al', 13, 3], [14, 'Si', 14, 3], [15, 'P', 15, 3], [16, 'S', 16, 3], [17, 'Cl', 17, 3], [18, 'Ar', 18, 3],
  [19, 'K', 1, 4], [20, 'Ca', 2, 4], [21, 'Sc', 3, 4], [22, 'Ti', 4, 4], [23, 'V', 5, 4], [24, 'Cr', 6, 4], [25, 'Mn', 7, 4], [26, 'Fe', 8, 4], [27, 'Co', 9, 4], [28, 'Ni', 10, 4], [29, 'Cu', 11, 4], [30, 'Zn', 12, 4], [31, 'Ga', 13, 4], [32, 'Ge', 14, 4], [33, 'As', 15, 4], [34, 'Se', 16, 4], [35, 'Br', 17, 4], [36, 'Kr', 18, 4],
  [37, 'Rb', 1, 5], [38, 'Sr', 2, 5], [39, 'Y', 3, 5], [40, 'Zr', 4, 5], [41, 'Nb', 5, 5], [42, 'Mo', 6, 5], [43, 'Tc', 7, 5], [44, 'Ru', 8, 5], [45, 'Rh', 9, 5], [46, 'Pd', 10, 5], [47, 'Ag', 11, 5], [48, 'Cd', 12, 5], [49, 'In', 13, 5], [50, 'Sn', 14, 5], [51, 'Sb', 15, 5], [52, 'Te', 16, 5], [53, 'I', 17, 5], [54, 'Xe', 18, 5],
  [55, 'Cs', 1, 6], [56, 'Ba', 2, 6], [57, 'La', 3, 8], [58, 'Ce', 4, 8], [59, 'Pr', 5, 8], [60, 'Nd', 6, 8], [61, 'Pm', 7, 8], [62, 'Sm', 8, 8], [63, 'Eu', 9, 8], [64, 'Gd', 10, 8], [65, 'Tb', 11, 8], [66, 'Dy', 12, 8], [67, 'Ho', 13, 8], [68, 'Er', 14, 8], [69, 'Tm', 15, 8], [70, 'Yb', 16, 8], [71, 'Lu', 17, 8], [72, 'Hf', 4, 6], [73, 'Ta', 5, 6], [74, 'W', 6, 6], [75, 'Re', 7, 6], [76, 'Os', 8, 6], [77, 'Ir', 9, 6], [78, 'Pt', 10, 6], [79, 'Au', 11, 6], [80, 'Hg', 12, 6], [81, 'Tl', 13, 6], [82, 'Pb', 14, 6], [83, 'Bi', 15, 6], [84, 'Po', 16, 6], [85, 'At', 17, 6], [86, 'Rn', 18, 6],
  [87, 'Fr', 1, 7], [88, 'Ra', 2, 7], [89, 'Ac', 3, 9], [90, 'Th', 4, 9], [91, 'Pa', 5, 9], [92, 'U', 6, 9], [93, 'Np', 7, 9], [94, 'Pu', 8, 9], [95, 'Am', 9, 9], [96, 'Cm', 10, 9], [97, 'Bk', 11, 9], [98, 'Cf', 12, 9], [99, 'Es', 13, 9], [100, 'Fm', 14, 9], [101, 'Md', 15, 9], [102, 'No', 16, 9], [103, 'Lr', 17, 9], [104, 'Rf', 4, 7], [105, 'Db', 5, 7], [106, 'Sg', 6, 7], [107, 'Bh', 7, 7], [108, 'Hs', 8, 7], [109, 'Mt', 9, 7], [110, 'Ds', 10, 7], [111, 'Rg', 11, 7], [112, 'Cn', 12, 7], [113, 'Nh', 13, 7], [114, 'Fl', 14, 7], [115, 'Mc', 15, 7], [116, 'Lv', 16, 7], [117, 'Ts', 17, 7], [118, 'Og', 18, 7],
];

/**
 * Render the periodic table into `container`. Clickable ambient cells call
 * onPick(symbol, ELEMENT_DATA[symbol]).
 * @param {HTMLElement} container
 * @param {(symbol:string, data:object)=>void} onPick
 */
export function renderPeriodicTable(container, onPick) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'ptable';
  for (const [z, symbol, group, period] of ELEMENTS) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'pcell';
    // f-block rows (period 8/9) are detached below the main table. Leave grid row 8 empty
    // as the visual gap; lanthanides/actinides land in rows 9/10 at columns 3–17 (group).
    const row = period <= 7 ? period : period + 1;
    cell.style.gridColumn = String(group);
    cell.style.gridRow = String(row);
    const data = ELEMENT_DATA[symbol];
    const tcClass = data && data.tc_mK > 1300 ? 'tc-hi' : 'tc-lo';  // colour split at 1.3 K
    cell.innerHTML = `<span class="pz">${z}</span><span class="psym">${symbol}</span>` +
      (data ? `<span class="ptc ${tcClass}">${formatTc(data.tc_mK)}</span>` : '');
    if (data) {
      cell.classList.add('super');
      cell.title = `${symbol}: Tc ${data.tc_mK} mK` +
        (data.rho_uohmcm != null ? `, ρ ${data.rho_uohmcm} µΩcm` : '') +
        ` (${data.kind})`;
      cell.addEventListener('click', () => onPick(symbol, data));
    } else {
      cell.disabled = true;
    }
    grid.appendChild(cell);
  }
  container.appendChild(grid);
}
