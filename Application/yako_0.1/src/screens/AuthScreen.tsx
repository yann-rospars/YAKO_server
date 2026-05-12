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
  // const verifyOtp = async () => {
  //   const { data, error } = await supabase.auth.verifyOtp({
  //     email,
  //     token: otp,
  //     type: 'email',
  //   })

  //   if (error) {
  //     alert(error.message)
  //     return
  //   }

  //   // Récupère le user connecté
  //   const user = data.user
  //   if (!user) {
  //     alert("Erreur récupération utilisateur")
  //     return
  //   }

  //   // Marquer comme vérifié
  //   const { error: updateError } = await supabase
  //     .from('users')
  //     .update({ is_verified: true })
  //     .eq('id', user.id)

  //   if (updateError) {
  //     console.error(updateError)
  //     alert("Erreur mise à jour vérification")
  //     return
  //   }

  //   // SIGNUP → onboarding
  //   if (mode === 'signup') return

  //   // FORGOT → reset password
  //   if (mode === 'forgot') {
  //     setAuthFlow('reset')
  //   }
  // }
  const verifyOtp = async () => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user
    if (!user) {
      alert("Erreur récupération utilisateur")
      return
    }

    // Marquer comme vérifié
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', user.id)

    if (updateError) {
      console.error(updateError)
      alert("Erreur mise à jour vérification")
      return
    }

    // UNIQUEMENT pour signup → créer les listes
    if (mode === 'signup') {
      const { error: listError } = await supabase
        .from('lists')
        .upsert(
          [
            {
              user_id: user.id,
              name: 'Déjà notées',
              type: 'system',
              is_public: false,
            },
            {
              user_id: user.id,
              name: 'À voir au cinema',
              type: 'system',
              is_public: false,
            },
          ],
          { onConflict: 'user_id,name' }
        )

      if (listError) {
        console.error(listError)
        alert("Erreur création listes")
        return
      }

      return
    }

    // FORGOT → reset password
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