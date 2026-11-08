import type {
  GameState,
  MatchSettings,
  Phase,
  Player,
  Role,
  RoleCounts,
  WinCause,
  Winner,
} from './types.ts';

const defaultRng = Math.random;

function suggested(undercover: number, mrWhite: number): RoleCounts {
  return { undercover, mrWhite, joker: 0 };
}

export function suggestRoles(playerCount: number): RoleCounts {
  if (playerCount <= 4) return suggested(1, 0);
  if (playerCount <= 6) return suggested(1, 1);
  if (playerCount <= 10) return suggested(2, 1);
  if (playerCount <= 12) return suggested(2, 2);
  if (playerCount <= 15) return suggested(3, 1);
  if (playerCount <= 18) return suggested(3, 2);
  return suggested(4, 2);
}

export function validateRoles(playerCount: number, counts: RoleCounts): string | null {
  if (playerCount < 3 || playerCount > 20) {
    return 'Use between 3 and 20 players.';
  }
  if (
    !Number.isInteger(counts.undercover) ||
    !Number.isInteger(counts.mrWhite) ||
    !Number.isInteger(counts.joker)
  ) {
    return 'Role counts must be whole numbers.';
  }
  if (counts.undercover < 0 || counts.mrWhite < 0 || counts.joker < 0) {
    return 'Role counts cannot be negative.';
  }
  if (counts.undercover + counts.mrWhite < 1) {
    return 'Add at least one Undercover or Mr. White.';
  }
  const civilians = playerCount - counts.undercover - counts.mrWhite - counts.joker;
  if (civilians < 2) {
    return 'Keep at least two Civilians.';
  }
  return null;
}

export function validRoleOptions(playerCount: number): RoleCounts[] {
  const options: RoleCounts[] = [];
  for (let undercover = 0; undercover <= playerCount - 2; undercover++) {
    for (let mrWhite = 0; mrWhite <= playerCount - 2 - undercover; mrWhite++) {
      for (let joker = 0; joker <= playerCount - 2 - undercover - mrWhite; joker++) {
        const counts = { undercover, mrWhite, joker };
        if (!validateRoles(playerCount, counts)) options.push(counts);
      }
    }
  }
  return options;
}

export function randomValidRoles(playerCount: number, rng: () => number = defaultRng): RoleCounts {
  const options = validRoleOptions(playerCount);
  const suggested = suggestRoles(playerCount);
  if (rng() < 0.5) return suggested;
  return options[Math.floor(rng() * options.length)] ?? suggested;
}

export function wordsMatch(guess: string, word: string): boolean {
  return guess.trim().toLocaleLowerCase() === word.trim().toLocaleLowerCase();
}

export function shuffle<T>(items: T[], rng: () => number = defaultRng): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const swap = next[i];
    next[i] = next[j];
    next[j] = swap;
  }
  return next;
}

type CreateMatchInput = {
  names: string[];
  counts: RoleCounts;
  pair: { id: string; left: string; right: string };
  categories: string[];
  customListIds: string[];
  civilianSide?: 'left' | 'right';
  roles?: Role[];
  startingIndex?: number;
  totals?: Record<string, number>;
  round?: number;
  rng?: () => number;
};

export function createMatch(input: CreateMatchInput): GameState {
  const names = input.names.map((name) => name.trim());
  const error = validateRoles(names.length, input.counts);
  if (error) throw new Error(error);
  if (new Set(names.map((name) => name.toLocaleLowerCase())).size !== names.length) {
    throw new Error('Player names must be unique.');
  }
  if (names.some((name) => name.length === 0)) {
    throw new Error('Every player needs a name.');
  }

  const rng = input.rng ?? defaultRng;
  const civilianCount =
    names.length - input.counts.undercover - input.counts.mrWhite - input.counts.joker;
  const roles =
    input.roles ??
    shuffle(
      [
        ...Array.from({ length: civilianCount }, () => 'civilian' as const),
        ...Array.from({ length: input.counts.undercover }, () => 'undercover' as const),
        ...Array.from({ length: input.counts.mrWhite }, () => 'mrWhite' as const),
        ...Array.from({ length: input.counts.joker }, () => 'joker' as const),
      ],
      rng,
    );

  if (roles.length !== names.length) {
    throw new Error('Role list does not match the player count.');
  }
  const assigned = {
    undercover: roles.filter((role) => role === 'undercover').length,
    mrWhite: roles.filter((role) => role === 'mrWhite').length,
    joker: roles.filter((role) => role === 'joker').length,
  };
  if (
    assigned.undercover !== input.counts.undercover ||
    assigned.mrWhite !== input.counts.mrWhite ||
    assigned.joker !== input.counts.joker
  ) {
    throw new Error('Role list does not match the selected counts.');
  }

  const civilianSide = input.civilianSide ?? (rng() < 0.5 ? 'left' : 'right');
  const civilianWord = civilianSide === 'left' ? input.pair.left : input.pair.right;
  const undercoverWord = civilianSide === 'left' ? input.pair.right : input.pair.left;
  const settings: MatchSettings = {
    names,
    counts: input.counts,
    categories: input.categories,
    customListIds: input.customListIds,
  };
  const players: Player[] = names.map((name, index) => {
    const id = `p${index + 1}`;
    const role = roles[index];
    if (!role) throw new Error('Role list does not match the player count.');
    return {
      id,
      name,
      role,
      alive: true,
      score: 0,
      total: input.totals?.[id] ?? 0,
    };
  });
  const starter = players[firstSpeakerIndex(players, input.startingIndex, rng)];
  if (!starter) throw new Error('Could not choose a starting player.');

  return {
    players,
    pairId: input.pair.id,
    civilianWord,
    undercoverWord,
    phase: 'reveal',
    round: input.round ?? 1,
    revealIndex: 0,
    turnOrder: orderFrom(players, starter.id),
    eliminatedId: null,
    winner: null,
    settings,
  };
}

