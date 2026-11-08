import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BUILTIN_PAIRS, pickPair } from './words.ts';

describe('word deck', () => {
  it('keeps 120 original pairs across six categories', () => {
    assert.equal(BUILTIN_PAIRS.length, 120);
    const categories = new Set(BUILTIN_PAIRS.map((pair) => pair.category));
    assert.deepEqual([...categories].sort(), [
      'activities',
      'animals',
      'food',
      'jobs',
      'objects',
      'places',
    ]);
  });

  it('reshuffles only the selected pool after every pair has been used', () => {
    const pool = BUILTIN_PAIRS.slice(0, 2);
    const first = pickPair(pool, ['other-list'], () => 0);
    assert.equal(first.pair.id, pool[0]?.id);
    assert.deepEqual(first.usedIds, ['other-list', pool[0]?.id]);

    const second = pickPair(pool, first.usedIds, () => 0);
    assert.equal(second.pair.id, pool[1]?.id);

    const recycled = pickPair(pool, second.usedIds, () => 0.99);
    assert.equal(recycled.pair.id, pool[1]?.id);
    assert.deepEqual(recycled.usedIds, ['other-list', pool[1]?.id]);
  });
});
