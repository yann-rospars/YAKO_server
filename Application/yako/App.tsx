import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import LoginScreen from './src/screens/LoginScreen';

import { useEffect } from 'react';
import { registerForPushNotifications } from './src/services/notifications.service';
import { supabase } from './src/lib/supabase';

export default function App() {

  useEffect(() => {
    registerForPushNotifications().then(async (token) => {
      console.log('Push token:', token);

      if (!token) return;

      const user_id = '00000000-0000-0000-0000-000000000000';

      await supabase.from('user_devices').upsert({
        user_id,
        expo_push_token: token,
        platform: 'ios',
        is_active: true,
      });
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="white" />

      <SafeAreaView
        style={{ flex: 1, backgroundColor: 'white' }}
        edges={['top']}
      >
        <NavigationContainer>
          <LoginScreen />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}