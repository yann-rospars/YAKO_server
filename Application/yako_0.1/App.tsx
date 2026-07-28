import { useEffect, useState } from 'react'
import { Text } from 'react-native'

import { supabase } from './src/lib/supabase'

import AuthScreen from './src/screens/AuthScreen'
import CompleteProfileScreen from './src/screens/CompleteProfileScreen'
import ResetPasswordScreen from './src/screens/ResetPasswordScreen'
import ListDetailScreen from './src/screens/ListDetailScreen'
import MovieScreen from './src/screens/MovieScreen'
import EditAccountScreen from './src/screens/EditAccountScreen'
import FriendScreen from './src/screens/FriendScreen'
import MainTabs from './src/navigation/MainTabs'

// 🔥 NAVIGATION
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [authFlow, setAuthFlow] = useState<
    'login' | 'signup' | 'forgot' | 'reset'
  >('login')

  // 🔐 SESSION
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // 👤 PROFILE
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session) {
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      setLoadingProfile(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !user.email_confirmed_at) {
        setProfile(null)
        setLoadingProfile(false)
        return
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!error) setProfile(data)

      setLoadingProfile(false)
    }

    fetchProfile()
  }, [session])

  // ⏳ LOADING
  if (loading || loadingProfile) return <Text>Loading...</Text>

  // 🔥 RESET PASSWORD
  if (authFlow === 'reset') {
    return <ResetPasswordScreen setAuthFlow={setAuthFlow} />
  }

  // 🔓 PAS CONNECTÉ
  if (!session) {
    return <AuthScreen setAuthFlow={setAuthFlow} />
  }

  // ⚠️ PROFIL INCOMPLET
  if (!profile?.username) {
    return (
      <CompleteProfileScreen
        onComplete={() => setProfile((prev: any) => ({ ...prev, username: 'done' }))}
      />
    )
  }

  // 🚀 APP PRINCIPALE AVEC NAVIGATION
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            animation: 'none',
          }}
        />

        <Stack.Screen
          name="Movie"
          component={MovieScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="ListDetail"
          component={ListDetailScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="EditAccount"
          component={EditAccountScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        <Stack.Screen
          name="Friends"
          component={FriendScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}










