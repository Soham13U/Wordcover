import { router } from 'expo-router';

import { ActionButton, Muted, Screen, Title } from '@/components/game-ui';
import { Box } from '@/components/ui/box';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';

function Block({ title, body }: { title: string; body: string }) {
  return (
    <Box className="gap-2 border-b border-border py-6">
      <Heading size="lg">{title}</Heading>
      <Text className="leading-6">{body}</Text>
    </Box>
  );
}

export default function RulesScreen() {
  return (
    <Screen footer={<ActionButton label="Back" variant="ghost" onPress={() => router.back()} />}>
      <Box className="gap-3">
        <Title>How to play</Title>
        <Muted>Say the clues out loud. The app hides the words, records who is out, and keeps the score.</Muted>
      </Box>
      <Box>
        <Block
          title="Roles"
          body="Civilians all receive the same word. Undercovers receive a similar word and are not told which one they have. Mr. White is told they are Mr. White and receives no word. A Joker receives the civilian word and is told they are the Joker. Each round has at least two Civilians and at least one Undercover or Mr. White. Joker starts at zero."
        />
        <Block
          title="Clues"
          body="After everyone has seen their word, the app lists the players in speaking order. The first player is never Mr. White. Give one clue each, out loud, without saying the word, then talk it over at the table."
        />
        <Block
          title="Elimination"
          body="When the table agrees who is out, tap Eliminate next to that player and confirm. The app shows whether they were a Civilian, Undercover, Mr. White, or Joker. They stay in the list, marked out. If the player is the Joker, the round ends. Otherwise it continues."
        />
        <Block
          title="Mr. White"
          body="If Mr. White is eliminated, they get one guess at the Civilians' word. A correct guess wins the round immediately. A wrong guess removes them and the round checks the table. If only one Civilian remains with Mr. White still in and no Undercover left, Mr. White also guesses while alive. A miss then awards the round to the Civilians."
        />
        <Block
          title="Joker"
          body="The Joker wants to be eliminated. If a Joker is voted out, that player wins alone and scores 6. Everyone else scores 0, including any other Joker. A Joker who is still in when Civilians, Undercover, or Mr. White win scores 0. A living Joker does not stop those wins."
        />
        <Block
          title="Winning a round"
          body="Civilians win by removing every Undercover and Mr. White, even if a Joker is still in. Undercover wins if only one Civilian is left while an Undercover is still in. Mr. White wins only by guessing the civilian word. Winning Civilians score 2, a winning Mr. White scores 6, and winning Undercovers score 10. On an Undercover win, Mr. White still scores 6. An eliminated Joker scores 6 and wins alone."
        />
        <Block
          title="More rounds"
          body="After a round, the words and roles are revealed with the scores. Next round keeps the same players, role counts, and word lists, deals new words, and adds the points to the session tally."
        />
      </Box>
    </Screen>
  );
}