export function advanceReveal(state: GameState): GameState {
  assertPhase(state, 'reveal');
  const nextIndex = state.revealIndex + 1;
  if (nextIndex < state.players.length) {
    return { ...state, revealIndex: nextIndex };
  }
  return { ...state, revealIndex: nextIndex, phase: 'board' };
}

export function eliminatePlayer(state: GameState, playerId: string): GameState {
  assertPhase(state, 'board');
  const player = playerById(state, playerId);
  if (!player.alive) throw new Error('That player is already out.');
  const killed = markDead(state, playerId);
  if (player.role === 'joker') {
    return finish(killed, 'joker', 'board');
  }
  if (player.role === 'mrWhite') {
    return { ...killed, phase: 'guess', eliminatedId: playerId };
  }
  return settleOrContinue(killed);
}

export function submitGuess(state: GameState, guess: string): GameState {
  assertPhase(state, 'guess');
  if (wordsMatch(guess, state.civilianWord)) {
    return finish(state, 'mrWhite', 'guess');
  }
  return settleOrContinue(state);
}

export function dealNextRound(
  state: GameState,
  pair: { id: string; left: string; right: string },
  rng: () => number = defaultRng,
): GameState {
  if (state.phase !== 'result') {
    throw new Error('Finish the round before starting another.');
  }
  const totals: Record<string, number> = {};
  for (const player of state.players) totals[player.id] = player.total;
  return createMatch({
    names: state.settings.names,
    counts: state.settings.counts,
    pair,
    categories: state.settings.categories,
    customListIds: state.settings.customListIds,
    totals,
    round: state.round + 1,
    rng,
  });
}

export function playerById(state: GameState, id: string): Player {
  const player = state.players.find((item) => item.id === id);
  if (!player) throw new Error(`Unknown player ${id}.`);
  return player;
}

export function secretFor(player: Player, state: GameState): string | null {
  if (player.role === 'mrWhite') return null;
  if (player.role === 'undercover') return state.undercoverWord;
  return state.civilianWord;
}

const jokerWinScore = 6;

export function scoreFor(role: Role, winner: Winner): number {
  if (winner === 'joker') return 0;
  if (winner === 'civilians') return role === 'civilian' ? 2 : 0;
  if (winner === 'mrWhite') return role === 'mrWhite' ? 6 : 0;
  if (role === 'undercover') return 10;
  if (role === 'mrWhite') return 6;
  return 0;
}

function settleOrContinue(state: GameState): GameState {
  const winner = boardWinner(state.players);
  if (winner) return finish(state, winner, 'board');
  return { ...state, phase: 'board' };
}

function finish(state: GameState, winner: Winner, winCause: WinCause): GameState {
  return {
    ...state,
    winner,
    winCause,
    phase: 'result',
    players: state.players.map((player) => {
      const score =
        winner === 'joker'
          ? player.id === state.eliminatedId && player.role === 'joker'
            ? jokerWinScore
            : 0
          : scoreFor(player.role, winner);
      return { ...player, score, total: player.total + score };
    }),
  };
}

export function boardWinner(players: Player[]): Winner | null {
  const alive = players.filter((player) => player.alive);
  const civilians = alive.filter((player) => player.role === 'civilian').length;
  const infiltrators = alive.filter(
    (player) => player.role === 'undercover' || player.role === 'mrWhite',
  ).length;
  if (infiltrators === 0 && civilians > 0) return 'civilians';
  if (civilians <= 1 && infiltrators > 0) {
    const undercoverAlive = alive.some((player) => player.role === 'undercover');
    return undercoverAlive ? 'undercover' : 'mrWhite';
  }
  return null;
}

function markDead(state: GameState, playerId: string): GameState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.id === playerId ? { ...player, alive: false } : player,
    ),
    eliminatedId: playerId,
  };
}

function orderFrom(players: Player[], starterId: string): string[] {
  const start = players.findIndex((player) => player.id === starterId);
  if (start < 0) return players.map((player) => player.id);
  return [...players.slice(start), ...players.slice(0, start)].map((player) => player.id);
}

function firstSpeakerIndex(
  players: Player[],
  startingIndex: number | undefined,
  rng: () => number,
): number {
  const eligible = players
    .map((player, index) => ({ player, index }))
    .filter((item) => item.player.role !== 'mrWhite');
  if (eligible.length === 0) throw new Error('Could not choose a starting player.');
  if (startingIndex !== undefined) {
    const requested = players[startingIndex];
    if (!requested) throw new Error('Could not choose a starting player.');
    if (requested.role !== 'mrWhite') return startingIndex;
    for (let step = 1; step <= players.length; step++) {
      const index = (startingIndex + step) % players.length;
      if (players[index]?.role !== 'mrWhite') return index;
    }
  }
  const pick = eligible[Math.floor(rng() * eligible.length)];
  if (!pick) throw new Error('Could not choose a starting player.');
  return pick.index;
}

function assertPhase(state: GameState, phase: Phase) {
  if (state.phase !== phase) {
    throw new Error(`Expected phase ${phase} but found ${state.phase}.`);
  }
}
