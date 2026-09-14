import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseImport } from './importer.ts';

test('imports CSV, TSV, plain lists, JSON and exported HTML', () => {
  const want = [{ label: 'A', nl: 'kern', en: 'nucleus' }, { label: 'B', nl: 'cel; wand', en: '' }];
  assert.deepEqual(parseImport('label;nl;en\nA;kern;nucleus\nB;"cel; wand";', 'nl').items, want);
  assert.deepEqual(parseImport('A\tkern\tnucleus\r\nB\tcel; wand\t\r\n', 'nl').items, want);
  assert.deepEqual(parseImport('[["A","kern","nucleus"],{"label":"B","nl":"cel; wand"}]', 'nl').items, want);
  assert.deepEqual(parseImport('1. kern\n2 - cell wall\n\nvacuole', 'en').items, [
    { label: '1', nl: '', en: 'kern' }, { label: '2', nl: '', en: 'cell wall' }, { label: '3', nl: '', en: 'vacuole' },
  ]);
  const game = { title: { nl: 'Cel', en: 'Cell' }, question: { nl: '', en: '' }, image: '', items: want };
  assert.deepEqual(parseImport(JSON.stringify(game), 'nl'), game);
  assert.deepEqual(parseImport(`<script type="application/json" id="data">${JSON.stringify(game)}</script>`, 'nl'), game);
});
