import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

import HomeScreen from '../screens/HomeScreen'
import AccountScreen from '../screens/AccountScreen'
import ListsScreen from '../screens/ListsScreen'
import SessionsScreen from '../screens/SessionsScreen'

import HomeFooter from '../components/HomeFooter'

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <HomeFooter
          onHomePress={() =>
            props.navigation.navigate('Home')
          }
          onCalendarPress={() =>
            props.navigation.navigate('Calendar')
          }
          onAccountPress={() =>
            props.navigation.navigate('Account')
          }
          onListsPress={() =>
            props.navigation.navigate('Lists')
          }
        />
      )}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />

      <Tab.Screen
        name="Calendar"
        component={SessionsScreen}
      />

      <Tab.Screen
        name="Account"
        component={AccountScreen}
      />

      <Tab.Screen
        name="Lists"
        component={ListsScreen}
      />
    </Tab.Navigator>
  )
}