const THICKNESS = 1.5;

function requireNumber(value, label, min, max = Infinity) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} must be between ${min} and ${Number.isFinite(max) ? max : 'a reasonable maximum'} inches.`);
  }
}

function piecesForSpan(length, stockLength) {
  const pieces = [];
  while (length > 1e-8) {
    const piece = Math.min(length, stockLength);
    pieces.push(piece);
    length -= piece;
  }
  return pieces;
}

// Dimensions are inches. Opening left and sill positions are measured from the
// wall's left edge and the top of its bottom plate, respectively.
export function calculateWall({ length, height, spacing, plateStock, openings }) {
  requireNumber(length, 'Wall length', 12, 12000);
  requireNumber(height, 'Wall height', 24, 240);
  requireNumber(spacing, 'Stud spacing', 1.5, 48);
  requireNumber(plateStock, 'Plate stock length', 12, 240);
  if (!Array.isArray(openings)) throw new Error('Openings must be a list.');

  const studLength = height - 3 * THICKNESS;
  const sorted = openings.map((opening, index) => {
    const label = `Opening ${index + 1}`;
    if (!['door', 'window'].includes(opening.type)) throw new Error(`${label} must be a door or window.`);
    requireNumber(opening.left, `${label} left edge`, 4.5, length);
    requireNumber(opening.width, `${label} rough width`, 1.5, length);
    requireNumber(opening.height, `${label} rough height`, 1, height);
    requireNumber(opening.headerDepth, `${label} header depth`, 1.5, height);
    const sill = opening.type === 'door' ? 0 : opening.sill;
    requireNumber(sill, `${label} sill height`, opening.type === 'window' ? THICKNESS : 0, height);
    if (opening.left + opening.width > length - 4.5) {
      throw new Error(`${label} needs at least 4½ inches between its rough opening and each wall end.`);
    }
    if (sill + opening.height + opening.headerDepth > studLength + 1e-8) {
      throw new Error(`${label}, including its header, must fit between the plates.`);
    }
    return { ...opening, sill, index, right: opening.left + opening.width };
  }).sort((a, b) => a.left - b.left);

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].left - sorted[i - 1].right < 6) {
      throw new Error(`Openings ${sorted[i - 1].index + 1} and ${sorted[i].index + 1} need at least 6 inches between rough openings for their framing.`);
    }
  }

  const grid = [];
  for (let center = THICKNESS / 2 + spacing; center < length - THICKNESS; center += spacing) {
    grid.push(center);
  }
  const commonStuds = 2 + grid.filter(center =>
    sorted.every(o => center + THICKNESS / 2 <= o.left - 3 || center - THICKNESS / 2 >= o.right + 3)
  ).length;

  const cuts = [];
  const addCut = (part, quantity, cutLength, material, note = '') => {
    if (quantity > 0 && cutLength > 1e-8) cuts.push({ part, quantity, length: cutLength, material, note });
  };
  addCut('Common and end studs', commonStuds, studLength, 'Stud stock');

  let crippleCount = 0;
  sorted.forEach(o => {
    const name = `${o.type === 'door' ? 'Door' : 'Window'} ${o.index + 1}`;
    const positions = grid.filter(center => center - THICKNESS / 2 >= o.left && center + THICKNESS / 2 <= o.right).length;
    const above = studLength - o.sill - o.height - o.headerDepth;
    const below = o.type === 'window' ? o.sill - THICKNESS : 0;
    addCut(`${name} king studs`, 2, studLength, 'Stud stock');
    addCut(`${name} jack studs`, 2, o.sill + o.height, 'Stud stock');
    addCut(`${name} header plies`, 2, o.width + 2 * THICKNESS, 'Header stock', `Actual depth: ${o.headerDepth} in`);
    addCut(`${name} top cripples`, positions, above, 'Stud stock');
    addCut(`${name} bottom cripples`, positions, below, 'Stud stock');
    if (above > 1e-8) crippleCount += positions;
    if (below > 1e-8) crippleCount += positions;
    if (o.type === 'window') addCut(`${name} rough sill`, 1, o.width, 'Stud stock');
  });

  const plateCuts = [];
  for (let layer = 1; layer <= 2; layer++) {
    const pieces = piecesForSpan(length, plateStock);
    if (layer === 2) pieces.reverse();
    for (const piece of pieces) plateCuts.push({ part: `Top plate ${layer}`, length: piece });
  }
  let cursor = 0;
  for (const door of sorted.filter(o => o.type === 'door')) {
    for (const piece of piecesForSpan(door.left - cursor, plateStock)) plateCuts.push({ part: 'Bottom plate', length: piece });
    cursor = door.right;
  }
  for (const piece of piecesForSpan(length - cursor, plateStock)) plateCuts.push({ part: 'Bottom plate', length: piece });
  plateCuts.forEach(p => addCut(p.part, 1, p.length, 'Plate stock'));

  const kingCount = sorted.length * 2;
  const jackCount = sorted.length * 2;
  const sillCount = sorted.filter(o => o.type === 'window').length;
  // Four nails per common/king/cripple, six per jack, four per header ply
  // and four per sill. Connections to adjacent walls and sheathing are excluded.
  const nails = 4 * (commonStuds + kingCount + crippleCount) + 6 * jackCount + 8 * sorted.length + 4 * sillCount;
  return {
    commonStuds, kingCount, jackCount, crippleCount, sillCount,
    headerPieces: sorted.length * 2,
    plateBoards: plateCuts.length,
    plateLinearInches: plateCuts.reduce((sum, p) => sum + p.length, 0),
    nails, cuts
  };
}

export function formatLength(inches) {
  const rounded = Math.round(inches * 100) / 100;
  const feet = Math.floor(rounded / 12);
  const remainder = Math.round((rounded - feet * 12) * 100) / 100;
  return feet ? `${feet} ft ${remainder} in` : `${remainder} in`;
}
