import AsyncStorage from '@react-native-async-storage/async-storage';

import type { GameState, RoleCounts } from '../game/types';
import { emptyLibrary, type SavedLibrary } from './library';

const KEY = 'wordcover.library.v1';

const phases = new Set(['reveal', 'board', 'guess', 'result']);

function withJokerCount(game: GameState): GameState {
  const counts = game.settings.counts as RoleCounts & { joker?: number };
  if (typeof counts.joker === 'number') return game;
  return {
    ...game,
    settings: {
      ...game.settings,
      counts: { ...counts, joker: 0 },
    },
  };
}

function isCurrentGame(game: GameState | null | undefined): game is GameState {
  if (!game || typeof game !== 'object') return false;
  if (!phases.has(game.phase)) return false;
  if (!game.settings?.counts || !Array.isArray(game.settings.names)) return false;
  if (!Array.isArray(game.settings.categories) || !Array.isArray(game.settings.customListIds)) {
    return false;
  }
  if (!Array.isArray(game.players)) return false;
  return game.players.every(
    (player) => typeof player.total === 'number' && typeof player.score === 'number',
  );
}

export async function loadLibrary(): Promise<SavedLibrary> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return emptyLibrary();
  try {
    const parsed = JSON.parse(raw) as Partial<SavedLibrary>;
    return {
      customLists: Array.isArray(parsed.customLists) ? parsed.customLists : [],
      usedPairIds: Array.isArray(parsed.usedPairIds) ? parsed.usedPairIds : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      activeGame: isCurrentGame(parsed.activeGame) ? withJokerCount(parsed.activeGame) : null,
    };
  } catch {
    return emptyLibrary();
  }
}

export async function saveLibrary(library: SavedLibrary): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(library));
}
