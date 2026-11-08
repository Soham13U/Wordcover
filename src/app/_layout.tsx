import { Fraunces_400Regular_Italic, Fraunces_700Bold, Fraunces_700Bold_Italic } from '@expo-google-fonts/fraunces';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { GameProvider } from '@/state/GameProvider';
import { paper } from '@/theme';

import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts([
    {
      fontFamily: 'Fraunces',
      fontDefinitions: [
        { path: Fraunces_700Bold, weight: 700 },
        { path: Fraunces_400Regular_Italic, weight: 400, style: 'italic' },
        { path: Fraunces_700Bold_Italic, weight: 700, style: 'italic' },
      ],
    },
    {
      fontFamily: 'Outfit',
      fontDefinitions: [
        { path: Outfit_400Regular, weight: 400 },
        { path: Outfit_500Medium, weight: 500 },
        { path: Outfit_600SemiBold, weight: 600 },
        { path: Outfit_700Bold, weight: 700 },
      ],
    },
  ]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GluestackUIProvider mode="light">
      <GameProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: paper },
          }}
        />
      </GameProvider>
    </GluestackUIProvider>
  );
}
