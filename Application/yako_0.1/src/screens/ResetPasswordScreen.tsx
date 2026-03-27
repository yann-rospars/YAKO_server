import { useState } from 'react'
import { SafeAreaView, View, TextInput, Button, Text } from 'react-native'
import { supabase } from '../lib/supabase'

export default function ResetPasswordScreen({ setAuthFlow }: any) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (password.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
    } else {
      alert('Password updated')

      // 🔥 on sort du flow reset
      setAuthFlow('login')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 20 }}>
          Reset your password
        </Text>

        <TextInput
          placeholder="New password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ borderWidth: 1, marginBottom: 10 }}
        />

        <TextInput
          placeholder="Confirm password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={{ borderWidth: 1, marginBottom: 20 }}
        />

        <Button
          title={loading ? 'Updating...' : 'Update password'}
          onPress={handleReset}
          disabled={loading}
        />

        <Button
          title="Back to login"
          onPress={() => setAuthFlow('login')}
        />
      </View>
    </SafeAreaView>
  )
}