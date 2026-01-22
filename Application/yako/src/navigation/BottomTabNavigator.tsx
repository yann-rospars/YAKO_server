import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeStackNavigator from './HomeStackNavigator';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

// Screens temporaires (propres, pas du bricolage)
function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>{title}</Text>
    </View>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeStackNavigator} />
      <Tab.Screen
        name="Listes"
        children={() => <PlaceholderScreen title="Listes" />}
      />
      <Tab.Screen
        name="Amis"
        children={() => <PlaceholderScreen title="Amis" />}
      />
      <Tab.Screen
        name="Compte"
        children={() => <PlaceholderScreen title="Compte" />}
      />
    </Tab.Navigator>
  );
}
