import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ActionButton, Dialog, Eyebrow, Field, Muted, Prompt, Screen, Title } from '@/components/game-ui';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import {
  eliminatePlayer as previewEliminate,
  playerById,
  secretFor,
  submitGuess as previewGuess,
} from '@/game/engine';
import { deciderNames, joinNames, roleLabel, winnerDetail, winnerLabel } from '@/game/labels';
import type { GameState, Player } from '@/game/types';
import { useGame } from '@/state/GameProvider';
import { ink, mutedInk } from '@/theme';

export default function PlayScreen() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  const gameApi = useGame();
  const game = gameApi.library.activeGame;
  const [confirmQuit, setConfirmQuit] = useState(false);

  useEffect(() => {
    if (!game) router.replace('/');
  }, [game]);

  function leaveGame() {
    setConfirmQuit(false);
    gameApi.clearActiveGame();
    router.replace('/');
  }

  function quit() {
    if (game?.phase === 'result') {
      leaveGame();
      return;
    }
    setConfirmQuit(true);
  }

  if (!game) return null;

  return (
    <Screen
      footer={
        <ActionButton
          label={game.phase === 'result' ? 'End session' : 'Quit game'}
          variant="ghost"
          onPress={quit}
        />
      }>
      <Phase game={game} />
      <Prompt
        visible={confirmQuit}
        title="Leave this game?"
        message="The match will be discarded."
        confirmLabel="Leave"
        cancelLabel="Keep playing"
        destructive
        onConfirm={leaveGame}
        onCancel={() => setConfirmQuit(false)}
      />
    </Screen>
  );
}

function Phase({ game }: { game: GameState }) {
  const api = useGame();
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  return (
    <>
      {game.phase === 'reveal' ? (
        <Reveal
          key={game.players[game.revealIndex]?.id ?? 'done'}
          game={game}
          onNext={api.advanceReveal}
        />
      ) : null}
      {game.phase === 'board' || game.phase === 'guess' ? (
        <Board game={game} onNotice={setNotice} />
      ) : null}
      {game.phase === 'result' ? <Result game={game} onNotice={setNotice} /> : null}
      <Prompt
        visible={notice !== null}
        title={notice?.title ?? ''}
        message={notice?.message}
        confirmLabel="OK"
        onConfirm={() => setNotice(null)}
      />
    </>
  );
}

function Reveal({ game, onNext }: { game: GameState; onNext: () => void }) {
  const player = game.players[game.revealIndex];
  const [held, setHeld] = useState(false);
  if (!player) return null;
  const secret = secretFor(player, game);
  const last = game.revealIndex === game.players.length - 1;

  return (
    <Box className="gap-8 pt-4">
      <Eyebrow>Round {game.round} · Pass the phone</Eyebrow>
      <Title>{player.name}</Title>
      <Pressable
        onPressIn={() => setHeld(true)}
        onPressOut={() => setHeld(false)}
        className="min-h-64 justify-center">
        <RevealWord held={held} secret={secret} joker={player.role === 'joker'} />
      </Pressable>
      <Muted>Hide the word before you hand the phone on. Do not say your role.</Muted>
      <ActionButton label={last ? 'Start the round' : 'Hide and pass'} onPress={onNext} />
    </Box>
  );
}

function RevealWord({
  held,
  secret,
  joker,
}: {
  held: boolean;
  secret: string | null;
  joker: boolean;
}) {
  const shown = useSharedValue(0);

  useEffect(() => {
    shown.set(
      withTiming(held ? 1 : 0, {
        duration: 180,
        reduceMotion: ReduceMotion.System,
      }),
    );
  }, [held, shown]);

  const hintStyle = useAnimatedStyle(() => ({ opacity: 1 - shown.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: shown.value }));
  const word = secret ?? 'You are Mr. White. You have no word.';

  return (
    <Box className="min-h-40 items-center justify-center">
      <Animated.View style={hintStyle} pointerEvents="none">
        <Text size="lg" className="text-center text-muted-foreground">
          Hold to see your word
        </Text>
      </Animated.View>
      {held ? (
        <Animated.View
          pointerEvents="none"
          style={[wordStyle, { position: 'absolute', left: 0, right: 0 }]}>
          <Heading size={secret ? '4xl' : 'xl'} italic className="text-center text-primary">
            {word}
          </Heading>
          {joker ? (
            <Text className="pt-3 text-center text-primary">You are the Joker.</Text>
          ) : null}
        </Animated.View>
      ) : null}
    </Box>
  );
}

