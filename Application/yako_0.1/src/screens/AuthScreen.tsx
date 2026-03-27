import { useState } from 'react'
import { SafeAreaView, View, TextInput, Button, Text } from 'react-native'
import { supabase } from '../lib/supabase'

export default function AuthScreen({ setAuthFlow }: any) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')

  // 🔹 LOGIN
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) alert(error.message)
  }

  // 🔹 SEND OTP (signup + forgot)
  const sendOtp = async () => {
    if (!email) {
      alert('Enter your email')
      return
    }

    // SIGNUP → email ne doit pas exister
    if (mode === 'signup') {
      const { data } = await supabase.rpc('email_exists', {
        email_input: email,
      })

      if (data) {
        alert('Email already used')
        return
      }
    }

    // FORGOT → email doit exister
    if (mode === 'forgot') {
      const { data } = await supabase.rpc('email_exists', {
        email_input: email,
      })

      if (!data) {
        alert('Email not found')
        return
      }
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: mode === 'signup',
      },
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Code sent')
      setStep('otp')
    }
  }

  // 🔹 VERIFY OTP
  const verifyOtp = async () => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      alert(error.message)
      return
    }

    // SIGNUP → App redirige automatiquement vers onboarding
    if (mode === 'signup') return

    // FORGOT → redirection vers ResetPasswordScreen
    if (mode === 'forgot') {
      setAuthFlow('reset')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ padding: 20 }}>
        <Text style={{ marginBottom: 20 }}>
          {mode === 'login' ? 'Login' : mode === 'signup' ? 'Create account' : 'Reset password'}
        </Text>

        {mode === 'login' ? (
          <>
            <TextInput
              placeholder="Email"
              onChangeText={setEmail}
              value={email}
              style={{ borderWidth: 1, marginBottom: 10 }}
            />

            <TextInput
              placeholder="Password"
              secureTextEntry
              onChangeText={setPassword}
              value={password}
              style={{ borderWidth: 1, marginBottom: 10 }}
            />

            <Button title="Login" onPress={handleLogin} />

            <Button
              title="Forgot password?"
              onPress={() => {
                setMode('forgot')
                setStep('email')
              }}
            />

            <Button
              title="Create account"
              onPress={() => {
                setMode('signup')
                setStep('email')
              }}
            />
          </>
        ) : (
          <>
            {step === 'email' ? (
              <>
                <TextInput
                  placeholder="Email"
                  onChangeText={setEmail}
                  value={email}
                  style={{ borderWidth: 1, marginBottom: 10 }}
                />

                <Button title="Send code" onPress={sendOtp} />

                <Button
                  title="Back to login"
                  onPress={() => setMode('login')}
                />
              </>
            ) : (
              <>
                <TextInput
                  placeholder="6-digit code"
                  onChangeText={setOtp}
                  value={otp}
                  style={{ borderWidth: 1, marginBottom: 10 }}
                />

                <Button title="Verify code" onPress={verifyOtp} />

                <Button
                  title="Change email"
                  onPress={() => setStep('email')}
                />
              </>
            )}
          </>
        )}

        <Text style={{ marginVertical: 20 }}>OR</Text>

        <Button title="Login with Google" onPress={() => {}} />
        <Button title="Login with Apple" onPress={() => {}} />
      </View>
    </SafeAreaView>
  )
}