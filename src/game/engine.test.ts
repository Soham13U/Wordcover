import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  advanceReveal,
  createMatch,
  dealNextRound,
  eliminatePlayer,
  randomValidRoles,
  scoreFor,
  secretFor,
  submitGuess,
  suggestRoles,
  validateRoles,
  wordsMatch,
} from './engine.ts';
import { deciderNames, joinNames } from './labels.ts';
import type { GameState, Role } from './types.ts';

const pair = { id: 'pair-apple', left: 'Apple', right: 'Pear' };
const settings = { categories: ['food'], customListIds: ['list-1'] };

function match(overrides?: {
  names?: string[];
  undercover?: number;
  mrWhite?: number;
  joker?: number;
  roles?: Role[];
  civilianSide?: 'left' | 'right';
  startingIndex?: number;
  totals?: Record<string, number>;
  round?: number;
}) {
  const names = overrides?.names ?? ['Ada', 'Bea', 'Cal', 'Dee'];
  return createMatch({
    names,
    counts: {
      undercover: overrides?.undercover ?? 1,
      mrWhite: overrides?.mrWhite ?? 0,
      joker: overrides?.joker ?? 0,
    },
    pair,
    categories: settings.categories,
    customListIds: settings.customListIds,
    civilianSide: overrides?.civilianSide ?? 'left',
    roles: overrides?.roles,
    startingIndex: overrides?.startingIndex ?? 0,
    totals: overrides?.totals,
    round: overrides?.round,
    rng: () => 0,
  });
}

function toBoard(state: GameState) {
  let next = state;
  while (next.phase === 'reveal') next = advanceReveal(next);
  return next;
}

describe('role setup', () => {
  it('suggests the free-game table', () => {
    assert.deepEqual(suggestRoles(3), { undercover: 1, mrWhite: 0, joker: 0 });
    assert.deepEqual(suggestRoles(4), { undercover: 1, mrWhite: 0, joker: 0 });
    assert.deepEqual(suggestRoles(6), { undercover: 1, mrWhite: 1, joker: 0 });
    assert.deepEqual(suggestRoles(10), { undercover: 2, mrWhite: 1, joker: 0 });
    assert.deepEqual(suggestRoles(12), { undercover: 2, mrWhite: 2, joker: 0 });
    assert.deepEqual(suggestRoles(15), { undercover: 3, mrWhite: 1, joker: 0 });
    assert.deepEqual(suggestRoles(18), { undercover: 3, mrWhite: 2, joker: 0 });
    assert.deepEqual(suggestRoles(20), { undercover: 4, mrWhite: 2, joker: 0 });
  });

  it('rejects a board without two civilians or an infiltrator', () => {
    assert.match(validateRoles(3, { undercover: 0, mrWhite: 0, joker: 0 }) ?? '', /at least one/i);
    assert.match(validateRoles(3, { undercover: 2, mrWhite: 0, joker: 0 }) ?? '', /two Civilians/i);
    assert.match(validateRoles(4, { undercover: 0, mrWhite: 0, joker: 2 }) ?? '', /at least one/i);
    assert.equal(validateRoles(5, { undercover: 1, mrWhite: 1, joker: 0 }), null);
    assert.equal(validateRoles(5, { undercover: 1, mrWhite: 0, joker: 1 }), null);
  });

  it('can roll a valid random setup', () => {
    const counts = randomValidRoles(5, () => 0.9);
    assert.equal(validateRoles(5, counts), null);
    assert.deepEqual(randomValidRoles(8, () => 0.1), suggestRoles(8));
  });
});

describe('match creation', () => {
  it('flips which side of the pair the civilians receive', () => {
    const left = match({ civilianSide: 'left' });
    const right = match({ civilianSide: 'right' });
    assert.equal(left.civilianWord, 'Apple');
    assert.equal(left.undercoverWord, 'Pear');
    assert.equal(right.civilianWord, 'Pear');
    assert.equal(right.undercoverWord, 'Apple');
  });

  it('keeps the setup and opens the board after the word pass', () => {
    const state = match({
      roles: ['civilian', 'undercover', 'civilian', 'mrWhite'],
      undercover: 1,
      mrWhite: 1,
    });
    assert.deepEqual(
      state.players.map((player) => player.role),
      ['civilian', 'undercover', 'civilian', 'mrWhite'],
    );
    assert.equal(state.phase, 'reveal');
    assert.deepEqual(state.settings, {
      names: ['Ada', 'Bea', 'Cal', 'Dee'],
      counts: { undercover: 1, mrWhite: 1, joker: 0 },
      categories: ['food'],
      customListIds: ['list-1'],
    });
    const revealed = toBoard(state);
    assert.equal(revealed.phase, 'board');
    assert.equal(revealed.turnOrder[0], 'p1');
  });

  it('never lets Mr. White give the first clue', () => {
    const roles: Role[] = ['mrWhite', 'civilian', 'civilian', 'undercover'];
    for (let step = 0; step < 20; step++) {
      const state = createMatch({
        names: ['Ada', 'Bea', 'Cal', 'Dee'],
        counts: { undercover: 1, mrWhite: 1, joker: 0 },
        pair,
        categories: settings.categories,
        customListIds: [],
        roles,
        rng: () => step / 20,
      });
      const first = state.players.find((player) => player.id === state.turnOrder[0]);
      assert.notEqual(first?.role, 'mrWhite');
    }
  });

  it('skips a requested starter who is Mr. White', () => {
    const state = match({
      roles: ['mrWhite', 'civilian', 'undercover', 'civilian'],
      undercover: 1,
      mrWhite: 1,
      startingIndex: 0,
    });
    assert.deepEqual(state.turnOrder, ['p2', 'p3', 'p4', 'p1']);
  });
});

