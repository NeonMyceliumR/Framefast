import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWall, formatLength } from './calculator.js';

const base = { length: 144, height: 96, spacing: 16, plateStock: 96, openings: [] };
const door = { type: 'door', left: 36, width: 36, height: 80, headerDepth: 5.5 };
const window = { type: 'window', left: 36, width: 36, height: 48, sill: 36, headerDepth: 5.5 };
const cut = (result, part) => result.cuts.find(item => item.part === part);

test('calculates a simple wall, including end studs and three plate layers', () => {
  const result = calculateWall(base);
  assert.equal(result.commonStuds, 10);
  assert.equal(result.plateBoards, 6);
  assert.equal(result.plateLinearInches, 432);
  assert.equal(result.nails, 40);
  assert.equal(cut(result, 'Common and end studs').length, 91.5);
});

test('calculates door framing and subtracts the rough opening from the bottom plate', () => {
  const result = calculateWall({ ...base, openings: [door] });
  assert.equal(result.commonStuds, 7);
  assert.equal(result.kingCount, 2);
  assert.equal(result.jackCount, 2);
  assert.equal(result.crippleCount, 2);
  assert.equal(result.headerPieces, 2);
  assert.equal(result.plateLinearInches, 396);
  assert.equal(cut(result, 'Door 1 jack studs').length, 80);
  assert.equal(cut(result, 'Door 1 header plies').length, 39);
  assert.equal(cut(result, 'Door 1 top cripples').length, 6);
  assert.equal(result.nails, 64);
});

test('calculates window sill and upper and lower cripples', () => {
  const result = calculateWall({ ...base, openings: [window] });
  assert.equal(result.crippleCount, 4);
  assert.equal(result.sillCount, 1);
  assert.equal(cut(result, 'Window 1 rough sill').length, 36);
  assert.equal(cut(result, 'Window 1 bottom cripples').length, 34.5);
  assert.equal(cut(result, 'Window 1 top cripples').length, 2);
  assert.equal(result.plateLinearInches, 432);
});

test('accepts openings out of order and validates framing clearance', () => {
  const second = { ...door, left: 96, width: 30 };
  const result = calculateWall({ ...base, length: 180, openings: [second, door] });
  assert.equal(result.kingCount, 4);
  assert.equal(result.plateLinearInches, 474);
  assert.throws(() => calculateWall({ ...base, openings: [door, { ...door, left: 75 }] }), /6 inches/);
  assert.throws(() => calculateWall({ ...base, openings: [{ ...door, left: 4 }] }), /left edge/);
  assert.throws(() => calculateWall({ ...base, openings: [{ ...door, left: 105 }] }), /4½ inches/);
});

test('rejects invalid opening heights and dimensions', () => {
  assert.throws(() => calculateWall({ ...base, openings: [{ ...window, sill: 40 }] }), /fit between the plates/);
  assert.throws(() => calculateWall({ ...base, openings: [{ ...window, sill: 0 }] }), /sill height/);
  assert.throws(() => calculateWall({ ...base, length: NaN }), /Wall length/);
  assert.throws(() => calculateWall({ ...base, spacing: 0 }), /Stud spacing/);
});

test('does not count zero-length cripples and formats dimensions', () => {
  const result = calculateWall({ ...base, openings: [{ ...window, height: 50, headerDepth: 5.5 }] });
  assert.equal(result.crippleCount, 2);
  assert.equal(cut(result, 'Window 1 top cripples'), undefined);
  assert.equal(formatLength(91.5), '7 ft 7.5 in');
  assert.equal(formatLength(12), '1 ft 0 in');
});
