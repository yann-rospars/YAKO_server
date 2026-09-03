import {
  useCallback,
  useState,
} from 'react'

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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

  const [loading, setLoading] =
    useState(true)

  const [modalVisible, setModalVisible] =
    useState(false)

  const [newListName, setNewListName] =
    useState('')

  const [creating, setCreating] =
    useState(false)

  const [
    deleteModalVisible,
    setDeleteModalVisible,
  ] = useState(false)

  const [
    listToDelete,
    setListToDelete,
  ] =
    useState<ListWithCount | null>(
      null
    )

  const [deleting, setDeleting] =
    useState(false)

  /*
    ----------------------------------
    CHARGEMENT / RAFRAÎCHISSEMENT
    ----------------------------------

    Premier affichage :
    loading = true
    → LoadingState

    Retours suivants :
    la page reste visible
    pendant le rafraîchissement.
  */

  const fetchLists = async () => {
    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } =
      await supabase
        .from('lists')
        .select(
          'id, name, type, is_public, list_movies(count)'
        )
        .eq(
          'user_id',
          user.id
        )
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

    const formatted:
      ListWithCount[] = (
      data ?? []
    ).map((list: any) => ({
      id: list.id,
      name: list.name,
      type: list.type,
      is_public:
        list.is_public,

      movie_count:
        list.list_movies?.[0]
          ?.count ?? 0,
    }))

    setLists(formatted)
    setLoading(false)
  }

  /*
    À chaque fois que ListsScreen
    redevient active, on relit les listes.

    Comme on ne remet PAS loading à true,
    les retours sont instantanés.
  */

  useFocusEffect(
    useCallback(() => {
      fetchLists()
    }, [])
  )

  /*
    ----------------------------------
    CRÉATION LISTE
    ----------------------------------
  */

  const createList = async () => {
    const name =
      newListName.trim()

    if (!name) return

    setCreating(true)

    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      setCreating(false)
      return
    }

    const { error } =
      await supabase
        .from('lists')
        .insert({
          user_id: user.id,
          name,
          type: 'custom',
          is_public: false,
        })

    setCreating(false)

    if (error) {
      if (
        error.code === '23505'
      ) {
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

    await fetchLists()
  }

  const closeModal = () => {
    setModalVisible(false)
    setNewListName('')
  }

  /*
    ----------------------------------
    SUPPRESSION LISTE
    ----------------------------------
  */

  const openDeleteModal = (
    list: ListWithCount
  ) => {
    setListToDelete(list)
    setDeleteModalVisible(true)
  }

  const closeDeleteModal = () => {
    if (deleting) return

    setDeleteModalVisible(false)
    setListToDelete(null)
  }

  const deleteList = async () => {
    if (
      !listToDelete ||
      listToDelete.type ===
        'system'
    ) {
      return
    }

    setDeleting(true)

    const { error } =
      await supabase
        .from('lists')
        .delete()
        .eq(
          'id',
          listToDelete.id
        )
        .eq(
          'type',
          'custom'
        )

    setDeleting(false)

    if (error) {
      console.error(
        'Erreur suppression liste :',
        error
      )

      alert(
        'Impossible de supprimer cette liste.'
      )

      return
    }

    setLists(
      (currentLists) =>
        currentLists.filter(
          (list) =>
            list.id !==
            listToDelete.id
        )
    )

    setDeleteModalVisible(false)
    setListToDelete(null)
  }

  /*
    ----------------------------------
    LISTES SYSTÈME / CUSTOM
    ----------------------------------
  */

  const systemLists =
    lists.filter(
      (list) =>
        list.type === 'system'
    )

  const customLists =
    lists.filter(
      (list) =>
        list.type === 'custom'
    )

  /*
    ----------------------------------
    CARD LISTE
    ----------------------------------
  */

  const renderListCard = (
    item: ListWithCount
  ) => (
    <View
      style={
        styles.listRowWrapper
      }
    >
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.listRow,

          item.type ===
            'system' &&
            styles.systemListRow,
        ]}
        onPress={() =>
          navigation.navigate(
            'ListDetail',
            {
              listId: item.id,
              listName:
                item.name,
            }
          )
        }
      >
        <Text
          style={
            styles.listName
          }
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>

        <View
          style={
            styles.countRow
          }
        >
          <Text
            style={
              styles.countNumber
            }
          >
            {item.movie_count}
          </Text>

          <Text
            style={
              styles.countLabel
            }
          >
            {item.movie_count ===
            1
              ? 'FILM'
              : 'FILMS'}
          </Text>
        </View>
      </TouchableOpacity>

      {item.type ===
        'custom' && (
        <TouchableOpacity
          activeOpacity={0.8}
          hitSlop={8}
          style={
            styles.deleteListButton
          }
          onPress={() =>
            openDeleteModal(
              item
            )
          }
        >
          <Text
            style={
              styles.deleteListButtonText
            }
          >
            ×
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderSectionTitle = (
    title: string
  ) => (
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
        {title}
      </Text>

      <View
        style={
          styles.sectionTitleLine
        }
      />
    </View>
  )

  /*
    ----------------------------------
    LOADING INITIAL
    ----------------------------------
  */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.root}
        edges={['top', 'bottom']}
      >
        <LoadingState fullScreen />
      </SafeAreaView>
    )
  }

  /*
    ----------------------------------
    RETURN
    ----------------------------------
  */

  return (
    <View style={styles.root}>
      <SafeAreaView
        edges={['top']}
        style={
          styles.topSafeArea
        }
      />

      <View
        style={
          styles.screen
        }
      >
        <View
          style={
            styles.topBar
          }
        >
          <Text
            style={
              styles.title
            }
          >
            MES LISTES
          </Text>
        </View>

        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() =>
            'lists-content'
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.contentContainer
          }
          ListHeaderComponent={
            <View
              style={
                styles.container
              }
            >
              {/* LISTES PAR DÉFAUT */}
              {systemLists.length >
                0 && (
                <View
                  style={
                    styles.section
                  }
                >
                  <View
                    style={
                      styles.listContainer
                    }
                  >
                    {systemLists.map(
                      (item) => (
                        <View
                          key={
                            item.id
                          }
                        >
                          {renderListCard(
                            item
                          )}
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

              {/* LISTES PERSONNALISÉES */}
              <View style={styles.section}>
                <View style={ styles.customSectionHeader}>
                  <TouchableOpacity
                    activeOpacity={
                      0.8
                    }
                    style={
                      styles.addBtn
                    }
                    onPress={() =>
                      setModalVisible(
                        true
                      )
                    }
                  >
                    <Text
                      style={
                        styles.addBtnText
                      }
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>

                {customLists.length ===
                0 ? (
                  <View
                    style={
                      styles.emptyBox
                    }
                  >
                    <Text
                      style={
                        styles.emptyText
                      }
                    >
                      AUCUNE LISTE PERSONNALISÉE
                    </Text>

                    <Text
                      style={
                        styles.emptyHint
                      }
                    >
                      Crée ta première
                      liste pour
                      organiser tes
                      films.
                    </Text>

                    <TouchableOpacity
                      activeOpacity={
                        0.8
                      }
                      style={
                        styles.emptyCreateBtn
                      }
                      onPress={() =>
                        setModalVisible(
                          true
                        )
                      }
                    >
                      <Text
                        style={
                          styles.emptyCreateText
                        }
                      >
                        + CRÉER UNE
                        LISTE
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View
                    style={
                      styles.listContainer
                    }
                  >
                    {customLists.map(
                      (item) => (
                        <View
                          key={
                            item.id
                          }
                        >
                          {renderListCard(
                            item
                          )}
                        </View>
                      )
                    )}
                  </View>
                )}
              </View>
            </View>
          }
        />
      </View>

      {/* MODAL NOUVELLE LISTE */}
      <Modal
        visible={
          modalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeModal
        }
      >
        <KeyboardAvoidingView
          behavior={
            Platform.OS ===
            'ios'
              ? 'padding'
              : 'height'
          }
          style={
            styles.modalOverlay
          }
        >
          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={
              closeModal
            }
          />

          <View
            style={
              styles.modalBox
            }
          >
            <View
              style={
                styles.modalTitleContainer
              }
            >
              <View
                style={
                  styles.modalTitleLine
                }
              />

              <Text
                style={
                  styles.modalTitle
                }
              >
                NOUVELLE LISTE
              </Text>

              <View
                style={
                  styles.modalTitleLine
                }
              />
            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              NOM DE LA LISTE
            </Text>

            <TextInput
              style={
                styles.input
              }
              placeholder="Ex. Films préférés"
              placeholderTextColor={
                COLORS.ghostText
              }
              value={
                newListName
              }
              onChangeText={
                setNewListName
              }
              maxLength={30}
              autoFocus
              onSubmitEditing={
                createList
              }
              returnKeyType="done"
              allowFontScaling={
                false
              }
            />

            <View
              style={
                styles.modalActions
              }
            >
              <TouchableOpacity
                activeOpacity={
                  0.8
                }
                style={
                  styles.cancelBtn
                }
                onPress={
                  closeModal
                }
              >
                <Text
                  style={
                    styles.cancelText
                  }
                >
                  ANNULER
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={
                  0.8
                }
                style={[
                  styles.confirmBtn,

                  (!newListName.trim() ||
                    creating) &&
                    styles.confirmBtnDisabled,
                ]}
                onPress={
                  createList
                }
                disabled={
                  !newListName.trim() ||
                  creating
                }
              >
                {creating ? (
                  <LoadingState inline />
                ) : (
                  <Text
                    style={
                      styles.confirmText
                    }
                  >
                    CRÉER
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL SUPPRESSION */}
      <Modal
        visible={
          deleteModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={
          closeDeleteModal
        }
      >
        <View
          style={
            styles.deleteModalOverlay
          }
        >
          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={
              closeDeleteModal
            }
          />

          <View
            style={
              styles.deleteModalBox
            }
          >
            <Text
              style={
                styles.deleteModalTitle
              }
            >
              SUPPRIMER LA LISTE ?
            </Text>

            <Text
              style={
                styles.deleteModalDescription
              }
            >
              La liste «{' '}
              {listToDelete?.name}{' '}
              » sera définitivement
              supprimée.
            </Text>

            <View
              style={
                styles.deleteModalActions
              }
            >
              <TouchableOpacity
                activeOpacity={
                  0.8
                }
                disabled={
                  deleting
                }
                style={
                  styles.deleteCancelButton
                }
                onPress={
                  closeDeleteModal
                }
              >
                <Text
                  style={
                    styles.deleteCancelButtonText
                  }
                >
                  ANNULER
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={
                  0.8
                }
                disabled={
                  deleting
                }
                style={
                  styles.deleteConfirmButton
                }
                onPress={
                  deleteList
                }
              >
                {deleting ? (
                  <LoadingState inline />
                ) : (
                  <Text
                    style={
                      styles.deleteConfirmButtonText
                    }
                  >
                    SUPPRIMER
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  // ── LAYOUT ───────────────────────────

  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  topSafeArea: {
    backgroundColor: COLORS.primary,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  contentContainer: {
    paddingBottom: 24,
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  // ── HEADER ───────────────────────────

  topBar: {
    minHeight: 64,

    paddingHorizontal: 16,
    paddingVertical: 8,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderBottomWidth: 3,
    borderBottomColor: COLORS.contours,
  },

  title: {
    color: COLORS.text2,

    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.1,

    textAlign: 'center',
  },

  // ── SECTIONS ─────────────────────────

  section: {
    marginBottom: 10,
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

    backgroundColor: COLORS.contours,
  },

  sectionTitle: {
    marginHorizontal: 10,

    color: COLORS.text2,

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

  // ── ADD BUTTON ───────────────────────

  addBtn: {
    width: 42,
    height: 42,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 12,

    shadowColor: COLORS.contours,
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

    color: COLORS.icon,

    fontSize: 24,
    fontWeight: '900',
  },

  // ── LISTS ────────────────────────────

  listContainer: {
    gap: 12,
  },

  listRowWrapper: {
    position: 'relative',
  },

  listRow: {
    minHeight: 66,

    paddingHorizontal: 16,
    paddingVertical: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    gap: 14,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  systemListRow: {
    backgroundColor: COLORS.primary,
  },

  listName: {
    flex: 1,
    minWidth: 0,

    color: COLORS.text2,

    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },

  countRow: {
    flexShrink: 0,

    flexDirection: 'row',
    alignItems: 'baseline',

    gap: 5,
  },

  countNumber: {
    color: COLORS.text2,

    fontSize: 20,
    fontWeight: '900',
  },

  countLabel: {
    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // ── EMPTY STATE ──────────────────────

  emptyBox: {
    paddingHorizontal: 20,
    paddingVertical: 26,

    alignItems: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  emptyText: {
    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,

    textAlign: 'center',
  },

  emptyHint: {
    marginTop: 8,

    color: COLORS.text2,

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
    borderColor: COLORS.contours,
    borderRadius: 10,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 4,
  },

  emptyCreateText: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // ── CREATE MODAL ─────────────────────

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

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 16,
  },

  modalTitleContainer: {
    marginBottom: 20,

    flexDirection: 'row',
    alignItems: 'center',
  },

  modalTitleLine: {
    flex: 1,
    height: 3,

    backgroundColor: COLORS.contours,
  },

  modalTitle: {
    marginHorizontal: 10,

    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,

    textAlign: 'center',
  },

  // ── CREATE INPUT ─────────────────────

  inputLabel: {
    marginBottom: 6,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  input: {
    minHeight: 50,

    paddingHorizontal: 12,

    color: COLORS.text2,
    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 12,

    fontSize: 14,
    fontWeight: '600',
  },

  modalActions: {
    marginTop: 20,

    flexDirection: 'row',

    gap: 12,
  },

  // ── MODAL BUTTONS ────────────────────

  cancelBtn: {
    flex: 1,
    minHeight: 48,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 12,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 4,
  },

  cancelText: {
    color: COLORS.text2,

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
    borderColor: COLORS.contours,
    borderRadius: 12,

    shadowColor: COLORS.contours,
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
    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // ── DELETE LIST BUTTON ───────────────

  deleteListButton: {
    position: 'absolute',

    top: -9,
    right: -7,

    width: 27,
    height: 27,

    zIndex: 10,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.important,

    borderWidth: 2.5,
    borderColor: COLORS.contours,
    borderRadius: 9,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 8,
  },

  deleteListButtonText: {
    marginTop: -3,

    color: COLORS.icon,

    fontSize: 21,
    fontWeight: '900',
    lineHeight: 23,
  },

  // ── DELETE MODAL ─────────────────────

  deleteModalOverlay: {
    flex: 1,

    paddingHorizontal: 24,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  deleteModalBox: {
    width: '100%',

    padding: 18,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 16,
  },

  deleteModalTitle: {
    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,

    textAlign: 'center',
  },

  deleteModalDescription: {
    marginTop: 12,

    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,

    textAlign: 'center',
  },

  deleteModalActions: {
    marginTop: 20,

    flexDirection: 'row',

    gap: 12,
  },

  deleteCancelButton: {
    flex: 1,
    minHeight: 46,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 11,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 4,
  },

  deleteCancelButtonText: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  deleteConfirmButton: {
    flex: 1,
    minHeight: 46,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.important,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 11,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 4,
  },

  deleteConfirmButtonText: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
})