import { useEffect, useState } from 'react'
import { Text } from 'react-native'

import { supabase } from './src/lib/supabase'
import AuthScreen from './src/screens/AuthScreen'
import HomeScreen from './src/screens/HomeScreen'
import CompleteProfileScreen from './src/screens/CompleteProfileScreen'
import ResetPasswordScreen from './src/screens/ResetPasswordScreen'

export default function App() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProfile, setLoadingProfile] = useState(true)

  // 🔥 NOUVEAU : flow clair
  const [authFlow, setAuthFlow] = useState<
    'login' | 'signup' | 'forgot' | 'reset'
  >('login')

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

  if (loading || loadingProfile) return <Text>Loading...</Text>

  // 🔥 RESET PASSWORD (prioritaire)
  if (authFlow === 'reset') {
    return <ResetPasswordScreen setAuthFlow={setAuthFlow} />
  }

  // 🔥 PAS CONNECTÉ
  if (!session) {
    return <AuthScreen setAuthFlow={setAuthFlow} />
  }

  // 🔥 PROFIL INCOMPLET
  if (!profile?.username) {
    return <CompleteProfileScreen />
  }

  // 🔥 OK
  return <HomeScreen />
}