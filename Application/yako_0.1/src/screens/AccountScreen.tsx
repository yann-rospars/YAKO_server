import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { C } from '../theme/colors'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'

export default function AccountScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      fetchUser()
    }, [])
  )

  const fetchUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) { console.log(error); return }

    setUser(data)
    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    )
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Text style={{ color: C.text, padding: 16 }}>Utilisateur introuvable</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.profileInline}>
            <View style={[styles.avatar, { backgroundColor: user.avatar_color || C.accent }]} />
            <View>
              <Text style={styles.username}>{user.username || 'Utilisateur'}</Text>
              {user.city && <Text style={styles.city}>📍 {user.city}</Text>}
            </View>
          </View>
        </View>

        {/* LOCALISATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Localisation</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Ville</Text>
            <Text style={styles.value}>{user.city || '—'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.value}>{user.latitude ?? '—'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.value}>{user.longitude ?? '—'}</Text>
          </View>
        </View>

        {/* NAVIGATION RAPIDE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mes contenus</Text>

          <TouchableOpacity
            style={styles.navRow}
            onPress={() => navigation.navigate('Lists')}
          >
            <Text style={styles.navLabel}>Mes listes</Text>
            <Text style={styles.navArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navRow, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('Friends')}
          >
            <Text style={styles.navLabel}>Mes amis</Text>
            <Text style={styles.navArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditAccount')}>
            <Text style={styles.editText}>Modifier le compte</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  container: {
    padding: 16,
    paddingBottom: 40,
  },

  // TOP BAR
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
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

  backText: { color: C.text, fontSize: 20, fontWeight: 'bold' },

  // PROFIL
  profileInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: C.accent,
  },

  username: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
  },

  city: {
    color: C.muted,
    fontSize: 12,
  },

  // SECTIONS
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
    marginBottom: 8,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },

  label: { color: C.muted, fontSize: 14 },
  value: { color: C.text, fontSize: 14, fontWeight: '500' },

  // ACTIONS
  actions: { gap: 12, marginTop: 4 },

  editBtn: {
    backgroundColor: C.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  editText: { color: 'white', fontWeight: '700', fontSize: 15 },

  logoutBtn: {
    backgroundColor: C.card,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },

  logoutText: { color: '#ff4d4d', fontWeight: '600', fontSize: 15 },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  navLabel: { color: C.text, fontSize: 14, fontWeight: '500' },
  navArrow: { color: C.muted, fontSize: 16 },
})