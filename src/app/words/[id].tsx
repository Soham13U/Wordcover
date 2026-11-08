import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ActionButton, Field, Muted, Prompt, Screen, Title } from '@/components/game-ui';
import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { newCustomPair, useGame } from '@/state/GameProvider';

export default function EditListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { library, saveCustomList, deleteCustomList } = useGame();
  const list = library.customLists.find((item) => item.id === id);
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [draftName, setDraftName] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const name = draftName ?? list?.name ?? '';

  if (!list) {
    return (
      <Screen footer={<ActionButton label="Back" variant="ghost" onPress={() => router.back()} />}>
        <Title>List missing</Title>
        <Muted>That word list is no longer on this phone.</Muted>
      </Screen>
    );
  }

  const sameWord = left.trim().toLocaleLowerCase() === right.trim().toLocaleLowerCase();
  const canAdd = left.trim().length > 0 && right.trim().length > 0 && !sameWord;

  function rename(nextName: string) {
    const trimmed = nextName.trim();
    if (!trimmed || !list) return;
    saveCustomList({ ...list, name: trimmed });
  }

  return (
    <Screen footer={<ActionButton label="Done" onPress={() => router.back()} />}>
      <Box className="gap-3">
        <Title>Edit list</Title>
        <Muted>One side is dealt to Civilians and the other to Undercover. The app flips that each game.</Muted>
      </Box>
      <Box className="gap-3">
        <Field value={name} onChangeText={setDraftName} placeholder="List name" />
        <ActionButton
          label="Save name"
          variant="secondary"
          disabled={name.trim().length === 0}
          onPress={() => rename(name)}
        />
      </Box>
      <Box className="gap-3">
        <Field value={left} onChangeText={setLeft} placeholder="Word for one side" />
        <Field value={right} onChangeText={setRight} placeholder="Similar word" />
        {sameWord && left.trim().length > 0 ? <Muted>The two words need to be different.</Muted> : null}
        <ActionButton
          label="Add pair"
          disabled={!canAdd}
          onPress={() => {
            saveCustomList({
              ...list,
              pairs: [...list.pairs, newCustomPair(left.trim(), right.trim())],
            });
            setLeft('');
            setRight('');
          }}
        />
      </Box>
      <Box>
        {list.pairs.length === 0 ? <Muted>No pairs in this list yet.</Muted> : null}
        {list.pairs.map((pair) => (
          <Box
            key={pair.id}
            className="flex-row items-center justify-between gap-3 border-b border-border py-4">
            <Text>
              {pair.left} / {pair.right}
            </Text>
            <Pressable
              onPress={() =>
                saveCustomList({
                  ...list,
                  pairs: list.pairs.filter((item) => item.id !== pair.id),
                })
              }>
              <Text className="text-destructive">Remove</Text>
            </Pressable>
          </Box>
        ))}
      </Box>
      <ActionButton
        label="Delete list"
        variant="destructive"
        onPress={() => setConfirmDelete(true)}
      />
      <Prompt
        visible={confirmDelete}
        title={`Delete ${list.name}?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          deleteCustomList(list.id);
          router.back();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}