describe('elimination and scoring', () => {
  it('stays on the board when a civilian leaves and the round is open', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal', 'Dee', 'Eli'],
        roles: ['civilian', 'civilian', 'civilian', 'undercover', 'mrWhite'],
        undercover: 1,
        mrWhite: 1,
      }),
    );
    state = eliminatePlayer(state, 'p2');
    assert.equal(state.phase, 'board');
    assert.equal(state.round, 1);
    assert.equal(state.turnOrder[0], 'p1');
    assert.equal(state.players.find((player) => player.id === 'p2')?.alive, false);
    assert.throws(() => eliminatePlayer(state, 'p2'), /already out/);
  });

  it('gives civilians 2 points when the last infiltrator is out', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal'],
        roles: ['civilian', 'civilian', 'undercover'],
        undercover: 1,
      }),
    );
    state = eliminatePlayer(state, 'p3');
    assert.equal(state.winner, 'civilians');
    assert.equal(state.phase, 'result');
    assert.deepEqual(
      state.players.map((player) => player.score),
      [2, 2, 0],
    );
    assert.deepEqual(
      state.players.map((player) => player.total),
      [2, 2, 0],
    );
    assert.equal(scoreFor('civilian', 'civilians'), 2);
  });

  it('names Undercover the winner when one civilian remains', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal', 'Dee'],
        roles: ['civilian', 'civilian', 'undercover', 'mrWhite'],
        undercover: 1,
        mrWhite: 1,
      }),
    );
    state = eliminatePlayer(state, 'p1');
    assert.equal(state.winner, 'undercover');
    assert.equal(state.winCause, 'board');
    assert.deepEqual(deciderNames(state), ['Cal']);
    assert.deepEqual(
      state.players.map((player) => player.score),
      [0, 0, 10, 6],
    );
  });

  it('scores only Mr. White when the civilian word is guessed', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal', 'Dee'],
        roles: ['civilian', 'civilian', 'undercover', 'mrWhite'],
        undercover: 1,
        mrWhite: 1,
        civilianSide: 'left',
      }),
    );
    state = eliminatePlayer(state, 'p4');
    assert.equal(state.phase, 'guess');
    assert.equal(state.players.find((player) => player.id === 'p4')?.alive, false);
    assert.equal(wordsMatch('  apple ', 'Apple'), true);

    const won = submitGuess(state, ' apple ');
    assert.equal(won.winner, 'mrWhite');
    assert.equal(won.winCause, 'guess');
    assert.deepEqual(deciderNames(won), ['Dee']);
    const { winCause: guessedCause, ...savedGuess } = won;
    assert.equal(guessedCause, 'guess');
    assert.deepEqual(deciderNames(savedGuess), ['Dee']);
    assert.deepEqual(
      won.players.map((player) => player.score),
      [0, 0, 0, 6],
    );
  });

  it('gives civilians the win when Mr. White misses and was the last infiltrator', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal'],
        roles: ['civilian', 'civilian', 'mrWhite'],
        undercover: 0,
        mrWhite: 1,
      }),
    );
    state = eliminatePlayer(state, 'p3');
    state = submitGuess(state, 'pear');
    assert.equal(state.winner, 'civilians');
    assert.deepEqual(
      state.players.map((player) => player.score),
      [2, 2, 0],
    );
  });

  it('lets Mr. White win by outlasting the civilians', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal'],
        roles: ['civilian', 'civilian', 'mrWhite'],
        undercover: 0,
        mrWhite: 1,
      }),
    );
    state = eliminatePlayer(state, 'p1');
    assert.equal(state.winner, 'mrWhite');
    assert.equal(state.winCause, 'board');
    assert.deepEqual(deciderNames(state), ['Cal']);
    const { winCause: boardCause, ...savedBoard } = state;
    assert.equal(boardCause, 'board');
    assert.deepEqual(deciderNames(savedBoard), ['Cal']);
    assert.deepEqual(
      state.players.map((player) => player.score),
      [0, 0, 6],
    );
  });

  it('lets the Joker give the first clue and shows the civilian word', () => {
    const state = match({
      roles: ['joker', 'civilian', 'civilian', 'undercover'],
      undercover: 1,
      joker: 1,
      startingIndex: 0,
      civilianSide: 'left',
    });
    assert.equal(state.turnOrder[0], 'p1');
    const joker = state.players[0];
    assert.ok(joker);
    assert.equal(secretFor(joker, state), 'Apple');
  });

  it('ends the round when a Joker is eliminated and scores only that Joker', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal', 'Dee', 'Eli'],
        roles: ['joker', 'joker', 'civilian', 'civilian', 'undercover'],
        undercover: 1,
        joker: 2,
      }),
    );
    state = eliminatePlayer(state, 'p1');
    assert.equal(state.winner, 'joker');
    assert.equal(state.phase, 'result');
    assert.equal(state.winCause, 'board');
    assert.deepEqual(deciderNames(state), ['Ada']);
    assert.deepEqual(
      state.players.map((player) => player.score),
      [6, 0, 0, 0, 0],
    );
    assert.equal(scoreFor('joker', 'joker'), 0);
  });

  it('scores a living Joker nothing when the civilians win', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal', 'Dee'],
        roles: ['civilian', 'civilian', 'undercover', 'joker'],
        undercover: 1,
        joker: 1,
      }),
    );
    state = eliminatePlayer(state, 'p3');
    assert.equal(state.winner, 'civilians');
    assert.equal(state.players.find((player) => player.id === 'p4')?.alive, true);
    assert.deepEqual(
      state.players.map((player) => player.score),
      [2, 2, 0, 0],
    );
  });

  it('returns to the same clue order after a wrong guess', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal', 'Dee', 'Eli'],
        roles: ['civilian', 'civilian', 'civilian', 'undercover', 'mrWhite'],
        undercover: 1,
        mrWhite: 1,
        startingIndex: 0,
      }),
    );
    state = eliminatePlayer(state, 'p5');
    state = submitGuess(state, 'nope');
    assert.equal(state.phase, 'board');
    assert.equal(state.round, 1);
    assert.equal(state.turnOrder[0], 'p1');
    assert.equal(state.players.find((player) => player.id === 'p5')?.alive, false);
  });
});