function Board({
  game,
  onNotice,
}: {
  game: GameState;
  onNotice: (notice: { title: string; message: string }) => void;
}) {
  const api = useGame();
  const [guess, setGuess] = useState('');
  const [pending, setPending] = useState<Player | null>(null);
  const firstId = game.turnOrder[0];
  const first = firstId ? playerById(game, firstId) : null;
  const ordered = game.turnOrder.map((id) => playerById(game, id));
  const eliminated = game.eliminatedId ? playerById(game, game.eliminatedId) : null;
  const endgameGuess = eliminated?.role === 'mrWhite' && eliminated.alive;

  function applyEliminate() {
    const player = pending;
    if (!player) return;
    setPending(null);
    if (player.role === 'mrWhite') {
      api.eliminatePlayer(player.id);
      return;
    }
    const next = previewEliminate(game, player.id);
    api.eliminatePlayer(player.id);
    // Skip the role toast when the board immediately opens a guess or ends the round.
    if (next.phase === 'board') {
      onNotice({ title: player.name, message: `${roleLabel(player.role)}.` });
    }
  }

  return (
    <Box className="gap-6">
      <Eyebrow>Round {game.round}</Eyebrow>
      <Title>Who is out?</Title>
      <Text className="leading-6">
        {first
          ? `Clue order starts with ${first.name}. Skip anyone who is already out.`
          : 'Speak in this order at the table.'}{' '}
        Say the clues out loud. The words stay hidden.
      </Text>
      <Box>
        {ordered.map((player, index) => (
          <Box
            key={player.id}
            className="flex-row items-center justify-between gap-3 border-b border-border py-4">
            <Box className="flex-1">
              <Text bold>
                {index + 1}. {player.name}
              </Text>
              <Muted>{player.total} pts</Muted>
              {player.alive ? null : (
                <Text className="text-muted-foreground">Out · {roleLabel(player.role)}</Text>
              )}
            </Box>
            {player.alive && game.phase === 'board' ? (
              <Pressable onPress={() => setPending(player)}>
                <Text className="text-destructive">Eliminate</Text>
              </Pressable>
            ) : null}
          </Box>
        ))}
      </Box>
      <Prompt
        visible={pending !== null}
        title={pending ? `Eliminate ${pending.name}?` : ''}
        message="They leave this round."
        confirmLabel="Eliminate"
        cancelLabel="Cancel"
        destructive
        onConfirm={applyEliminate}
        onCancel={() => setPending(null)}
      />
      <Dialog visible={game.phase === 'guess'} onRequestClose={() => {}}>
        <Text
          className="text-xs uppercase tracking-widest text-muted-foreground"
          style={{ color: mutedInk, fontFamily: 'Outfit' }}>
          Mr. White
        </Text>
        <Heading size="2xl" style={{ color: ink, fontFamily: 'Fraunces' }}>
          {endgameGuess
            ? `${eliminated.name} guesses`
            : eliminated
              ? `${eliminated.name} is Mr. White`
              : 'Mr. White'}
        </Heading>
        <Text className="leading-6" style={{ color: ink, fontFamily: 'Outfit' }}>
          {endgameGuess
            ? 'Only one Civilian remains. Guess the civilian word. A miss awards the round to the Civilians.'
            : 'Guess the civilian word. Spelling can differ by case, not by letters.'}
        </Text>
        <Field value={guess} onChangeText={setGuess} placeholder="Your guess" />
        <ActionButton
          label="Guess"
          inset={false}
          disabled={guess.trim().length === 0}
          onPress={() => {
            const next = previewGuess(game, guess);
            api.submitGuess(guess);
            setGuess('');
            if (!next.winner) {
              onNotice({
                title: 'Wrong guess',
                message: 'The round continues. The civilian word stays hidden.',
              });
            }
          }}
        />
      </Dialog>
    </Box>
  );
}

function Result({
  game,
  onNotice,
}: {
  game: GameState;
  onNotice: (notice: { title: string; message: string }) => void;
}) {
  const api = useGame();
  const winner = game.winner ?? 'civilians';
  const names = deciderNames(game);
  const hero = names.length > 0 ? joinNames(names) : winnerLabel(winner);

  function nextRound() {
    try {
      api.startNextRound();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Check the word lists and try again.';
      onNotice({ title: 'Could not start the next round', message });
    }
  }

  return (
    <Box className="gap-10">
      <Box className="gap-3">
        <Eyebrow>Round {game.round}</Eyebrow>
        <Title italic display className="text-primary">
          {hero}
        </Title>
        {names.length > 0 ? <Heading size="2xl">{winnerLabel(winner)}</Heading> : null}
        <Muted>{winnerDetail(winner)}</Muted>
      </Box>
      <Box className="gap-4 border-b border-border py-2">
        <Box className="gap-1">
          <Muted>Civilians</Muted>
          <Heading size="2xl">{game.civilianWord}</Heading>
        </Box>
        <Box className="gap-1">
          <Muted>Undercover</Muted>
          <Heading size="2xl">{game.undercoverWord}</Heading>
        </Box>
      </Box>
      <Heading size="lg">Scores</Heading>
      <Box>
        {game.players.map((player) => (
          <PlayerScore key={player.id} player={player} />
        ))}
      </Box>
      <ActionButton label="Next round" onPress={nextRound} />
    </Box>
  );
}

function PlayerScore({ player }: { player: Player }) {
  return (
    <Box className="flex-row items-center justify-between border-b border-border py-4">
      <Box>
        <Text bold>{player.name}</Text>
        <Muted>{roleLabel(player.role)}</Muted>
      </Box>
      <Box className="items-end">
        <Text className="text-2xl text-primary">+{player.score}</Text>
        <Muted>{player.total} total</Muted>
      </Box>
    </Box>
  );
}
