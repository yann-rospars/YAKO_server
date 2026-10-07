import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import HomeScreen from '../screens/HomeScreen'
import CalendarScreen from '../screens/CalendarScreen'
import AccountScreen from '../screens/AccountScreen'
import ListsScreen from '../screens/ListsScreen'

import MovieScreen from '../screens/MovieScreen'
import CinemaScreen from '../screens/CinemaScreen'
import ListDetailScreen from '../screens/ListDetailScreen'
import EditAccountScreen from '../screens/EditAccountScreen'
import FriendScreen from '../screens/FriendScreen'

import HomeFooter from '../components/HomeFooter'

const Tab = createBottomTabNavigator()

const HomeStackNavigator =
  createNativeStackNavigator()

const CalendarStackNavigator =
  createNativeStackNavigator()

const AccountStackNavigator =
  createNativeStackNavigator()

const ListsStackNavigator =
  createNativeStackNavigator()

/*
  ----------------------------------
  HOME STACK
  ----------------------------------
*/

function HomeStack() {
  return (
    <HomeStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <HomeStackNavigator.Screen
        name="HomeScreen"
        component={HomeScreen}
      />

      <HomeStackNavigator.Screen
        name="Movie"
        component={MovieScreen}
      />

      <HomeStackNavigator.Screen
        name="Cinema"
        component={CinemaScreen}
      />
    </HomeStackNavigator.Navigator>
  )
}

/*
  ----------------------------------
  CALENDAR STACK
  ----------------------------------
*/

function CalendarStack() {
  return (
    <CalendarStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <CalendarStackNavigator.Screen
        name="CalendarScreen"
        component={CalendarScreen}
      />

      <CalendarStackNavigator.Screen
        name="Movie"
        component={MovieScreen}
      />

      <CalendarStackNavigator.Screen
        name="Cinema"
        component={CinemaScreen}
      />
    </CalendarStackNavigator.Navigator>
  )
}

/*
  ----------------------------------
  ACCOUNT STACK
  ----------------------------------
*/

function AccountStack() {
  return (
    <AccountStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <AccountStackNavigator.Screen
        name="AccountScreen"
        component={AccountScreen}
      />

      <AccountStackNavigator.Screen
        name="EditAccount"
        component={EditAccountScreen}
      />

      <AccountStackNavigator.Screen
        name="Friends"
        component={FriendScreen}
      />
    </AccountStackNavigator.Navigator>
  )
}

/*
  ----------------------------------
  LISTS STACK
  ----------------------------------
*/

function ListsStack() {
  return (
    <ListsStackNavigator.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <ListsStackNavigator.Screen
        name="ListsScreen"
        component={ListsScreen}
      />

      <ListsStackNavigator.Screen
        name="ListDetail"
        component={ListDetailScreen}
      />

      <ListsStackNavigator.Screen
        name="Movie"
        component={MovieScreen}
      />

      <ListsStackNavigator.Screen
        name="Cinema"
        component={CinemaScreen}
      />
    </ListsStackNavigator.Navigator>
  )
}

/*
  ----------------------------------
  MAIN TABS
  ----------------------------------
*/

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
            props.navigation.navigate(
              'Home',
              {
                screen: 'HomeScreen',
              }
            )
          }

          onCalendarPress={() =>
            props.navigation.navigate(
              'Calendar',
              {
                screen: 'CalendarScreen',
              }
            )
          }

          onAccountPress={() =>
            props.navigation.navigate(
              'Account',
              {
                screen: 'AccountScreen',
              }
            )
          }

          onListsPress={() =>
            props.navigation.navigate(
              'Lists',
              {
                screen: 'ListsScreen',
              }
            )
          }
        />
      )}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarStack}
      />

      <Tab.Screen
        name="Account"
        component={AccountStack}
      />

      <Tab.Screen
        name="Lists"
        component={ListsStack}
      />
    </Tab.Navigator>
  )
}