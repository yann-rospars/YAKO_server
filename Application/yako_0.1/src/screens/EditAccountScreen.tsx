import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native'

import {
  SafeAreaView,
} from 'react-native-safe-area-context'

import { supabase } from '../lib/supabase'
import LoadingState from '../components/LoadingState'
import { COLORS } from '../theme/colors'

const AVATAR_COLORS = [
  '#FF6B35',
  '#00E5A0',
  '#3B82F6',
  '#A855F7',
  '#F59E0B',
  '#EF4444',
  '#10B981',
  '#EC4899',
]

type FieldProps = {
  label: string
  value: string
  onChangeText: (
    value: string
  ) => void
  placeholder?: string
  keyboardType?:
    | 'default'
    | 'numeric'
    | 'decimal-pad'
}

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: FieldProps) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>
      {label.toUpperCase()}
    </Text>

    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={
        placeholder ?? label
      }
      placeholderTextColor={COLORS.text2}
      keyboardType={
        keyboardType
      }
      allowFontScaling={false}
      style={styles.fieldInput}
    />
  </View>
)

export default function EditAccountScreen({
  navigation,
}: any) {
  const { width } =
    useWindowDimensions()

  /*
    ----------------------------------
    RESPONSIVE
    ----------------------------------
  */

  const horizontalPadding =
    width < 360
      ? 10
      : width < 430
        ? 16
        : 20

  const headerPadding =
    width < 360
      ? 10
      : 16

  const contentMaxWidth =
    520

  const contentWidth =
    Math.min(
      width -
        horizontalPadding * 2,
      contentMaxWidth
    )

  const sectionHorizontalPadding =
    width < 360
      ? 10
      : 12

  const colorGap =
    width < 360
      ? 10
      : 14

  const colorSize =
    width < 360
      ? 34
      : 38

  /*
    ----------------------------------
    STATE
    ----------------------------------
  */

  const [userId, setUserId] =
    useState<string | null>(null)

  const [
    username,
    setUsername,
  ] = useState('')

  const [city, setCity] =
    useState('')

  const [
    latitude,
    setLatitude,
  ] = useState('')

  const [
    longitude,
    setLongitude,
  ] = useState('')

  const [
    avatarColor,
    setAvatarColor,
  ] = useState(
    AVATAR_COLORS[0]
  )

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  /*
    ----------------------------------
    LOAD USER
    ----------------------------------
  */

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser =
    async () => {
      const {
        data: {
          user: authUser,
        },
      } =
        await supabase.auth.getUser()

      if (!authUser) {
        setLoading(false)
        return
      }

      setUserId(
        authUser.id
      )

      const {
        data,
        error,
      } = await supabase
        .from('users')
        .select(
          'username, avatar_color, city, latitude, longitude'
        )
        .eq(
          'id',
          authUser.id
        )
        .single()

      if (error) {
        console.log(error)
        setLoading(false)
        return
      }

      setUsername(
        data.username ?? ''
      )

      setAvatarColor(
        data.avatar_color ??
          AVATAR_COLORS[0]
      )

      setCity(
        data.city ?? ''
      )

      setLatitude(
        data.latitude != null
          ? String(
              data.latitude
            )
          : ''
      )

      setLongitude(
        data.longitude != null
          ? String(
              data.longitude
            )
          : ''
      )

      setLoading(false)
    }

  /*
    ----------------------------------
    VALIDATION
    ----------------------------------
  */

  const validate = ():
    | string
    | null => {
    if (!username.trim()) {
      return 'Le pseudo ne peut pas être vide.'
    }

    if (
      username.trim().length <
      3
    ) {
      return 'Le pseudo doit faire au moins 3 caractères.'
    }

    if (
      latitude &&
      isNaN(
        Number(latitude)
      )
    ) {
      return 'La latitude doit être un nombre.'
    }

    if (
      longitude &&
      isNaN(
        Number(longitude)
      )
    ) {
      return 'La longitude doit être un nombre.'
    }

    const lat =
      Number(latitude)

    const lng =
      Number(longitude)

    if (
      latitude &&
      (lat < -90 ||
        lat > 90)
    ) {
      return 'Latitude invalide (entre -90 et 90).'
    }

    if (
      longitude &&
      (lng < -180 ||
        lng > 180)
    ) {
      return 'Longitude invalide (entre -180 et 180).'
    }

    return null
  }

  /*
    ----------------------------------
    SAVE
    ----------------------------------
  */

  const save = async () => {
    const err =
      validate()

    if (err) {
      Alert.alert(
        'Erreur',
        err
      )

      return
    }

    if (!userId) {
      return
    }

    setSaving(true)

    const { error } =
      await supabase
        .from('users')
        .update({
          username:
            username.trim(),

          avatar_color:
            avatarColor,

          city:
            city.trim() ||
            null,

          latitude:
            latitude
              ? Number(
                  latitude
                )
              : null,

          longitude:
            longitude
              ? Number(
                  longitude
                )
              : null,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          userId
        )

    setSaving(false)

    if (error) {
      if (
        error.code ===
        '23505'
      ) {
        Alert.alert(
          'Pseudo déjà pris',
          'Ce pseudo est utilisé par un autre compte.'
        )
      } else {
        Alert.alert(
          'Erreur',
          'Une erreur est survenue, réessaie.'
        )

        console.log(error)
      }

      return
    }

    navigation.goBack()
  }

  /*
    ----------------------------------
    LOADING
    ----------------------------------
  */

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.loadingRoot
        }
        edges={['top']}
      >
        <LoadingState />
      </SafeAreaView>
    )
  }

  /*
    ----------------------------------
    RETURN
    ----------------------------------
  */

  return (
    <SafeAreaView
      style={styles.root}
      edges={['top']}
    >
      {/* HEADER FIXE */}
      <View
        style={[
          styles.topBar,
          {
            paddingHorizontal:
              headerPadding,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() =>
            navigation.goBack()
          }
          style={
            styles.backBtn
          }
        >
          <Text
            style={
              styles.backText
            }
          >
            ←
          </Text>
        </TouchableOpacity>

        <Text
          style={
            styles.screenTitle
          }
        >
          MODIFIER LE COMPTE
        </Text>

        <View
          style={
            styles.topBarSpacer
          }
        />
      </View>

      <ScrollView
        style={
          styles.scrollView
        }
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal:
              horizontalPadding,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={
          Platform.OS === 'ios'
            ? 'interactive'
            : 'on-drag'
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.formContent,
            {
              width:
                contentWidth,
            },
          ]}
        >
          {/* COULEUR */}
          <View
            style={[
              styles.section,
              {
                paddingHorizontal:
                  sectionHorizontalPadding,
              },
            ]}
          >
            <View
              style={
                styles.sectionTitleContainer
              }
            >
              <View
                style={
                  styles.sectionTitleLine
                }
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                COULEUR DU PROFIL
              </Text>

              <View
                style={
                  styles.sectionTitleLine
                }
              />
            </View>

            <View
              style={[
                styles.colorGrid,
                {
                  gap:
                    colorGap,
                },
              ]}
            >
              {AVATAR_COLORS.map(
                (color) => (
                  <TouchableOpacity
                    key={
                      color
                    }
                    activeOpacity={
                      0.8
                    }
                    onPress={() =>
                      setAvatarColor(
                        color
                      )
                    }
                    style={[
                      styles.colorDot,

                      {
                        width:
                          colorSize,

                        height:
                          colorSize,

                        borderRadius:
                          colorSize /
                          2,

                        backgroundColor:
                          color,
                      },

                      avatarColor ===
                        color &&
                        styles.colorDotSelected,
                    ]}
                  />
                )
              )}
            </View>
          </View>

          {/* IDENTITÉ */}
          <View
            style={[
              styles.section,
              {
                paddingHorizontal:
                  sectionHorizontalPadding,
              },
            ]}
          >
            <View
              style={
                styles.sectionTitleContainer
              }
            >
              <View
                style={
                  styles.sectionTitleLine
                }
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                IDENTITÉ
              </Text>

              <View
                style={
                  styles.sectionTitleLine
                }
              />
            </View>

            <Field
              label="Pseudo"
              value={
                username
              }
              onChangeText={
                setUsername
              }
              placeholder="Ton pseudo"
            />
          </View>

          {/* LOCALISATION */}
          <View
            style={[
              styles.section,
              {
                paddingHorizontal:
                  sectionHorizontalPadding,
              },
            ]}
          >
            <View
              style={
                styles.sectionTitleContainer
              }
            >
              <View
                style={
                  styles.sectionTitleLine
                }
              />

              <Text
                style={
                  styles.sectionTitle
                }
              >
                LOCALISATION
              </Text>

              <View
                style={
                  styles.sectionTitleLine
                }
              />
            </View>

            <Field
              label="Ville"
              value={city}
              onChangeText={
                setCity
              }
              placeholder="Paris, Lyon..."
            />

            <Field
              label="Latitude"
              value={
                latitude
              }
              onChangeText={
                setLatitude
              }
              placeholder="48.8566"
              keyboardType="decimal-pad"
            />

            <Field
              label="Longitude"
              value={
                longitude
              }
              onChangeText={
                setLongitude
              }
              placeholder="2.3522"
              keyboardType="decimal-pad"
            />
          </View>

          {/* SAVE */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.saveBtn,

              saving &&
                styles.saveBtnDisabled,
            ]}
            onPress={save}
            disabled={
              saving
            }
          >
            {saving ? (
              <ActivityIndicator
                color={
                  COLORS.icon
                }
              />
            ) : (
              <Text
                style={
                  styles.saveBtnText
                }
              >
                ENREGISTRER
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  // ── LAYOUT ───────────────────────────

  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  loadingRoot: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  scrollView: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flexGrow: 1,

    paddingTop: 18,
    paddingBottom: 140,

    backgroundColor: COLORS.background,
  },

  formContent: {
    alignSelf: 'center',
  },

  // ── HEADER ───────────────────────────

  topBar: {
    minHeight: 64,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: COLORS.primary,

    borderBottomWidth: 3,
    borderBottomColor: COLORS.contours,
  },

  backBtn: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 12,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 3,
  },

  backText: {
    marginTop: -2,

    color: COLORS.return,

    fontSize: 23,
    fontWeight: '900',
  },

  screenTitle: {
    flex: 1,

    marginHorizontal: 8,

    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,

    textAlign: 'center',
  },

  topBarSpacer: {
    width: 42,
  },

  // ── SECTIONS ─────────────────────────

  section: {
    paddingTop: 14,
    paddingBottom: 12,

    marginBottom: 18,

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 12,
  },

  sectionTitleContainer: {
    marginBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitleLine: {
    flex: 1,
    height: 2,

    backgroundColor: COLORS.contours,
  },

  sectionTitle: {
    marginHorizontal: 9,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.9,

    textAlign: 'center',
  },

  // ── COLOR PICKER ─────────────────────

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    justifyContent: 'center',

    paddingVertical: 4,
  },

  colorDot: {
    borderWidth: 2.5,
    borderColor: COLORS.contours,
  },

  colorDotSelected: {
    transform: [
      {
        scale: 1.14,
      },
    ],
  },

  // ── FIELDS ───────────────────────────

  fieldWrapper: {
    marginBottom: 12,
  },

  fieldLabel: {
    marginBottom: 6,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  fieldInput: {
    width: '100%',
    minHeight: 48,

    paddingHorizontal: 12,
    paddingVertical: 10,

    color: COLORS.text2,
    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 10,

    fontSize: 14,
    fontWeight: '600',
  },

  // ── SAVE BUTTON ──────────────────────

  saveBtn: {
    width: '100%',
    minHeight: 54,

    marginTop: 2,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 12,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 5,
  },

  saveBtnDisabled: {
    opacity: 0.6,
  },

  saveBtnText: {
    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
})