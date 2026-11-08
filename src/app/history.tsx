import { router } from 'expo-router';
import { useState } from 'react';

import { ActionButton, Muted, Prompt, Screen, Title } from '@/components/game-ui';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { roleLabel, winnerLabel } from '@/game/labels';
import { useGame } from '@/state/GameProvider';

export default function HistoryScreen() {
  const { library, standings, clearHistory } = useGame();
  const [confirmingClear, setConfirmingClear] = useState(false);

  return (
    <Screen footer={<ActionButton label="Back" variant="ghost" onPress={() => router.back()} />}>
      <Title>Scores</Title>
      <Box>
        <Heading size="lg" className="pb-1">
          Leaderboard
        </Heading>
        {standings.length === 0 ? (
          <Muted>Finish a game and the names will show up here.</Muted>
        ) : (
          standings.map((row) => (
            <Box
              key={row.name}
              className="flex-row items-center justify-between border-b border-border py-4">
              <Box>
                <Text bold>{row.name}</Text>
                <Muted>
                  {row.games} {row.games === 1 ? 'game' : 'games'}
                </Muted>
              </Box>
              <Text className="text-2xl text-primary">{row.points}</Text>
            </Box>
          ))
        )}
      </Box>
      <Box>
        <Heading size="lg" className="pb-1">
          Recent games
        </Heading>
        {library.history.length === 0 ? <Muted>No games yet.</Muted> : null}
        {library.history.map((entry) => (
          <Box key={entry.id} className="gap-1 border-b border-border py-4">
            <Text bold>{entry.winner ? winnerLabel(entry.winner) : 'Game'}</Text>
            <Muted>{new Date(entry.playedAt).toLocaleString()}</Muted>
            <Text>
              {entry.civilianWord} / {entry.undercoverWord}
            </Text>
            <Text>
              {entry.players
                .map((player) => `${player.name} ${roleLabel(player.role)} +${player.score}`)
                .join(' · ')}
            </Text>
          </Box>
        ))}
      </Box>
      {library.history.length > 0 ? (
        <ActionButton
          label="Clear history"
          variant="destructive"
          onPress={() => setConfirmingClear(true)}
        />
      ) : null}
      <Prompt
        visible={confirmingClear}
        title="Clear scores?"
        message="This removes the saved games on this phone."
        confirmLabel="Clear"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setConfirmingClear(false);
          clearHistory();
        }}
        onCancel={() => setConfirmingClear(false)}
      />
    </Screen>
  );
}
