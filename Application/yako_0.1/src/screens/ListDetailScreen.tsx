import { useCallback, useState } from 'react'
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { MaterialIcons } from '@expo/vector-icons'

import { supabase } from '../lib/supabase'
import { Movie } from '../types/movie'

import MovieCard from '../components/MovieCard'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import { COLORS } from '../theme/colors'

type ListInformation = {
  id: number
  name: string
  type: 'system' | 'custom'
  is_public: boolean
}

type ListMovieRow = {
  movie: Movie | Movie[] | null
}

export default function ListDetailScreen({
  route,
  navigation,
}: any) {
  const {
    listId,
    listName,
  }: {
    listId: number
    listName: string
  } = route.params

  const [list, setList] =
    useState<ListInformation | null>(null)

  const [movies, setMovies] =
    useState<Movie[]>([])

  const [loading, setLoading] =
    useState(true)

  const [removingMovieId, setRemovingMovieId] =
    useState<number | null>(null)

  const [
    movieToRemove,
    setMovieToRemove,
  ] = useState<Movie | null>(null)

  const [
    removeModalVisible,
    setRemoveModalVisible,
  ] = useState(false)

  useFocusEffect(
    useCallback(() => {
      fetchListDetail()
    }, [listId])
  )

  /*
    ----------------------------------
    CHARGEMENT
    ----------------------------------
  */

  const fetchListDetail = async () => {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const [
      listResult,
      moviesResult,
    ] = await Promise.all([
      supabase
        .from('lists')
        .select(
          'id, name, type, is_public'
        )
        .eq('id', listId)
        .eq('user_id', user.id)
        .single(),

      supabase
        .from('list_movies')
        .select(`
          movie:movies (
            id,
            title,
            original_title,
            release_date,
            runtime,
            original_language,
            is_adult,
            overview,
            poster_path,
            backdrop_path,
            popularity,
            vote_average,
            vote_count,
            tmdb_id
          )
        `)
        .eq('list_id', listId)
        .order('added_at', {
          ascending: false,
        }),
    ])

    if (listResult.error) {
      console.error(
        'Erreur récupération liste :',
        listResult.error
      )

      setList(null)
      setMovies([])
      setLoading(false)
      return
    }

    if (moviesResult.error) {
      console.error(
        'Erreur récupération films :',
        moviesResult.error
      )

      setList(listResult.data)
      setMovies([])
      setLoading(false)
      return
    }

    const normalizedMovies = (
      moviesResult.data ?? []
    )
      .map((row: ListMovieRow) => {
        if (Array.isArray(row.movie)) {
          return row.movie[0] ?? null
        }

        return row.movie
      })
      .filter(
        (movie): movie is Movie =>
          movie !== null
      )

    setList(listResult.data)
    setMovies(normalizedMovies)
    setLoading(false)
  }

  /*
    ----------------------------------
    MODAL RETRAIT
    ----------------------------------
  */

  const openRemoveModal = (
    movie: Movie
  ) => {
    if (removingMovieId !== null) {
      return
    }

    setMovieToRemove(movie)
    setRemoveModalVisible(true)
  }

  const closeRemoveModal = () => {
    if (removingMovieId !== null) {
      return
    }

    setRemoveModalVisible(false)
    setMovieToRemove(null)
  }

  /*
    ----------------------------------
    RETRAIT DU FILM
    ----------------------------------
  */

  const removeMovieFromList = async () => {
    if (
      !movieToRemove ||
      removingMovieId !== null
    ) {
      return
    }

    const movieId = movieToRemove.id

    setRemovingMovieId(movieId)

    const { error } = await supabase
      .from('list_movies')
      .delete()
      .eq('list_id', listId)
      .eq('movie_id', movieId)

    setRemovingMovieId(null)

    if (error) {
      console.error(
        'Erreur suppression film :',
        error
      )

      alert(
        "Impossible de retirer ce film de la liste."
      )

      return
    }

    setMovies((currentMovies) =>
      currentMovies.filter(
        (movie) =>
          movie.id !== movieId
      )
    )

    setRemoveModalVisible(false)
    setMovieToRemove(null)
  }

  /*
    ----------------------------------
    FILM
    ----------------------------------
  */

  const renderMovie = ({
    item,
  }: {
    item: Movie
  }) => {
    const isRemoving =
      removingMovieId === item.id

    return (
      <View style={styles.movieGridItem}>
        <MovieCard
          movie={item}
          onPress={() =>
            navigation.navigate('Movie', {
              movieId: item.id,
            })
          }
        />

        <Pressable
          disabled={isRemoving}
          onPress={() =>
            openRemoveModal(item)
          }
          style={({ pressed }) => [
            styles.removeButton,

            pressed &&
              styles.removeButtonPressed,

            isRemoving &&
              styles.removeButtonDisabled,
          ]}
        >
          {isRemoving ? (
            <LoadingState inline />
          ) : (
            <MaterialIcons
              name="close"
              size={17}
              color={COLORS.icon}
            />
          )}
        </Pressable>
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
        style={styles.root}
        edges={['top', 'bottom']}
      >
        <LoadingState fullScreen />
      </SafeAreaView>
    )
  }

  /*
    ----------------------------------
    LISTE INTROUVABLE
    ----------------------------------
  */

  if (!list) {
    return (
      <SafeAreaView
        style={styles.root}
        edges={['top', 'bottom']}
      >
        <View
          style={
            styles.notFoundContainer
          }
        >
          <Text
            style={
              styles.notFoundTitle
            }
          >
            LISTE INTROUVABLE
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={
              styles.notFoundButton
            }
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.notFoundButtonText
              }
            >
              RETOUR
            </Text>
          </TouchableOpacity>
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
      <View style={styles.screen}>
        {/* HEADER FIXE */}
        <View
          style={[
            styles.header,
            list.type === 'system' &&
              styles.systemHeader,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backButton}
            onPress={() =>
              navigation.goBack()
            }
          >
            <MaterialIcons
              name="arrow-back"
              size={23}
              color={COLORS.return}
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text
              style={styles.title}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {list.name || listName}
            </Text>

            <Text style={styles.movieCount}>
              {movies.length}{' '}
              {movies.length === 1
                ? 'FILM'
                : 'FILMS'}
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* FILMS */}
        <FlatList
          data={movies}
          numColumns={3}
          renderItem={renderMovie}
          keyExtractor={(item) =>
            String(item.id)
          }
          columnWrapperStyle={
            movies.length > 0
              ? styles.gridRow
              : undefined
          }
          contentContainerStyle={[
            styles.listContent,
            movies.length === 0 &&
              styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="🎬"
              title="LISTE VIDE"
              description="Ajoute des films depuis leur fiche avec le bouton +."
            />
          }
        />
      </View>

      {/* MODAL CONFIRMATION RETRAIT */}
      <Modal
        visible={removeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeRemoveModal}
      >
        <View style={styles.removeModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeRemoveModal}
          />

          <View style={styles.removeModalBox}>
            <Text style={styles.removeModalTitle}>
              RETIRER LE FILM ?
            </Text>

            <Text
              style={styles.removeModalDescription}
            >
              « {movieToRemove?.title} » sera
              retiré de la liste « {list.name} ».
            </Text>

            <View
              style={styles.removeModalActions}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={
                  removingMovieId !== null
                }
                style={
                  styles.removeCancelButton
                }
                onPress={closeRemoveModal}
              >
                <Text
                  style={
                    styles.removeCancelButtonText
                  }
                >
                  ANNULER
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                disabled={
                  removingMovieId !== null
                }
                style={
                  styles.removeConfirmButton
                }
                onPress={
                  removeMovieFromList
                }
              >
                {removingMovieId !== null ? (
                  <LoadingState inline />
                ) : (
                  <Text
                    style={
                      styles.removeConfirmButtonText
                    }
                  >
                    RETIRER
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // ── LAYOUT ───────────────────────────

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // ── HEADER ───────────────────────────

  header: {
    minHeight: 76,

    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 18,

    paddingHorizontal: 10,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  systemHeader: {
    backgroundColor: COLORS.primary,
  },

  backButton: {
    width: 42,
    height: 42,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 11,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 3,
  },

  headerText: {
    flex: 1,
    minWidth: 0,

    marginHorizontal: 10,

    alignItems: 'center',
  },

  title: {
    width: '100%',

    color: COLORS.text2,

    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,

    textAlign: 'center',
  },

  movieCount: {
    marginTop: 4,

    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  headerSpacer: {
    width: 42,
  },

  // ── MOVIE GRID ───────────────────────

  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 32,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  gridRow: {
    justifyContent: 'flex-start',
  },

  movieGridItem: {
    width: '33.333%',

    position: 'relative',

    paddingTop: 8,

    overflow: 'visible',
  },

  // ── REMOVE BUTTON ────────────────────

  removeButton: {
    position: 'absolute',

    top: 0,
    right: 1,

    width: 28,
    height: 28,

    zIndex: 20,

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

    elevation: 10,
  },

  removeButtonPressed: {
    transform: [
      {
        translateX: 1,
      },
      {
        translateY: 1,
      },
    ],

    shadowOffset: {
      width: 1,
      height: 1,
    },

    elevation: 3,
  },

  removeButtonDisabled: {
    opacity: 0.55,
  },

  // ── REMOVE MODAL ─────────────────────

  removeModalOverlay: {
    flex: 1,

    paddingHorizontal: 24,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(0, 0, 0, 0.55)',
  },

  removeModalBox: {
    width: '100%',

    padding: 18,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 16,
  },

  removeModalTitle: {
    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,

    textAlign: 'center',
  },

  removeModalDescription: {
    marginTop: 12,

    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,

    textAlign: 'center',
  },

  removeModalActions: {
    marginTop: 20,

    flexDirection: 'row',

    gap: 12,
  },

  removeCancelButton: {
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

  removeCancelButtonText: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  removeConfirmButton: {
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

  removeConfirmButtonText: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  // ── LIST NOT FOUND ───────────────────

  notFoundContainer: {
    flex: 1,

    margin: 20,
    padding: 24,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  notFoundTitle: {
    color: COLORS.text2,

    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,

    textAlign: 'center',
  },

  notFoundButton: {
    minHeight: 46,

    marginTop: 20,
    paddingHorizontal: 22,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

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

  notFoundButtonText: {
    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
})