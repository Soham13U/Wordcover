import { router } from 'expo-router';
import { useState } from 'react';

import { ActionButton, Field, Muted, Prompt, Screen, Title } from '@/components/game-ui';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { newCustomList, useGame } from '@/state/GameProvider';

export default function WordsScreen() {
  const { library, saveCustomList, deleteCustomList, resetUsedPairs } = useGame();
  const [name, setName] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const deleting = library.customLists.find((list) => list.id === deleteId);

  function createList() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = newCustomList(trimmed);
    saveCustomList(list);
    setName('');
    router.push(`/words/${list.id}`);
  }

  return (
    <Screen footer={<ActionButton label="Back" variant="ghost" onPress={() => router.back()} />}>
      <Box className="gap-3">
        <Title>Word lists</Title>
        <Muted>
          The built-in deck has 120 original pairs in six categories. Your own pairs are stored only
          on this phone. A pair is not drawn again until every selected pair has been used.
        </Muted>
      </Box>
      <Box className="gap-3">
        <ActionButton
          label="Reset used words"
          variant="secondary"
          onPress={() => setConfirmReset(true)}
        />
        <Field value={name} onChangeText={setName} placeholder="New list name" />
        <ActionButton label="Create list" disabled={name.trim().length === 0} onPress={createList} />
      </Box>
      <Box>
        {library.customLists.length === 0 ? <Muted>No custom lists yet.</Muted> : null}
        {library.customLists.map((list) => (
          <Box
            key={list.id}
            className="flex-row items-center justify-between gap-3 border-b border-border py-4">
            <Pressable onPress={() => router.push(`/words/${list.id}`)} className="flex-1">
              <Text bold>{list.name}</Text>
              <Muted>
                {list.pairs.length} {list.pairs.length === 1 ? 'pair' : 'pairs'}
              </Muted>
            </Pressable>
            <Pressable onPress={() => setDeleteId(list.id)}>
              <Text className="text-destructive">Delete</Text>
            </Pressable>
          </Box>
        ))}
      </Box>
      <Prompt
        visible={confirmReset}
        title="Reset the deck?"
        message="Previously used pairs can come up again."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={() => {
          setConfirmReset(false);
          resetUsedPairs();
        }}
        onCancel={() => setConfirmReset(false)}
      />
      <Prompt
        visible={deleting !== undefined}
        title={deleting ? `Delete ${deleting.name}?` : ''}
        message="The pairs in this list will be removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          if (!deleting) return;
          const id = deleting.id;
          setDeleteId(null);
          deleteCustomList(id);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </Screen>
  );
}
