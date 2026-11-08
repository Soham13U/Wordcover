export type Role = 'civilian' | 'undercover' | 'mrWhite' | 'joker';

export type Winner = 'civilians' | 'undercover' | 'mrWhite' | 'joker';

/** Guess: Mr. White named the civilian word. Board: the living players ended the round. */
export type WinCause = 'guess' | 'board';

export type Phase = 'reveal' | 'board' | 'guess' | 'result';

export type Player = {
  id: string;
  name: string;
  role: Role;
  alive: boolean;
  /** Points earned in the current round. Zero until the round ends. */
  score: number;
  /** Session total, including this round once it has ended. */
  total: number;
};

export type MatchSettings = {
  names: string[];
  counts: RoleCounts;
  categories: string[];
  customListIds: string[];
};

export type GameState = {
  players: Player[];
  pairId: string;
  civilianWord: string;
  undercoverWord: string;
  phase: Phase;
  round: number;
  revealIndex: number;
  /** Seat order rotated so the first id gives the first clue and is not Mr. White. */
  turnOrder: string[];
  eliminatedId: string | null;
  winner: Winner | null;
  /** Missing on games saved before this field existed. */
  winCause?: WinCause;
  settings: MatchSettings;
};

export type WordPair = {
  id: string;
  category: string;
  left: string;
  right: string;
};

export type RoleCounts = {
  undercover: number;
  mrWhite: number;
  joker: number;
};
