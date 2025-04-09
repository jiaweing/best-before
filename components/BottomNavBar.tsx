import { useRouter } from 'expo-router';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Text } from '~/components/ui/text';
import { Home } from '~/lib/icons/Home';
import { Settings } from '~/lib/icons/Settings';

type BottomNavBarProps = {
  currentRoute: string;
};

export function BottomNavBar({ currentRoute }: BottomNavBarProps) {
  const router = useRouter();

  const handleHomePress = () => {
    router.push('/');
  };

  const handleSettingsPress = () => {
    router.push('/settings');
  };

  return (
    <View className="absolute bottom-0 left-0 right-0 h-16 flex-row justify-around items-center bg-background border-t border-border">
      <TouchableOpacity
        onPress={handleHomePress}
        className="flex-1 items-center justify-center"
        activeOpacity={0.7}
      >
        <Home
          size={24}
          className={currentRoute === '/' ? 'text-primary' : 'text-muted-foreground'}
        />
        <Text
          className={`text-xs mt-1 ${
            currentRoute === '/' ? 'text-primary font-medium' : 'text-muted-foreground'
          }`}
        >
          Home
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={handleSettingsPress}
        className="flex-1 items-center justify-center"
        activeOpacity={0.7}
      >
        <Settings
          size={24}
          className={currentRoute === '/settings' ? 'text-primary' : 'text-muted-foreground'}
        />
        <Text
          className={`text-xs mt-1 ${
            currentRoute === '/settings' ? 'text-primary font-medium' : 'text-muted-foreground'
          }`}
        >
          Settings
        </Text>
      </TouchableOpacity>
    </View>
  );
}
