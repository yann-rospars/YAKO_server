import {
  useCallback,
  useState,
} from 'react'

import {
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
    useState<any>(null)

  const [loading, setLoading] =
    useState(true)

  /*
    ----------------------------------
    USER
    ----------------------------------
  */

  useFocusEffect(
    useCallback(() => {
      fetchUser()
    }, [])
  )

  const fetchUser = async () => {
    const {
      data: { user: authUser },
    } =
      await supabase.auth.getUser()

    if (!authUser) {
      setLoading(false)
      return
    }

    const {
      data,
      error,
    } = await supabase
      .from('users')
      .select('*')
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

    setUser(data)
    setLoading(false)
  }

  const logout = async () => {
    await supabase.auth.signOut()
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
        <LoadingState />
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

            <View
              style={
                styles.row
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                VILLE
              </Text>

              <Text
                style={
                  styles.value
                }
                numberOfLines={1}
              >
                {user.city || '—'}
              </Text>
            </View>

            <View
              style={
                styles.row
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                LATITUDE
              </Text>

              <Text
                style={
                  styles.value
                }
              >
                {user.latitude ?? '—'}
              </Text>
            </View>

            <View
              style={[
                styles.row,
                styles.lastRow,
              ]}
            >
              <Text
                style={
                  styles.label
                }
              >
                LONGITUDE
              </Text>

              <Text
                style={
                  styles.value
                }
              >
                {user.longitude ?? '—'}
              </Text>
            </View>
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
                styles.editBtn
              }
              onPress={() =>
                navigation.navigate(
                  'EditAccount'
                )
              }
            >
              <Text
                style={
                  styles.editText
                }
              >
                MODIFIER LE COMPTE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={
                styles.logoutBtn
              }
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
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 8,

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

  value: {
    maxWidth: '60%',

    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '800',

    textAlign: 'right',
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

  editBtn: {
    width: '100%',
    minHeight: 52,

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

  editText: {
    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
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