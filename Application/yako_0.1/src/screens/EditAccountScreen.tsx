import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { C } from '../theme/colors'

// ── COULEURS DISPONIBLES ──────────────────────────────
const AVATAR_COLORS = [
  '#FF6B35', '#00E5A0', '#3B82F6', '#A855F7',
  '#F59E0B', '#EF4444', '#10B981', '#EC4899',
]

// ── CHAMP GÉNÉRIQUE ──────────────────────────────────
const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'numeric' | 'decimal-pad'
}) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder ?? label}
      placeholderTextColor={C.muted}
      keyboardType={keyboardType}
      style={styles.fieldInput}
    />
  </View>
)

// ── SCREEN ───────────────────────────────────────────
export default function EditAccountScreen({ navigation }: any) {
  const [userId,   setUserId  ] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [city,     setCity    ] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude,setLongitude] = useState('')
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0])

  const [loading, setLoading] = useState(true)
  const [saving,  setSaving  ] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [])

  // ── FETCH ──
  const fetchUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    setUserId(authUser.id)

    const { data, error } = await supabase
      .from('users')
      .select('username, avatar_color, city, latitude, longitude')
      .eq('id', authUser.id)
      .single()

    if (error) { console.log(error); setLoading(false); return }

    setUsername(data.username     ?? '')
    setAvatarColor(data.avatar_color ?? AVATAR_COLORS[0])
    setCity(data.city             ?? '')
    setLatitude(data.latitude     != null ? String(data.latitude)  : '')
    setLongitude(data.longitude   != null ? String(data.longitude) : '')

    setLoading(false)
  }

  // ── VALIDATION ──
  const validate = (): string | null => {
    if (!username.trim())          return 'Le pseudo ne peut pas être vide.'
    if (username.trim().length < 3) return 'Le pseudo doit faire au moins 3 caractères.'
    if (latitude  && isNaN(Number(latitude)))  return 'La latitude doit être un nombre.'
    if (longitude && isNaN(Number(longitude))) return 'La longitude doit être un nombre.'
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (latitude  && (lat < -90  || lat > 90))  return 'Latitude invalide (entre -90 et 90).'
    if (longitude && (lng < -180 || lng > 180)) return 'Longitude invalide (entre -180 et 180).'
    return null
  }

  // ── SAVE ──
  const save = async () => {
    const err = validate()
    if (err) { Alert.alert('Erreur', err); return }

    if (!userId) return

    setSaving(true)

    const { error } = await supabase
      .from('users')
      .update({
        username:     username.trim(),
        avatar_color: avatarColor,
        city:         city.trim() || null,
        latitude:     latitude  ? Number(latitude)  : null,
        longitude:    longitude ? Number(longitude) : null,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', userId)

    setSaving(false)

    if (error) {
      // Cas username déjà pris (contrainte UNIQUE)
      if (error.code === '23505') {
        Alert.alert('Pseudo déjà pris', 'Ce pseudo est utilisé par un autre compte.')
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue, réessaie.')
        console.log(error)
      }
      return
    }

    Alert.alert('✅ Sauvegardé', 'Ton profil a bien été mis à jour.', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ])
  }

  // ── LOADING ──
  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Modifier le compte</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* APERÇU AVATAR */}
        <View style={styles.avatarPreview}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]} />
          <Text style={styles.avatarUsername}>{username || 'Pseudo'}</Text>
        </View>

        {/* COULEUR */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Couleur du profil</Text>
          <View style={styles.colorGrid}>
            {AVATAR_COLORS.map(color => (
              <TouchableOpacity
                key={color}
                onPress={() => setAvatarColor(color)}
                style={[
                  styles.colorDot,
                  { backgroundColor: color },
                  avatarColor === color && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>
        </View>

        {/* IDENTITÉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identité</Text>
          <Field
            label="Pseudo"
            value={username}
            onChangeText={setUsername}
            placeholder="Ton pseudo"
          />
        </View>

        {/* LOCALISATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>
          <Field
            label="Ville"
            value={city}
            onChangeText={setCity}
            placeholder="Paris, Lyon..."
          />
          <Field
            label="Latitude"
            value={latitude}
            onChangeText={setLatitude}
            placeholder="48.8566"
            keyboardType="decimal-pad"
          />
          <Field
            label="Longitude"
            value={longitude}
            onChangeText={setLongitude}
            placeholder="2.3522"
            keyboardType="decimal-pad"
          />
        </View>

        {/* BOUTON SAVE */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <Text style={styles.saveBtnText}>Enregistrer</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

// ── STYLES ───────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  container: { padding: 16, paddingBottom: 48 },

  // TOP BAR
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText:    { color: C.text, fontSize: 20, fontWeight: 'bold' },
  screenTitle: { color: C.text, fontSize: 17, fontWeight: '700' },

  // AVATAR PREVIEW
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 10,
  },
  avatarCircle: {
    width: 72, height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: C.accent,
  },
  avatarUsername: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
  },

  // SECTION
  section: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    color: C.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // COLOR PICKER
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorDot: {
    width: 36, height: 36,
    borderRadius: 18,
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: C.text,
    transform: [{ scale: 1.15 }],
  },

  // FIELD
  fieldWrapper: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
    letterSpacing: 0.4,
  },
  fieldInput: {
    backgroundColor: C.card,
    color: C.text,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },

  // SAVE
  saveBtn: {
    backgroundColor: C.accent,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: { color: 'white', fontWeight: '800', fontSize: 15 },
})