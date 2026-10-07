import { MaterialIcons } from '@expo/vector-icons'
import {
  useCallback,
  useRef,
  useState,
} from 'react'

import {
  Alert,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native'

import {
  SafeAreaView,
} from 'react-native-safe-area-context'

import {
  useFocusEffect,
} from '@react-navigation/native'

import { supabase } from '../lib/supabase'
import LoadingState from '../components/LoadingState'
import { COLORS } from '../theme/colors'

const AVATAR_COLORS = [
  '#FF6B35', '#00E5A0', '#3B82F6', '#A855F7',
  '#F59E0B', '#EF4444', '#10B981', '#EC4899',
]

type Account = {
  id: string
  username: string | null
  avatar_color: string | null
  email: string
  pendingEmail: string
}
type EditableField = 'avatar_color' | 'username'

export default function AccountScreen({
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

  const contentMaxWidth = 520

  const contentWidth = Math.min(
    width - horizontalPadding * 2,
    contentMaxWidth
  )

  const sectionHorizontalPadding =
    width < 360
      ? 10
      : 12

  /*
    ----------------------------------
    STATE
    ----------------------------------
  */

  const [user, setUser] =
    useState<Account | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [editing, setEditing] = useState<EditableField | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const requestVersion = useRef(0)

  useFocusEffect(useCallback(() => {
    let active = true
    const version = ++requestVersion.current
    const fetchUser = async () => {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
        if (authError) throw authError
        if (!authUser) return
        const { data, error } = await supabase.from('users')
          .select('id, username, avatar_color').eq('id', authUser.id).single()
        if (error) throw error
        if (active && version === requestVersion.current) {
          setUser({ ...data, email: authUser.email ?? '', pendingEmail: authUser.new_email ?? '' })
        }
      } catch {
        if (active) Alert.alert('Erreur', 'Impossible de charger le compte.')
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchUser()
    return () => { active = false }
  }, []))

  const startEditing = (field: EditableField) => {
    if (!user || savingRef.current) return
    setDraft(field === 'avatar_color' ? user.avatar_color ?? AVATAR_COLORS[0]
      : user.username ?? '')
    setEditing(field)
  }

  const saveField = async () => {
    if (!user || !editing || savingRef.current) return
    const field = editing
    const value = draft.trim()
    const currentValue = field === 'avatar_color' ? user.avatar_color ?? AVATAR_COLORS[0]
      : user.username ?? ''
    if (value === currentValue.trim()) {
      setEditing(null)
      return
    }
    if (field === 'username' && value.length < 3) {
      Alert.alert('Pseudo invalide', 'Le pseudo doit faire au moins 3 caract\u00e8res.')
      return
    }
    savingRef.current = true
    setSaving(true)
    requestVersion.current += 1
    try {
      const { data, error } = await supabase.from('users')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', user.id).select('id, username, avatar_color').single()
      if (error) throw error
      setUser((current) => current ? { ...current, ...data } : current)
      setEditing(null)
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : null
      Alert.alert(code === '23505' ? 'Pseudo d\u00e9j\u00e0 pris' : 'Erreur',
        code === '23505' ? 'Ce pseudo est utilis\u00e9 par un autre compte.'
          : 'Impossible d\u2019enregistrer la modification. R\u00e9essaie.')
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) Alert.alert('Erreur', 'Impossible de se d\u00e9connecter.')
  }

  const renderAccountRow = (field: EditableField | 'email', label: string) => {
    if (!user) return null
    const isEditing = editing === field
    return (
      <View style={[styles.row, field === 'email' && styles.lastRow]}>
        <View style={styles.fieldContent}>
          <Text style={styles.label}>{label}</Text>
          <View style={styles.fieldValueRow}>
            <View style={styles.fieldValue}>
              {field === 'avatar_color' ? (
                isEditing ? <View style={styles.colorGrid}>
                  {AVATAR_COLORS.map((color) => (
                    <TouchableOpacity key={color} disabled={saving}
                      accessibilityRole="button" accessibilityLabel={`Couleur ${color}`}
                      accessibilityState={{ selected: draft === color }}
                      onPress={() => setDraft(color)}
                      style={[styles.colorDot, { backgroundColor: color }, draft === color && styles.selectedColor]}>
                      {draft === color && <MaterialIcons name="check" size={20} color={COLORS.contours} />}
                    </TouchableOpacity>
                  ))}
                </View> : <View style={[styles.colorDot, { backgroundColor: user.avatar_color || COLORS.primary }]} />
              ) : field !== 'email' && isEditing ? (
                <TextInput value={draft} onChangeText={setDraft} editable={!saving}
                  accessibilityLabel={label} autoFocus autoCapitalize="none" autoCorrect={false}
                  keyboardType="default"
                  autoComplete="username"
                  returnKeyType="done" onSubmitEditing={saveField} style={styles.fieldInput} />
              ) : <Text style={styles.accountValue}>{field === 'email' ? user.email : user.username || '\u2014'}</Text>}
            </View>
            {field !== 'email' && <TouchableOpacity disabled={saving} style={styles.fieldAction}
              accessibilityRole="button" accessibilityLabel={`${isEditing ? 'Enregistrer' : 'Modifier'} ${label}`}
              onPress={() => isEditing ? saveField() : startEditing(field)}>
              {saving && isEditing ? <LoadingState inline />
                : <MaterialIcons name={isEditing ? 'check' : 'edit'} size={22} color={COLORS.icon} />}
            </TouchableOpacity>}
          </View>
          {field === 'email' && !!user.pendingEmail && user.pendingEmail !== user.email && (
            <Text style={styles.pendingEmail}>Confirmation en attente : {user.pendingEmail}</Text>
          )}
        </View>
      </View>
    )
  }

  /*
    ----------------------------------
    LOADING
    ----------------------------------
  */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingRoot}
        edges={['top']}
      >
        <LoadingState fullScreen />
      </SafeAreaView>
    )
  }

  /*
    ----------------------------------
    USER NOT FOUND
    ----------------------------------
  */

  if (!user) {
    return (
      <SafeAreaView
        style={styles.root}
        edges={['top']}
      >
        <View
          style={styles.notFoundScreen}
        >
          <View
            style={
              styles.notFoundContainer
            }
          >
            <Text
              style={
                styles.notFoundText
              }
            >
              UTILISATEUR INTROUVABLE
            </Text>
          </View>
        </View>
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
      <View style={styles.topBar}>
        <View
          style={
            styles.profileInline
          }
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor:
                  user.avatar_color ||
                  COLORS.primary,
              },
            ]}
          />

          <View
            style={
              styles.profileText
            }
          >
            <Text
              style={
                styles.username
              }
              numberOfLines={1}
            >
              {user.username ||
                'Utilisateur'}
            </Text>
          </View>
        </View>
      </View>

      {/* CONTENU SCROLLABLE */}
      <ScrollView
        style={styles.scrollView}
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal:
              horizontalPadding,
          },
        ]}
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.content,
            {
              width:
                contentWidth,
            },
          ]}
        >
          <View style={[styles.section, { paddingHorizontal: sectionHorizontalPadding }]}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionTitleLine} />
              <Text style={styles.sectionTitle}>DONNÉES DU COMPTE</Text>
              <View style={styles.sectionTitleLine} />
            </View>
            {renderAccountRow('avatar_color', 'COULEUR')}
            {renderAccountRow('username', 'PSEUDO')}
            {renderAccountRow('email', 'E-MAIL')}
          </View>

          {/* MES CONTENUS */}
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
                MES CONTENUS
              </Text>

              <View
                style={
                  styles.sectionTitleLine
                }
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              style={
                styles.navRow
              }
              onPress={() =>
                navigation.navigate(
                  'Lists'
                )
              }
            >
              <Text
                style={
                  styles.navLabel
                }
              >
                MES LISTES
              </Text>

              <Text
                style={
                  styles.navArrow
                }
              >
                →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={[
                styles.navRow,
                styles.lastRow,
              ]}
              onPress={() =>
                navigation.navigate(
                  'Friends'
                )
              }
            >
              <Text
                style={
                  styles.navLabel
                }
              >
                MES AMIS
              </Text>

              <Text
                style={
                  styles.navArrow
                }
              >
                →
              </Text>
            </TouchableOpacity>
          </View>

          {/* ACTIONS */}
          <View
            style={
              styles.actions
            }
          >


            <TouchableOpacity
              activeOpacity={0.8}
              style={
                styles.logoutBtn
              }
              disabled={saving}
              onPress={logout}
            >
              <Text
                style={
                  styles.logoutText
                }
              >
                SE DÉCONNECTER
              </Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 32,
    backgroundColor: COLORS.background,
  },

  content: {
    alignSelf: 'center',
  },

  // ── HEADER ───────────────────────────

  topBar: {
    minHeight: 0,
    paddingHorizontal: 16,
    paddingBottom:10,
    paddingTop:2,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.primary,

    borderBottomWidth: 3,
    borderBottomColor: COLORS.contours,
  },

  // ── PROFILE ──────────────────────────

  profileInline: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,
  },

  profileText: {
    flex: 1,
    minWidth: 0,
  },

  avatar: {
    width: 46,
    height: 46,

    flexShrink: 0,

    borderWidth: 2.5,
    borderColor: COLORS.contours,
    borderRadius: 23,
  },

  username: {
    color: COLORS.text2,

    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },

  // ── SECTIONS ─────────────────────────

  section: {
    paddingTop: 14,
    paddingBottom: 6,
    marginBottom: 18,

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 12,
  },

  sectionTitleContainer: {
    marginBottom: 8,

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

    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,

    textAlign: 'center',
  },

  // ── INFORMATIONS ─────────────────────

  fieldContent: { flex: 1, minWidth: 0, gap: 8, paddingVertical: 12 },
  fieldValueRow: { flexDirection: 'row', alignItems: 'center' },
  fieldValue: { flex: 1, minWidth: 0 },
  accountValue: { color: COLORS.text2, fontSize: 14, fontWeight: '700' },
  fieldInput: { 
    minHeight: 42, 
    paddingHorizontal: 10, 
    paddingVertical: 8,
    borderWidth: 2, 
    borderColor: COLORS.contours, 
    borderRadius: 9,
    color: COLORS.text2, 
    backgroundColor: COLORS.secondary, 
    fontSize: 14 
  },
  fieldAction: { 
    width: 40, 
    height: 30, 
    flexShrink: 0, 
    marginLeft: 10, 
    alignItems: 'center',
    justifyContent: 'center', 
    // backgroundColor: COLORS.primary, 
    // borderWidth: 2,
    // borderColor: COLORS.contours, 
    borderRadius: 10 
  },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 2,
    borderColor: COLORS.contours, alignItems: 'center', justifyContent: 'center' },
  selectedColor: { borderWidth: 3, transform: [{ scale: 1.1 }] },
  pendingEmail: { color: COLORS.ghostText, fontSize: 12 },

  row: {
    minHeight: 46,
    paddingHorizontal: 4,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.contours,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  label: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },



  // ── NAVIGATION ───────────────────────

  navRow: {
    minHeight: 52,
    paddingHorizontal: 4,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.contours,
  },

  navLabel: {
    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  navArrow: {
    color: COLORS.text2,

    fontSize: 22,
    fontWeight: '900',
  },

  // ── ACTIONS ──────────────────────────

  actions: {
    gap: 14,
    marginTop: 4,
  },





  logoutBtn: {
    width: '100%',
    minHeight: 52,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

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

  logoutText: {
    color: COLORS.important,

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── NOT FOUND ────────────────────────

  notFoundScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  notFoundContainer: {
    margin: 16,
    padding: 20,

    alignItems: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 12,
  },

  notFoundText: {
    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
})
