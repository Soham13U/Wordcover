import { router } from 'expo-router';

import { ActionButton, Muted, Screen, Title } from '@/components/game-ui';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { useGame } from '@/state/GameProvider';

const links = [
  { label: 'How to play', href: '/rules' },
  { label: 'Word lists', href: '/words' },
  { label: 'Scores', href: '/history' },
] as const;

export default function HomeScreen() {
  const { ready, library } = useGame();
  const game = library.activeGame;
  const inProgress = game && game.phase !== 'result';

  return (
    <Screen align="center">
      <Box className="gap-8">
        <Title italic display>Wordcover</Title>
        <Box>
          <Box className="flex-row flex-wrap items-center">
            {links.map((link, index) => (
              <Box key={link.href} className="flex-row items-center">
                {index > 0 ? <Text className="px-3 text-muted-foreground">·</Text> : null}
                <Pressable onPress={() => router.push(link.href)} className="min-h-11 justify-center">
                  <Text>{link.label}</Text>
                </Pressable>
              </Box>
            ))}
          </Box>
          {!ready ? <Muted>Loading saved games…</Muted> : null}
        </Box>
        <Box className="gap-2 pt-4">
          {inProgress ? (
            <ActionButton label="Resume game" onPress={() => router.push('/play')} />
          ) : (
            <ActionButton label="New game" onPress={() => router.push('/setup')} />
          )}
          {game?.phase === 'result' ? (
            <ActionButton
              label="See last result"
              variant="ghost"
              onPress={() => router.push('/play')}
            />
          ) : null}
          {inProgress ? (
            <ActionButton label="New game" variant="ghost" onPress={() => router.push('/setup')} />
          ) : null}
        </Box>
      </Box>
    </Screen>
  );
}
