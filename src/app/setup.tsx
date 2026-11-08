import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import Animated, {
  interpolateColor,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ActionButton, Field, Muted, Screen, Title } from '@/components/game-ui';
import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { suggestRoles, validateRoles, randomValidRoles } from '@/game/engine';
import { CATEGORIES, CATEGORY_LABELS, pairsForCategories, type Category } from '@/game/words';
import { useGame } from '@/state/GameProvider';
import { hairline, mutedInk, paper, primaryForeground, vermillion } from '@/theme';

const toggleTiming = { duration: 180, reduceMotion: ReduceMotion.System };
const thumbTravel = 28;

function nameError(names: string[]) {
  const trimmed = names.map((name) => name.trim());
  if (trimmed.some((name) => name.length === 0)) return 'Every player needs a name.';
  const keys = trimmed.map((name) => name.toLocaleLowerCase());
  if (new Set(keys).size !== keys.length) return 'Player names have to be unique.';
  return null;
}

export default function SetupScreen() {
  const { library, startGame } = useGame();
  const [names, setNames] = useState(['Ada', 'Bea', 'Cal', 'Dee']);
  const [counts, setCounts] = useState(suggestRoles(4));
  const [manualRoles, setManualRoles] = useState(false);
  const [categories, setCategories] = useState<Category[]>([...CATEGORIES]);
  const [listIds, setListIds] = useState<string[]>([]);

  const rolesError = validateRoles(names.length, counts);
  const namesError = nameError(names);
  const customPairs = library.customLists
    .filter((list) => listIds.includes(list.id))
    .reduce((total, list) => total + list.pairs.length, 0);
  const poolCount = pairsForCategories(categories).length + customPairs;
  const sourceError = poolCount === 0 ? 'Turn on a category or a custom list that has pairs.' : null;
  const blocked = Boolean(rolesError || namesError || sourceError);

  function resize(nextCount: number) {
    const count = Math.min(20, Math.max(3, nextCount));
    setNames((current) => {
      if (count === current.length) return current;
      if (count > current.length) {
        const added = Array.from(
          { length: count - current.length },
          (_, index) => `Player ${current.length + index + 1}`,
        );
        return [...current, ...added];
      }
      return current.slice(0, count);
    });
    setCounts((current) => {
      if (!manualRoles) return suggestRoles(count);
      return validateRoles(count, current) === null ? current : suggestRoles(count);
    });
  }

  function changeRole(key: 'undercover' | 'mrWhite' | 'joker', delta: number) {
    setManualRoles(true);
    setCounts((current) => {
      const next = { ...current, [key]: current[key] + delta };
      return validateRoles(names.length, next) === null ? next : current;
    });
  }

  function toggleCategory(category: Category) {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function toggleList(id: string) {
    setListIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <Screen
      footer={
        <>
          {blocked ? <Muted>{rolesError ?? namesError ?? sourceError}</Muted> : null}
          <ActionButton
            label="Deal words"
            disabled={blocked}
            onPress={() => {
              startGame({
                names: names.map((name) => name.trim()),
                counts,
                categories,
                customListIds: listIds,
              });
              router.replace('/play');
            }}
          />
          <ActionButton label="Back" variant="ghost" onPress={() => router.back()} />
        </>
      }>
      <Title>New game</Title>
      <Box className="gap-3">
        <Box className="flex-row items-center justify-between">
          <Heading size="lg">{names.length} players</Heading>
          <Box className="flex-row">
            <Button variant="ghost" onPress={() => resize(names.length - 1)} isDisabled={names.length <= 3}>
              <ButtonText>−</ButtonText>
            </Button>
            <Button variant="ghost" onPress={() => resize(names.length + 1)} isDisabled={names.length >= 20}>
              <ButtonText>+</ButtonText>
            </Button>
          </Box>
        </Box>
        {names.map((name, index) => (
          <Field
            key={`player-${index}`}
            value={name}
            placeholder={`Player ${index + 1}`}
            onChangeText={(value) =>
              setNames((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
            }
          />
        ))}
      </Box>

      <Box className="gap-3">
        <Heading size="lg">Roles</Heading>
        <Muted>
          {manualRoles ? 'Custom counts.' : 'Suggested for this group.'} Civilians:{' '}
          {names.length - counts.undercover - counts.mrWhite - counts.joker}
        </Muted>
        <RoleRow
          label="Undercover"
          value={counts.undercover}
          onDecrease={() => changeRole('undercover', -1)}
          onIncrease={() => changeRole('undercover', 1)}
          canDecrease={
            validateRoles(names.length, { ...counts, undercover: counts.undercover - 1 }) === null
          }
          canIncrease={
            validateRoles(names.length, { ...counts, undercover: counts.undercover + 1 }) === null
          }
        />
        <RoleRow
          label="Mr. White"
          value={counts.mrWhite}
          onDecrease={() => changeRole('mrWhite', -1)}
          onIncrease={() => changeRole('mrWhite', 1)}
          canDecrease={
            validateRoles(names.length, { ...counts, mrWhite: counts.mrWhite - 1 }) === null
          }
          canIncrease={
            validateRoles(names.length, { ...counts, mrWhite: counts.mrWhite + 1 }) === null
          }
        />
        <RoleRow
          label="Joker"
          value={counts.joker}
          onDecrease={() => changeRole('joker', -1)}
          onIncrease={() => changeRole('joker', 1)}
          canDecrease={validateRoles(names.length, { ...counts, joker: counts.joker - 1 }) === null}
          canIncrease={validateRoles(names.length, { ...counts, joker: counts.joker + 1 }) === null}
        />
        <Box className="flex-row gap-2 pt-2">
          <Box className="flex-1">
            <ActionButton
              label="Suggested"
              variant="secondary"
              onPress={() => {
                setManualRoles(false);
                setCounts(suggestRoles(names.length));
              }}
            />
          </Box>
          <Box className="flex-1">
            <ActionButton
              label="Random"
              variant="secondary"
              onPress={() => {
                setManualRoles(true);
                setCounts(randomValidRoles(names.length));
              }}
            />
          </Box>
        </Box>
      </Box>

      <Box>
        <Heading size="lg" className="pb-1">
          Built-in words
        </Heading>
        {CATEGORIES.map((category) => (
          <ToggleRow
            key={category}
            label={`${CATEGORY_LABELS[category]} · ${pairsForCategories([category]).length}`}
            value={categories.includes(category)}
            onChange={() => toggleCategory(category)}
          />
        ))}
      </Box>

      <Box>
        <Heading size="lg" className="pb-1">
          Your lists
        </Heading>
        {library.customLists.length === 0 ? (
          <Muted>No custom lists yet. Add some from Word lists.</Muted>
        ) : (
          library.customLists.map((list) => (
            <ToggleRow
              key={list.id}
              label={`${list.name} · ${list.pairs.length}`}
              value={listIds.includes(list.id)}
              onChange={() => toggleList(list.id)}
            />
          ))
        )}
      </Box>
    </Screen>
  );
}

function RoleRow({
  label,
  value,
  onDecrease,
  onIncrease,
  canDecrease,
  canIncrease,
}: {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  canDecrease: boolean;
  canIncrease: boolean;
}) {
  return (
    <Box className="flex-row items-center justify-between border-b border-border py-2">
      <Text>{label}</Text>
      <Box className="flex-row items-center gap-3">
        <Button variant="ghost" onPress={onDecrease} isDisabled={!canDecrease}>
          <ButtonText>−</ButtonText>
        </Button>
        <Text bold>{value}</Text>
        <Button variant="ghost" onPress={onIncrease} isDisabled={!canIncrease}>
          <ButtonText>+</ButtonText>
        </Button>
      </Box>
    </Box>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.set(withTiming(value ? 1 : 0, toggleTiming));
  }, [progress, value]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [paper, vermillion]),
    borderColor: interpolateColor(progress.value, [0, 1], [hairline, vermillion]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [mutedInk, primaryForeground]),
    transform: [{ translateX: progress.value * thumbTravel }],
  }));

  return (
    <Box className="flex-row items-center justify-between border-b border-border py-3">
      <Text className="flex-1 pr-3">{label}</Text>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        aria-checked={value}
        accessibilityLabel={label}
        onPress={() => onChange(!value)}
        className="h-11 w-16 items-center justify-center">
        <Animated.View
          style={[
            {
              height: 32,
              width: 56,
              borderWidth: 1,
              borderRadius: 4,
              paddingHorizontal: 4,
              justifyContent: 'center',
            },
            trackStyle,
          ]}>
          <Animated.View style={[{ height: 20, width: 20, borderRadius: 4 }, thumbStyle]} />
        </Animated.View>
      </Pressable>
    </Box>
  );
}
