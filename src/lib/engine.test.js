import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deal, backOf } from './engine.js';

test('every deal is a valid mini-loco solution', () => {
  for (let i = 0; i < 3000; i++) {
    const { items, solution } = deal(22);
    assert.equal(new Set(items).size, 12);
    assert.deepEqual([...solution].sort((a, b) => a - b), [...Array(12).keys()]);
    for (let c = 0; c < 3; c++) { // each colour column pair on the board is one colour of the real box
      const colours = [2 * c, 2 * c + 1, 2 * c + 6, 2 * c + 7].map(s => backOf(solution[s]).color);
      assert.equal(new Set(colours).size, 1);
    }
  }
});
