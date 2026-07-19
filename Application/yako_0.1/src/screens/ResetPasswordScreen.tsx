import { useState } from 'react'
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'

const COLORS = {
  primary: '#FFE17A',
  white: '#FFFFFF',
  black: '#111111',
  grey: '#777777',
  lightGrey: '#F4F1E8',
}

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.primary}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>YAKO</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.decorativeLine} />

          <View style={styles.card}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>SÉCURITÉ</Text>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>NOUVEAU MOT DE PASSE</Text>

              <View style={styles.inputWrapper}>
                {!password && (
                  <Text
                    pointerEvents="none"
                    style={styles.customPlaceholder}
                  >
                    6 caractères minimum
                  </Text>
                )}

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  allowFontScaling={false}
                  editable={!loading}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>

              <View style={styles.inputWrapper}>
                {!confirmPassword && (
                  <Text
                    pointerEvents="none"
                    style={styles.customPlaceholder}
                  >
                    Encore
                  </Text>
                )}

                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  allowFontScaling={false}
                  editable={!loading}
                  style={styles.input}
                />
              </View>
            </View>

            <Pressable
              disabled={loading}
              onPress={handleReset}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={COLORS.white}
                  />

                  <Text style={styles.primaryButtonText}>
                    MISE À JOUR...
                  </Text>
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>
                  METTRE À JOUR
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={() => setAuthFlow('login')}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && !loading && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.secondaryButtonText}>
                RETOUR À LA CONNEXION
              </Text>
            </Pressable>
          </View>

          <View style={styles.informationCard}>
            <View style={styles.informationIcon}>
              <Text style={styles.informationIconText}>!</Text>
            </View>

            <Text style={styles.informationText}>
              Ton nouveau mot de passe sera utilisé lors de ta prochaine
              connexion.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    minHeight: 80,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
  },

  logoContainer: {
    paddingHorizontal: 22,
    paddingVertical: 7,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 14,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  logoText: {
    color: COLORS.black,
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 4,
  },

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 34,
    backgroundColor: COLORS.white,
  },

  decorativeLine: {
    width: 48,
    height: 7,
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 50,
  },

  card: {
    width: '100%',
    padding: 20,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 22,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 6,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },

  stepBadge: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 9,
  },

  stepBadgeText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  titleContainer: {
    marginBottom: 28,
  },

  title: {
    color: COLORS.black,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 29,
    letterSpacing: 1.3,
  },

  subtitle: {
    marginTop: 9,
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  fieldContainer: {
    marginBottom: 20,
  },

  label: {
    marginBottom: 8,
    marginLeft: 3,
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  inputWrapper: {
    position: 'relative',
    minHeight: 54,
  },

  customPlaceholder: {
    position: 'absolute',
    zIndex: 1,
    left: 19,
    top: 17,
    color: COLORS.grey,
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    fontSize: 15,
    fontWeight: '400',
  },

  input: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 13,
    fontSize: 15,
    fontWeight: '400',
  },

  primaryButton: {
    minHeight: 56,
    marginTop: 4,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.black,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 13,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  primaryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
  },

  secondaryButton: {
    minHeight: 56,
    marginTop: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 13,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  secondaryButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.1,
    textAlign: 'center',
  },

  buttonPressed: {
    transform: [
      {
        translateX: 3,
      },
      {
        translateY: 3,
      },
    ],
    shadowOffset: {
      width: 1,
      height: 1,
    },
    elevation: 1,
    opacity: 0.9,
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  informationCard: {
    marginTop: 28,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 14,
  },

  informationIcon: {
    width: 30,
    height: 30,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 15,
  },

  informationIconText: {
    color: COLORS.black,
    fontSize: 15,
    fontWeight: '900',
  },

  informationText: {
    flex: 1,
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
})



// import { useState } from 'react'
// import { SafeAreaView, View, TextInput, Button, Text } from 'react-native'
// import { supabase } from '../lib/supabase'

// export default function ResetPasswordScreen({ setAuthFlow }: any) {
//   const [password, setPassword] = useState('')
//   const [confirmPassword, setConfirmPassword] = useState('')
//   const [loading, setLoading] = useState(false)

//   const handleReset = async () => {
//     if (password.length < 6) {
//       alert('Password must be at least 6 characters')
//       return
//     }

//     if (password !== confirmPassword) {
//       alert('Passwords do not match')
//       return
//     }

//     setLoading(true)

//     const { error } = await supabase.auth.updateUser({
//       password,
//     })

//     setLoading(false)

//     if (error) {
//       alert(error.message)
//     } else {
//       alert('Password updated')

//       // 🔥 on sort du flow reset
//       setAuthFlow('login')
//     }
//   }

//   return (
//     <SafeAreaView style={{ flex: 1 }}>
//       <View style={{ padding: 20 }}>
//         <Text style={{ marginBottom: 20 }}>
//           Reset your password
//         </Text>

//         <TextInput
//           placeholder="New password"
//           secureTextEntry
//           value={password}
//           onChangeText={setPassword}
//           style={{ borderWidth: 1, marginBottom: 10 }}
//         />

//         <TextInput
//           placeholder="Confirm password"
//           secureTextEntry
//           value={confirmPassword}
//           onChangeText={setConfirmPassword}
//           style={{ borderWidth: 1, marginBottom: 20 }}
//         />

//         <Button
//           title={loading ? 'Updating...' : 'Update password'}
//           onPress={handleReset}
//           disabled={loading}
//         />

//         <Button
//           title="Back to login"
//           onPress={() => setAuthFlow('login')}
//         />
//       </View>
//     </SafeAreaView>
//   )
// }