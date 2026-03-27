import { useEffect, useState } from 'react'
import { View, Text, Button } from 'react-native'
import { supabase } from '../lib/supabase'

export default function HomeScreen() {
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data, error } = await supabase
      .from('users')
      .select('username')
      .eq('id', user.id)
      .single()

    if (error) {
      console.log(error)
      return
    }

    setUsername(data.username)
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>yako</Text>

      {username && <Text>{username}</Text>}

      <Button title="Logout" onPress={() => supabase.auth.signOut()} />
    </View>
  )
}