import { useState } from 'react'
import { SafeAreaView, View, TextInput, Button, Text } from 'react-native'
import { supabase } from '../lib/supabase'

export default function CompleteProfileScreen({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!username) {
      alert('Enter a username')
      return
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('User not found')
      setLoading(false)
      return
    }

    // 🔹 1. update username
    // const { error: profileError } = await supabase
    //   .from('users')
    //   .update({ username })
    //   .eq('id', user.id)
    const { error: profileError, data: profileData } = await supabase
      .from('users')
      .update({ username })
      .eq('id', user.id)
      .select()

    console.log('profileData:', profileData)
    console.log('profileError:', profileError)

    if (profileError) {
      alert(profileError.message)
      setLoading(false)
      return
    }

    // 🔹 2. update password
    const { error: passwordError } = await supabase.auth.updateUser({
      password: password,
    })

    if (passwordError) {
      alert(passwordError.message)
      setLoading(false)
      return
    }

    alert('Profile created')
    await supabase.auth.refreshSession()
    onComplete()
    setLoading(false)
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 20 }}>
          Complete your profile
        </Text>

        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={{ borderWidth: 1, marginBottom: 10 }}
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ borderWidth: 1, marginBottom: 10 }}
        />

        <TextInput
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={{ borderWidth: 1, marginBottom: 20 }}
        />

        <Button
          title={loading ? 'Saving...' : 'Save'}
          onPress={handleSave}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  )
}