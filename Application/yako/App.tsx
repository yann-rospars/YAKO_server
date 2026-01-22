// import { NavigationContainer } from '@react-navigation/native';
// import BottomTabNavigator from './src/navigation/BottomTabNavigator';

// export default function App() {
//   return (
//     <NavigationContainer>
//       <BottomTabNavigator />
//     </NavigationContainer>
//   );
// }
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Fond blanc + icônes noires */}
      <StatusBar style="dark" backgroundColor="white" />

      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }} edges={['top']}>
        <NavigationContainer>
          <BottomTabNavigator />
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

