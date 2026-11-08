import { calculateWall, formatLength } from './calculator.js';

const form = document.querySelector('#wall-form');
const openings = document.querySelector('#openings');
const results = document.querySelector('#results');
const error = document.querySelector('#error');
const value = selector => Number(document.querySelector(selector).value);

function markStale() {
  results.hidden = true;
  error.textContent = 'Inputs changed. Select Calculate materials to update your estimate.';
  error.hidden = false;
}

function renumberOpenings() {
  [...openings.children].forEach((opening, index) => {
    opening.querySelector('.opening-title').textContent = `Opening ${index + 1}`;
    opening.querySelector('legend').textContent = `Opening ${index + 1}`;
  });
}

document.querySelector('#add-opening').addEventListener('click', () => {
  const opening = document.querySelector('#opening-template').content.firstElementChild.cloneNode(true);
  const type = opening.querySelector('.opening-type');
  type.addEventListener('change', () => {
    const isWindow = type.value === 'window';
    opening.querySelector('.sill-field').hidden = !isWindow;
    opening.querySelector('.opening-sill').required = isWindow;
    opening.querySelector('.opening-height').value = isWindow ? 48 : 80;
  });
  opening.querySelector('.remove-button').addEventListener('click', () => {
    opening.remove();
    renumberOpenings();
    markStale();
  });
  openings.append(opening);
  renumberOpenings();
  markStale();
});

function readOpening(element) {
  const number = selector => Number(element.querySelector(selector).value);
  return {
    type: element.querySelector('.opening-type').value,
    left: number('.opening-left'),
    width: number('.opening-width'),
    height: number('.opening-height'),
    sill: number('.opening-sill'),
    headerDepth: number('.opening-header')
  };
}

function render(result) {
  const cards = [
    ['Full-height studs', result.commonStuds + result.kingCount, `${result.commonStuds} common / end + ${result.kingCount} kings`],
    ['Jack studs', result.jackCount, '2 per opening'],
    ['Cripple studs', result.crippleCount, 'above and below openings'],
    ['Plate boards', result.plateBoards, `${formatLength(result.plateLinearInches)} total cut length`],
    ['Header plies', result.headerPieces, '2 per opening'],
    ['Framing nails', result.nails, 'estimated connection count']
  ];
  results.innerHTML = `
    <div class="summary-grid">${cards.map(([label, count, detail]) => `<div class="summary-card"><span>${label}</span><strong>${count}</strong><small>${detail}</small></div>`).join('')}</div>
    <div class="cut-heading"><div><p class="step">READY TO CUT</p><h3>Cut list</h3></div><span>Finished lengths</span></div>
    <div class="table-wrap"><table><thead><tr><th>Part</th><th>Qty</th><th>Length</th><th>Stock</th></tr></thead><tbody>${result.cuts.map(cut => `<tr><td>${cut.part}${cut.note ? `<small>${cut.note}</small>` : ''}</td><td>${cut.quantity}</td><td>${formatLength(cut.length)}</td><td>${cut.material}</td></tr>`).join('')}</tbody></table></div>
    <div class="assumptions"><h3>What’s included</h3><p>One 1½-in bottom plate, two 1½-in top plates, 1½-in-thick studs, two king studs and two jack studs per opening, two header plies, and one rough sill per window. Door bottom plates are cut out at the rough opening.</p><p>Common studs and cripples follow the wall’s layout from the left end; openings replace intersecting common studs. Plate boards are counted per cut piece without reuse. Stagger top-plate joints and support all splices; the displayed cuts do not plan splice locations. Stud and header stock quantities are not optimized.</p><p>Nails: 4 per common, king, or cripple; 6 per jack; 4 per header ply and sill. Excludes plate splices, wall connections, sheathing, blocking, waste and specialized fasteners. Nail size and connection requirements must be verified.</p></div>`;
}

function calculate() {
  if (!form.reportValidity()) return;
  try {
    const result = calculateWall({
      length: value('#length-ft') * 12 + value('#length-in'),
      height: value('#height-ft') * 12 + value('#height-in'),
      spacing: value('#spacing'),
      plateStock: value('#plate-stock'),
      openings: [...openings.children].map(readOpening)
    });
    render(result);
    error.hidden = true;
    results.hidden = false;
  } catch (exception) {
    error.textContent = exception.message;
    error.hidden = false;
    results.hidden = true;
  }
}

form.addEventListener('submit', event => {
  event.preventDefault();
  calculate();
});
form.addEventListener('input', markStale);
form.addEventListener('change', markStale);
calculate();
