import type { ReactNode } from 'react';
import { Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Box } from '@/components/ui/box';
import { Button, ButtonText } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Input, InputField } from '@/components/ui/input';
import { ScrollView } from '@/components/ui/scroll-view';
import { Text } from '@/components/ui/text';
import {
  card,
  destructive,
  hairline,
  ink,
  mutedInk,
  paper,
  primaryForeground,
  scrim,
  vermillion,
} from '@/theme';

const rise = FadeInDown.duration(220).reduceMotion(ReduceMotion.System);

const press = { duration: 120, reduceMotion: ReduceMotion.System };

export function Screen({
  children,
  footer,
  align = 'top',
}: {
  children: ReactNode;
  footer?: ReactNode;
  align?: 'top' | 'center';
}) {
  const centered = align === 'center';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: paper }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: centered ? 1 : undefined,
          justifyContent: centered ? 'center' : undefined,
          paddingHorizontal: 24,
          paddingTop: centered ? 24 : 28,
          paddingBottom: centered ? 24 : 40,
        }}
        keyboardShouldPersistTaps="handled">
        <FadeIn>
          <Box className="gap-7">{children}</Box>
        </FadeIn>
      </ScrollView>
      {footer ? <Box className="gap-1 px-6 pb-2">{footer}</Box> : null}
    </SafeAreaView>
  );
}

export function FadeIn({ children }: { children: ReactNode }) {
  if (Platform.OS === 'web') {
    return <Box className="wordcover-rise">{children}</Box>;
  }
  return <Animated.View entering={rise}>{children}</Animated.View>;
}

export function Title({
  children,
  italic = false,
  display = false,
  className,
}: {
  children: ReactNode;
  italic?: boolean;
  display?: boolean;
  className?: string;
}) {
  return (
    <Heading
      size={display ? '5xl' : '4xl'}
      italic={italic}
      className={className ? `leading-tight ${className}` : 'leading-tight'}>
      {children}
    </Heading>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <Text className="text-xs uppercase tracking-widest text-muted-foreground">{children}</Text>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text className="text-muted-foreground leading-6">{children}</Text>;
}

export function ActionButton({
  label,
  onPress,
  variant = 'default',
  disabled,
  inset,
}: {
  label: string;
  onPress: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  disabled?: boolean;
  inset?: boolean;
}) {
  const filled = variant === 'default' || variant === 'destructive';
  const fill =
    variant === 'destructive' ? destructive : variant === 'default' ? vermillion : undefined;
  const labelColor = filled ? primaryForeground : variant === 'ghost' ? mutedInk : ink;
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        { width: '100%', paddingHorizontal: filled && inset !== false ? 12 : 0 },
        animatedStyle,
      ]}>
      <Button
        variant={variant}
        size="lg"
        isDisabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.set(withTiming(0.98, press));
        }}
        onPressOut={() => {
          scale.set(withTiming(1, press));
        }}
        style={fill ? { backgroundColor: fill } : undefined}
        className="w-full min-h-12 rounded-lg">
        <ButtonText
          style={{ color: labelColor, fontFamily: 'Outfit' }}
          className="font-sans text-base font-medium tracking-wide">
          {label}
        </ButtonText>
      </Button>
    </Animated.View>
  );
}

export function Dialog({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean;
  onRequestClose: () => void;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Box
        className="flex-1 items-center justify-center px-6"
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 24,
          backgroundColor: scrim,
        }}>
        <Box
          className="w-full gap-5 border border-border bg-card p-6"
          style={{
            width: '100%',
            gap: 20,
            padding: 24,
            backgroundColor: card,
            borderWidth: 1,
            borderColor: hairline,
          }}>
          {children}
        </Box>
      </Box>
    </Modal>
  );
}

export function Prompt({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive: danger,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  return (
    <Dialog visible={visible} onRequestClose={onCancel ?? onConfirm}>
      <Heading size="2xl" style={{ color: ink, fontFamily: 'Fraunces' }}>
        {title}
      </Heading>
      {message ? (
        <Text className="leading-6" style={{ color: ink, fontFamily: 'Outfit' }}>
          {message}
        </Text>
      ) : null}
      <ActionButton
        label={confirmLabel}
        variant={danger ? 'destructive' : 'default'}
        inset={false}
        onPress={onConfirm}
      />
      {cancelLabel && onCancel ? (
        <ActionButton label={cancelLabel} variant="ghost" onPress={onCancel} />
      ) : null}
    </Dialog>
  );
}

export function Field({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      className="min-h-12 rounded-none border-0 bg-transparent px-0 shadow-none dark:bg-transparent"
      style={{
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: hairline,
      }}>
      <InputField
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={mutedInk}
        autoCapitalize="words"
        autoCorrect={false}
        style={{ color: ink, fontFamily: 'Outfit' }}
        className="px-0 font-sans text-base"
      />
    </Input>
  );
}
