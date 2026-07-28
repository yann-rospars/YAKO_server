import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { supabase } from '../lib/supabase'
import LoadingState from '../components/LoadingState'

const COLORS = {
  primary: '#FFE17A',
  white: '#FFFFFF',
  black: '#111111',
  grey: '#777777',
  lightGrey: '#F4F1E8',
}

type ListWithCount = {
  id: number
  name: string
  type: 'system' | 'custom'
  is_public: boolean
  movie_count: number
}

export default function ListsScreen({
  navigation,
}: any) {
  const [lists, setLists] =
    useState<ListWithCount[]>([])

  const [loading, setLoading] = useState(true)

  const [modalVisible, setModalVisible] =
    useState(false)

  const [newListName, setNewListName] =
    useState('')

  const [creating, setCreating] =
    useState(false)

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('lists')
      .select(
        'id, name, type, is_public, list_movies(count)'
      )
      .eq('user_id', user.id)
      .order('type', {
        ascending: false,
      })
      .order('name', {
        ascending: true,
      })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const formatted: ListWithCount[] = (
      data ?? []
    ).map((list: any) => ({
      id: list.id,
      name: list.name,
      type: list.type,
      is_public: list.is_public,
      movie_count:
        list.list_movies?.[0]?.count ?? 0,
    }))

    setLists(formatted)
    setLoading(false)
  }

  const createList = async () => {
    const name = newListName.trim()

    if (!name) return

    setCreating(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setCreating(false)
      return
    }

    const { error } = await supabase
      .from('lists')
      .insert({
        user_id: user.id,
        name,
        type: 'custom',
        is_public: false,
      })

    setCreating(false)

    if (error) {
      if (error.code === '23505') {
        alert(
          'Tu as déjà une liste avec ce nom.'
        )
      } else {
        alert(
          'Erreur lors de la création.'
        )

        console.error(error)
      }

      return
    }

    setNewListName('')
    setModalVisible(false)
    fetchLists()
  }

  const closeModal = () => {
    setModalVisible(false)
    setNewListName('')
  }

  const systemLists = lists.filter(
    (list) => list.type === 'system'
  )

  const customLists = lists.filter(
    (list) => list.type === 'custom'
  )

  const renderListCard = (
    item: ListWithCount
  ) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.listCard,
        item.type === 'system' &&
          styles.systemListCard,
      ]}
      onPress={() =>
        navigation.navigate('ListDetail', {
          listId: item.id,
          listName: item.name,
        })
      }
    >
      <Text
        style={styles.listName}
        numberOfLines={2}
      >
        {item.name}
      </Text>

      <View style={styles.countRow}>
        <Text style={styles.countNumber}>
          {item.movie_count}
        </Text>

        <Text style={styles.countLabel}>
          {item.movie_count === 1
            ? 'FILM'
            : 'FILMS'}
        </Text>
      </View>
    </TouchableOpacity>
  )

  const renderSectionTitle = (
    title: string
  ) => (
    <View style={styles.sectionTitleContainer}>
      <View style={styles.sectionTitleLine} />

      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <View style={styles.sectionTitleLine} />
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <SafeAreaView
          edges={['top']}
          style={styles.loadingSafeArea}
        />

        <View style={styles.loadingContainer}>
          <LoadingState />
        </View>

        <SafeAreaView
          edges={['bottom']}
          style={styles.loadingSafeArea}
        />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* SAFE AREA DU HAUT */}
      <SafeAreaView
        edges={['top']}
        style={styles.topSafeArea}
      />

      {/* ÉCRAN PRINCIPAL */}
      <View style={styles.screen}>
        <View style={styles.topBar}>
          <Text style={styles.title}>
            MES LISTES
          </Text>
        </View>

        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => 'lists-content'}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.contentContainer
          }
          ListHeaderComponent={
            <View style={styles.container}>
              {/* LISTES PAR DÉFAUT */}
              {systemLists.length > 0 && (
                <View style={styles.section}>
                  {renderSectionTitle(
                    'LISTES PAR DÉFAUT'
                  )}

                  <View style={styles.grid}>
                    {systemLists.map((item) => (
                      <View
                        key={item.id}
                        style={
                          styles.listCardWrapper
                        }
                      >
                        {renderListCard(item)}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* LISTES PERSONNALISÉES */}
              <View style={styles.section}>
                <View
                  style={
                    styles.customSectionHeader
                  }
                >
                  <View
                    style={
                      styles.customSectionTitle
                    }
                  >
                    {renderSectionTitle(
                      'MES LISTES'
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.addBtn}
                    onPress={() =>
                      setModalVisible(true)
                    }
                  >
                    <Text
                      style={styles.addBtnText}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>

                {customLists.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text
                      style={styles.emptyText}
                    >
                      AUCUNE LISTE PERSONNALISÉE
                    </Text>

                    <Text
                      style={styles.emptyHint}
                    >
                      Crée ta première liste pour
                      organiser tes films.
                    </Text>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={
                        styles.emptyCreateBtn
                      }
                      onPress={() =>
                        setModalVisible(true)
                      }
                    >
                      <Text
                        style={
                          styles.emptyCreateText
                        }
                      >
                        + CRÉER UNE LISTE
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.grid}>
                    {customLists.map((item) => (
                      <View
                        key={item.id}
                        style={
                          styles.listCardWrapper
                        }
                      >
                        {renderListCard(item)}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          }
        />
      </View>

      {/* MODAL NOUVELLE LISTE */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : 'height'
          }
          style={styles.modalOverlay}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeModal}
          />

          <View style={styles.modalBox}>
            <View
              style={
                styles.modalTitleContainer
              }
            >
              <View
                style={styles.modalTitleLine}
              />

              <Text style={styles.modalTitle}>
                NOUVELLE LISTE
              </Text>

              <View
                style={styles.modalTitleLine}
              />
            </View>

            <Text style={styles.inputLabel}>
              NOM DE LA LISTE
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Ex. Films préférés"
              placeholderTextColor={COLORS.grey}
              value={newListName}
              onChangeText={setNewListName}
              maxLength={30}
              autoFocus
              onSubmitEditing={createList}
              returnKeyType="done"
              allowFontScaling={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.cancelBtn}
                onPress={closeModal}
              >
                <Text
                  style={styles.cancelText}
                >
                  ANNULER
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.confirmBtn,
                  (!newListName.trim() ||
                    creating) &&
                    styles.confirmBtnDisabled,
                ]}
                onPress={createList}
                disabled={
                  !newListName.trim() ||
                  creating
                }
              >
                {creating ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.black}
                  />
                ) : (
                  <Text
                    style={styles.confirmText}
                  >
                    CRÉER
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.lightGrey,
  },

  topSafeArea: {
    backgroundColor: COLORS.lightGrey,
  },
  
  loadingRoot: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  loadingSafeArea: {
    backgroundColor: COLORS.white,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.lightGrey,
  },

  contentContainer: {
    paddingBottom: 24,
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  // TOP BAR

  topBar: {
    minHeight: 72,
    marginHorizontal: 16,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
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

  title: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.1,
    textAlign: 'center',
  },

  // SECTIONS

  section: {
    marginBottom: 26,
  },

  sectionTitleContainer: {
    flex: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionTitleLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.black,
  },

  sectionTitle: {
    marginHorizontal: 10,
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  customSectionHeader: {
    minHeight: 48,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  customSectionTitle: {
    flex: 1,
  },

  addBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 12,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  addBtnText: {
    marginTop: -2,
    color: COLORS.black,
    fontSize: 24,
    fontWeight: '900',
  },

  // GRID

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },

  listCardWrapper: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 14,
  },

  listCard: {
    minHeight: 120,
    padding: 13,
    justifyContent: 'space-between',
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

  systemListCard: {
    backgroundColor: COLORS.primary,
  },

  listName: {
    marginVertical: 9,
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 17,
  },

  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },

  countNumber: {
    color: COLORS.black,
    fontSize: 23,
    fontWeight: '900',
  },

  countLabel: {
    color: COLORS.grey,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // EMPTY STATE

  emptyBox: {
    paddingHorizontal: 20,
    paddingVertical: 26,
    alignItems: 'center',
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

  emptyText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  emptyHint: {
    marginTop: 8,
    color: COLORS.grey,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },

  emptyCreateBtn: {
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 10,
  },

  emptyCreateText: {
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // MODAL

  modalOverlay: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  modalBox: {
    width: '100%',
    padding: 18,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 16,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 6,
      height: 6,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },

  modalTitleContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  modalTitleLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.black,
  },

  modalTitle: {
    marginHorizontal: 10,
    color: COLORS.black,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  inputLabel: {
    marginBottom: 6,
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  input: {
    minHeight: 50,
    paddingHorizontal: 12,
    color: COLORS.black,
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '600',

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  modalActions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 12,
  },

  cancelText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  confirmBtn: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 12,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },

  confirmBtnDisabled: {
    opacity: 0.45,
  },

  confirmText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
})