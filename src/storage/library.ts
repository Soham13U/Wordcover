import type { GameState, Winner } from '../game/types';

export type CustomPair = {
  id: string;
  left: string;
  right: string;
};

export type CustomList = {
  id: string;
  name: string;
  pairs: CustomPair[];
};

export type HistoryPlayer = {
  name: string;
  role: string;
  score: number;
};

export type HistoryEntry = {
  id: string;
  playedAt: string;
  winner: Winner;
  civilianWord: string;
  undercoverWord: string;
  players: HistoryPlayer[];
};

export type SavedLibrary = {
  customLists: CustomList[];
  usedPairIds: string[];
  history: HistoryEntry[];
  activeGame: GameState | null;
};

export const emptyLibrary = (): SavedLibrary => ({
  customLists: [],
  usedPairIds: [],
  history: [],
  activeGame: null,
});

export function historyFromGame(game: GameState): HistoryEntry | null {
  if (!game.winner) return null;
  return {
    id: `${Date.now()}`,
    playedAt: new Date().toISOString(),
    winner: game.winner,
    civilianWord: game.civilianWord,
    undercoverWord: game.undercoverWord,
    players: game.players.map((player) => ({
      name: player.name,
      role: player.role,
      score: player.score,
    })),
  };
}

export function leaderboard(history: HistoryEntry[]) {
  const totals = new Map<string, { name: string; points: number; games: number }>();
  for (const game of history) {
    for (const player of game.players) {
      const key = player.name.trim().toLocaleLowerCase();
      const current = totals.get(key) ?? { name: player.name.trim(), points: 0, games: 0 };
      current.points += player.score;
      current.games += 1;
      totals.set(key, current);
    }
  }
  return [...totals.values()].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name),
  );
}
