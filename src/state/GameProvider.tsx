import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  advanceReveal,
  createMatch,
  dealNextRound,
  eliminatePlayer,
  submitGuess,
} from '../game/engine';
import type { GameState, RoleCounts } from '../game/types';
import { pickPair, pairsForCategories, type Category } from '../game/words';
import {
  emptyLibrary,
  historyFromGame,
  leaderboard,
  type CustomList,
  type CustomPair,
  type SavedLibrary,
} from '../storage/library';
import { loadLibrary, saveLibrary } from '../storage/persist';

type StartGameInput = {
  names: string[];
  counts: RoleCounts;
  categories: Category[];
  customListIds: string[];
};

type GameApi = {
  ready: boolean;
  library: SavedLibrary;
  standings: ReturnType<typeof leaderboard>;
  startGame: (input: StartGameInput) => void;
  clearActiveGame: () => void;
  clearHistory: () => void;
  resetUsedPairs: () => void;
  saveCustomList: (list: CustomList) => void;
  deleteCustomList: (id: string) => void;
  advanceReveal: () => void;
  eliminatePlayer: (playerId: string) => void;
  submitGuess: (guess: string) => void;
  startNextRound: () => void;
};

const GameContext = createContext<GameApi | null>(null);

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newCustomList(name: string): CustomList {
  return { id: createId('list'), name, pairs: [] };
}

export function newCustomPair(left: string, right: string): CustomPair {
  return { id: createId('pair'), left, right };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<SavedLibrary>(emptyLibrary());
  const [ready, setReady] = useState(false);
  const libraryRef = useRef(library);
  libraryRef.current = library;

  useEffect(() => {
    let cancelled = false;
    loadLibrary()
      .then((saved) => {
        if (cancelled) return;
        libraryRef.current = saved;
        setLibrary(saved);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = useCallback((recipe: (current: SavedLibrary) => SavedLibrary) => {
    const next = recipe(libraryRef.current);
    libraryRef.current = next;
    setLibrary(next);
    void saveLibrary(next);
  }, []);

  const applyGame = useCallback(
    (game: GameState) => {
      commit((current) => {
        const enteringResult = current.activeGame?.phase !== 'result' && game.phase === 'result';
        const entry = enteringResult ? historyFromGame(game) : null;
        return {
          ...current,
          activeGame: game,
          history: entry ? [entry, ...current.history].slice(0, 40) : current.history,
        };
      });
    },
    [commit],
  );

  const api = useMemo<GameApi>(() => {
    const update = (change: (game: GameState) => GameState) => {
      const game = libraryRef.current.activeGame;
      if (!game) return;
      applyGame(change(game));
    };

    return {
      ready,
      library,
      standings: leaderboard(library.history),
      startGame: (input) => {
        const customPairs = libraryRef.current.customLists
          .filter((list) => input.customListIds.includes(list.id))
          .flatMap((list) =>
            list.pairs.map((pair) => ({
              id: pair.id,
              category: list.id,
              left: pair.left,
              right: pair.right,
            })),
          );
        const pool = [...pairsForCategories(input.categories), ...customPairs];
        const draw = pickPair(pool, libraryRef.current.usedPairIds);
        const names = input.names.map((name) => name.trim());
        const game = createMatch({
          names,
          counts: input.counts,
          pair: draw.pair,
          categories: input.categories,
          customListIds: input.customListIds,
        });
        commit((current) => ({
          ...current,
          usedPairIds: draw.usedIds,
          activeGame: game,
        }));
      },
      clearActiveGame: () => {
        commit((current) => ({ ...current, activeGame: null }));
      },
      clearHistory: () => {
        commit((current) => ({ ...current, history: [] }));
      },
      resetUsedPairs: () => {
        commit((current) => ({ ...current, usedPairIds: [] }));
      },
      saveCustomList: (list) => {
        commit((current) => {
          const exists = current.customLists.some((item) => item.id === list.id);
          return {
            ...current,
            customLists: exists
              ? current.customLists.map((item) => (item.id === list.id ? list : item))
              : [...current.customLists, list],
          };
        });
      },
      deleteCustomList: (id) => {
        commit((current) => ({
          ...current,
          customLists: current.customLists.filter((list) => list.id !== id),
        }));
      },
      advanceReveal: () => update(advanceReveal),
      eliminatePlayer: (playerId) => update((game) => eliminatePlayer(game, playerId)),
      submitGuess: (guess) => update((game) => submitGuess(game, guess)),
      startNextRound: () => {
        const game = libraryRef.current.activeGame;
        if (!game) return;
        const customPairs = libraryRef.current.customLists
          .filter((list) => game.settings.customListIds.includes(list.id))
          .flatMap((list) =>
            list.pairs.map((pair) => ({
              id: pair.id,
              category: list.id,
              left: pair.left,
              right: pair.right,
            })),
          );
        const pool = [...pairsForCategories(game.settings.categories), ...customPairs];
        const draw = pickPair(pool, libraryRef.current.usedPairIds);
        const next = dealNextRound(game, draw.pair);
        commit((current) => ({
          ...current,
          usedPairIds: draw.usedIds,
          activeGame: next,
        }));
      },
    };
  }, [applyGame, commit, library, ready]);

  return <GameContext.Provider value={api}>{children}</GameContext.Provider>;
}

export function useGame() {
  const value = useContext(GameContext);
  if (!value) throw new Error('useGame must be used inside GameProvider.');
  return value;
}
