import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';

export default function ItemIndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home screen
    router.replace('/');
  }, [router]);

  return (
    <View className="flex-1 justify-center items-center p-4 bg-background">
      <Text>Redirecting...</Text>
    </View>
  );
}
