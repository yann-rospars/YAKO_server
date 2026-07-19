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
      // alert('Code sent')
      setStep('otp')
    }
  }

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
      alert('Erreur récupération utilisateur')
      return
    }

    // Marquer comme vérifié
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', user.id)

    if (updateError) {
      console.error(updateError)
      alert('Erreur mise à jour vérification')
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
        alert('Erreur création listes')
        return
      }

      return
    }

    // FORGOT → reset password
    if (mode === 'forgot') {
      setAuthFlow('reset')
    }
  }

  const getTitle = () => {
    if (mode === 'login') return 'CONNEXION'
    if (mode === 'signup') return 'CRÉER UN COMPTE'
    return 'MOT DE PASSE OUBLIÉ'
  }

  const getSubtitle = () => {
    if (mode === 'login') {
      return 'Retrouve tes films, tes listes et tes séances.'
    }

    if (mode === 'signup') {
      return step === 'email'
        ? 'Entre ton adresse email pour recevoir un code.'
        : 'Entre le code envoyé à ton adresse email.'
    }

    return step === 'email'
      ? 'Entre ton adresse email pour réinitialiser ton mot de passe.'
      : 'Entre le code reçu pour continuer.'
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
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.subtitle}>{getSubtitle()}</Text>
            </View>

            {mode === 'login' ? (
              <>
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>ADRESSE EMAIL</Text>

                  <View style={styles.inputWrapper}>
                    {!email && (
                      <Text pointerEvents="none" style={styles.customPlaceholder}>
                        exemple@email.com
                      </Text>
                    )}

                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="username"
                      autoComplete="email"
                      allowFontScaling={false}
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>MOT DE PASSE</Text>

                  <View style={styles.inputWrapper}>
                    {!password && (
                      <Text pointerEvents="none" style={styles.customPlaceholder}>
                        Ton mot de passe
                      </Text>
                    )}

                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      autoComplete="current-password"
                      allowFontScaling={false}
                      style={styles.input}
                    />
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleLogin}
                >
                  <Text style={styles.primaryButtonText}>
                    SE CONNECTER
                  </Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && styles.textButtonPressed,
                  ]}
                  onPress={() => {
                    setMode('forgot')
                    setStep('email')
                  }}
                >
                  <Text style={styles.textButtonText}>
                    Mot de passe oublié ?
                  </Text>
                </Pressable>

                <View style={styles.accountSeparator}>
                  <View style={styles.smallLine} />
                  <Text style={styles.accountSeparatorText}>
                    NOUVEAU SUR YAKO ?
                  </Text>
                  <View style={styles.smallLine} />
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => {
                    setMode('signup')
                    setStep('email')
                  }}
                >
                  <Text style={styles.secondaryButtonText}>
                    CRÉER UN COMPTE
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {step === 'email' ? (
                  <>
                    <View style={styles.fieldContainer}>
                      <Text style={styles.label}>ADRESSE EMAIL</Text>

                      <View style={styles.inputWrapper}>
                        {!email && (
                          <Text pointerEvents="none" style={styles.customPlaceholder}>
                            exemple@email.com
                          </Text>
                        )}

                        <TextInput
                          value={email}
                          onChangeText={setEmail}
                          autoCapitalize="none"
                          autoCorrect={false}
                          keyboardType="email-address"
                          textContentType="username"
                          autoComplete="email"
                          allowFontScaling={false}
                          style={styles.input}
                        />
                      </View>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={sendOtp}
                    >
                      <Text style={styles.primaryButtonText}>
                        ENVOYER LE CODE
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => setMode('login')}
                    >
                      <Text style={styles.secondaryButtonText}>
                        RETOUR À LA CONNEXION
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View style={styles.codeInformation}>
                      <Text style={styles.codeInformationTitle}>
                        CODE ENVOYÉ À
                      </Text>

                      <Text
                        style={styles.emailPreview}
                        numberOfLines={1}
                      >
                        {email}
                      </Text>
                    </View>

                    <View style={styles.fieldContainer}>
                      <Text style={styles.label}>
                        CODE À 8 CHIFFRES
                      </Text>

                      <TextInput
                        placeholder="00000000"
                        placeholderTextColor={COLORS.grey}
                        onChangeText={setOtp}
                        value={otp}
                        keyboardType="number-pad"
                        maxLength={8}
                        textAlign="center"
                        style={[styles.input, styles.otpInput]}
                      />
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={verifyOtp}
                    >
                      <Text style={styles.primaryButtonText}>
                        VÉRIFIER LE CODE
                      </Text>
                    </Pressable>

                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        pressed && styles.buttonPressed,
                      ]}
                      onPress={() => setStep('email')}
                    >
                      <Text style={styles.secondaryButtonText}>
                        CHANGER D’ADRESSE EMAIL
                      </Text>
                    </Pressable>
                  </>
                )}
              </>
            )}
          </View>

          {/* <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <View style={styles.orBadge}>
              <Text style={styles.orText}>OU</Text>
            </View>
            <View style={styles.orLine} />
          </View>

          <View style={styles.socialContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {}}
            >
              <View style={styles.socialIcon}>
                <Text style={styles.socialIconText}>G</Text>
              </View>

              <Text style={styles.socialButtonText}>
                CONTINUER AVEC GOOGLE
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                styles.appleButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {}}
            >
              <View style={styles.appleIcon}>
                <Text style={styles.appleIconText}>●</Text>
              </View>

              <Text style={styles.appleButtonText}>
                CONTINUER AVEC APPLE
              </Text>
            </Pressable>
          </View> */}

          <Text style={styles.legalText}>
            En continuant, tu acceptes les conditions d’utilisation et la
            politique de confidentialité de Yako.
          </Text>
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

  headerCaption: {
    marginTop: 14,
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 32,
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

  titleContainer: {
    marginBottom: 26,
  },

  title: {
    color: COLORS.black,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  subtitle: {
    marginTop: 8,
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    marginBottom: 8,
    marginLeft: 3,
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  inputWrapper: {
    position: 'relative',
    minHeight: 54,
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
    fontFamily: Platform.OS === 'ios' ? 'Arial' : 'sans-serif',
    fontSize: 15,
    fontWeight: '400',
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

  otpInput: {
    minHeight: 64,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 10,
  },

  primaryButton: {
    minHeight: 55,
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
    letterSpacing: 1.3,
    textAlign: 'center',
  },

  secondaryButton: {
    minHeight: 55,
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

  textButton: {
    marginTop: 20,
    paddingVertical: 6,
    alignSelf: 'center',
  },

  textButtonPressed: {
    opacity: 0.5,
  },

  textButtonText: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },

  accountSeparator: {
    marginTop: 24,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  smallLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.black,
  },

  accountSeparatorText: {
    marginHorizontal: 10,
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  codeInformation: {
    marginBottom: 22,
    padding: 15,
    alignItems: 'center',
    backgroundColor: COLORS.lightGrey,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 13,
  },

  codeInformationTitle: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  codeInformationText: {
    marginTop: 7,
    color: COLORS.black,
    fontSize: 13,
  },

  emailPreview: {
    maxWidth: '100%',
    marginTop: 3,
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '900',
  },

  orContainer: {
    marginVertical: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },

  orLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.black,
  },

  orBadge: {
    width: 44,
    height: 34,
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 10,
  },

  orText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  socialContainer: {
    gap: 14,
  },

  socialButton: {
    minHeight: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
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

  socialIcon: {
    width: 31,
    height: 31,
    marginRight: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 16,
  },

  socialIconText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: '900',
  },

  socialButtonText: {
    flex: 1,
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  appleButton: {
    backgroundColor: COLORS.black,
    shadowColor: COLORS.primary,
  },

  appleIcon: {
    width: 31,
    height: 31,
    marginRight: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },

  appleIconText: {
    color: COLORS.black,
    fontSize: 17,
    fontWeight: '900',
  },

  appleButtonText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  legalText: {
    marginTop: 28,
    paddingHorizontal: 12,
    color: COLORS.grey,
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
    textAlign: 'center',
  },
})