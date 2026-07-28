import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'
import LoadingState from '../components/LoadingState'

const COLORS = {
  primary: '#FFE17A',
  white: '#FFFFFF',
  black: '#111111',
  grey: '#777777',
  lightGrey: '#F4F1E8',
  red: '#E5484D',
}

export default function AccountScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      fetchUser()
    }, [])
  )

  const fetchUser = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) return

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (error) {
      console.log(error)
      return
    }

    setUser(data)
    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <View style={styles.root}>
      <SafeAreaView
        edges={['top']}
        style={styles.topSafeArea}
      />

      <View style={styles.screen}>
        {loading ? (
          <LoadingState />
        ) : !user ? (
          <View style={styles.notFoundContainer}>
            <Text style={styles.notFoundText}>
              UTILISATEUR INTROUVABLE
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
          >
            {/* TOP BAR */}
            <View style={styles.topBar}>
              <View style={styles.profileInline}>
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

                <View style={styles.profileText}>
                  <Text
                    style={styles.username}
                    numberOfLines={1}
                  >
                    {user.username || 'Utilisateur'}
                  </Text>
                </View>
              </View>
            </View>

            {/* LOCALISATION */}
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />

                <Text style={styles.sectionTitle}>
                  LOCALISATION
                </Text>

                <View style={styles.sectionTitleLine} />
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>VILLE</Text>

                <Text
                  style={styles.value}
                  numberOfLines={1}
                >
                  {user.city || '—'}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>LATITUDE</Text>

                <Text style={styles.value}>
                  {user.latitude ?? '—'}
                </Text>
              </View>

              <View style={[styles.row, styles.lastRow]}>
                <Text style={styles.label}>
                  LONGITUDE
                </Text>

                <Text style={styles.value}>
                  {user.longitude ?? '—'}
                </Text>
              </View>
            </View>

            {/* NAVIGATION RAPIDE */}
            <View style={styles.section}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />

                <Text style={styles.sectionTitle}>
                  MES CONTENUS
                </Text>

                <View style={styles.sectionTitleLine} />
              </View>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.navRow}
                onPress={() =>
                  navigation.navigate('Lists')
                }
              >
                <Text style={styles.navLabel}>
                  MES LISTES
                </Text>

                <Text style={styles.navArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={[
                  styles.navRow,
                  styles.lastRow,
                ]}
                onPress={() =>
                  navigation.navigate('Friends')
                }
              >
                <Text style={styles.navLabel}>
                  MES AMIS
                </Text>

                <Text style={styles.navArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* ACTIONS */}
            <View style={styles.actions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.editBtn}
                onPress={() =>
                  navigation.navigate('EditAccount')
                }
              >
                <Text style={styles.editText}>
                  MODIFIER LE COMPTE
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.logoutBtn}
                onPress={logout}
              >
                <Text style={styles.logoutText}>
                  SE DÉCONNECTER
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: COLORS.lightGrey,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  topSafeArea: {
    backgroundColor: COLORS.lightGrey,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.lightGrey,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: COLORS.lightGrey,
  },

  notFoundContainer: {
    margin: 16,
    padding: 20,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 14,
  },

  notFoundText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  loadingHeaderTitle: {
    flex: 1,
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  // TOP BAR

  topBar: {
    minHeight: 82,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primary,
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

  backBtn: {
    width: 42,
    height: 42,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 12,

    shadowColor: COLORS.black,
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
    color: COLORS.black,
    fontSize: 23,
    fontWeight: '900',
  },

  // PROFIL

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
    width: 48,
    height: 48,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 24,
  },

  username: {
    color: COLORS.black,
    fontSize: 17,
    fontWeight: '900',
  },

  // SECTIONS

  section: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
    marginBottom: 18,
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

  sectionTitleContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitleLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: COLORS.black,
  },

  sectionTitle: {
    marginHorizontal: 9,
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  row: {
    minHeight: 46,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },

  lastRow: {
    borderBottomWidth: 0,
  },

  label: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  value: {
    maxWidth: '60%',
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },

  // NAVIGATION

  navRow: {
    minHeight: 52,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.black,
  },

  navLabel: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  navArrow: {
    color: COLORS.black,
    fontSize: 22,
    fontWeight: '900',
  },

  // ACTIONS

  actions: {
    gap: 14,
    marginTop: 4,
  },

  editBtn: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 12,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  editText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  logoutBtn: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 12,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  logoutText: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
})
