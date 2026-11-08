import { boardWinner } from './engine.ts';
import type { GameState, Player, Role, Winner } from './types.ts';

export function roleLabel(role: Role | string) {
  if (role === 'mrWhite') return 'Mr. White';
  if (role === 'undercover') return 'Undercover';
  if (role === 'joker') return 'Joker';
  return 'Civilian';
}

export function winnerLabel(winner: Winner | 'infiltrators') {
  if (winner === 'joker') return 'Joker wins';
  if (winner === 'mrWhite') return 'Mr. White wins';
  if (winner === 'undercover' || winner === 'infiltrators') return 'Undercover wins';
  return 'Civilians win';
}

export function winnerDetail(winner: Winner | 'infiltrators') {
  if (winner === 'joker') return 'The Joker was eliminated.';
  if (winner === 'mrWhite') return 'Mr. White takes the round.';
  if (winner === 'undercover' || winner === 'infiltrators') return 'Only one Civilian was left.';
  return 'Every Undercover and Mr. White was found.';
}

export function joinNames(names: string[]): string {
  if (names.length === 0) return '';
  const [only] = names;
  if (names.length === 1) return only ?? '';
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

function namesWithRole(players: Player[], role: Player['role'], alive: boolean) {
  return players.filter((player) => player.role === role && player.alive === alive).map((player) => player.name);
}

/** Players who decided the round. Civilians win as a team, so the list is empty. */
export function deciderNames(
  game: Pick<GameState, 'players' | 'winner' | 'eliminatedId' | 'winCause'>,
): string[] {
  if (game.winner === 'joker') {
    const eliminated = game.players.find(
      (player) => player.id === game.eliminatedId && player.role === 'joker',
    );
    return eliminated ? [eliminated.name] : [];
  }
  if (game.winner === 'undercover') return namesWithRole(game.players, 'undercover', true);
  if (game.winner !== 'mrWhite') return [];

  if (game.winCause === 'guess') {
    const guesser = game.players.find(
      (player) => player.id === game.eliminatedId && player.role === 'mrWhite',
    );
    return guesser ? [guesser.name] : [];
  }

  if (game.winCause === 'board' || boardWinner(game.players) === 'mrWhite') {
    return namesWithRole(game.players, 'mrWhite', true);
  }

  const eliminated = game.players.find(
    (player) => player.id === game.eliminatedId && player.role === 'mrWhite',
  );
  return eliminated ? [eliminated.name] : [];
}