describe('winner names', () => {
  it('joins deciding players in a sentence', () => {
    assert.equal(joinNames(['Bea']), 'Bea');
    assert.equal(joinNames(['Bea', 'Dee']), 'Bea and Dee');
    assert.equal(joinNames(['Bea', 'Cal', 'Dee']), 'Bea, Cal, and Dee');
  });
});

describe('later rounds', () => {
  it('carries settings and totals into the next round', () => {
    let state = toBoard(
      match({
        names: ['Ada', 'Bea', 'Cal'],
        roles: ['civilian', 'civilian', 'undercover'],
        undercover: 1,
        totals: { p1: 4, p2: 2, p3: 6 },
      }),
    );
    state = eliminatePlayer(state, 'p3');
    assert.deepEqual(
      state.players.map((player) => player.total),
      [6, 4, 6],
    );

    const next = dealNextRound(state, { id: 'pair-cat', left: 'Cat', right: 'Dog' }, () => 0);
    assert.equal(next.phase, 'reveal');
    assert.equal(next.round, 2);
    assert.equal(next.winner, null);
    assert.deepEqual(next.settings, state.settings);
    assert.deepEqual(
      next.players.map((player) => player.total),
      [6, 4, 6],
    );
    assert.deepEqual(
      next.players.map((player) => player.score),
      [0, 0, 0],
    );
    assert.notEqual(next.pairId, state.pairId);
    const first = next.players.find((player) => player.id === next.turnOrder[0]);
    assert.notEqual(first?.role, 'mrWhite');

    const finished = wipeInfiltrators(toBoard(next));
    assert.equal(finished.winner, 'civilians');
    finished.players.forEach((player, index) => {
      assert.equal(player.total, (next.players[index]?.total ?? 0) + player.score);
    });
  });

  it('refuses to deal before the round ends', () => {
    const state = match();
    assert.throws(() => dealNextRound(state, pair), /Finish the round/);
  });
});

function wipeInfiltrators(state: GameState) {
  let next = state;
  while (next.phase !== 'result') {
    const target = next.players.find((player) => player.alive && player.role !== 'civilian');
    assert.ok(target);
    next = eliminatePlayer(next, target.id);
    if (next.phase === 'guess') next = submitGuess(next, 'nope');
  }
  return next;
}
