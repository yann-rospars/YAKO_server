import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  Pressable,
  FlatList,
  Keyboard,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { supabase } from '../lib/supabase'
import { Movie } from '../types/movie'
import { MovieSession } from '../types/session'

import SessionCard from '../components/SessionCard'
import SessionCalendar from '../components/SessionCalendar'
import Badge from '../components/ui/Badge'
import LoadingState from '../components/LoadingState'
import { COLORS } from '../theme/colors'

const getDateKey = (date: string) =>
  date.split('T')[0] || date.split(' ')[0]

type MovieListItem = {
  id: number
  name: string
  type: 'system' | 'custom'
  containsMovie: boolean
}

export default function MovieScreen({
  route,
  navigation,
}: any) {
  const { movieId } = route.params

  const [movie, setMovie] =
    useState<Movie | null>(null)

  const [director, setDirector] =
    useState<string | null>(null)

  const [trailerUrl, setTrailerUrl] =
    useState<string | null>(null)

  const [sessions, setSessions] =
    useState<MovieSession[]>([])

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null)

  const [loading, setLoading] = useState(true)

  const [sessionsLoading, setSessionsLoading] =
    useState(true)

  const [showFullSynopsis, setShowFullSynopsis] = useState(false)

  const [listModalVisible, setListModalVisible] =
    useState(false)

  const [movieLists, setMovieLists] =
    useState<MovieListItem[]>([])

  const [listSearch, setListSearch] =
    useState('')

  const [listsLoading, setListsLoading] =
    useState(false)

  const [addingToListId, setAddingToListId] =
    useState<number | null>(null)

  useEffect(() => {
    fetchMovie()
    fetchSessions()
  }, [])

  const fetchMovie = async () => {
    const { data, error } = await supabase
      .from('movies')
      .select(`
        id,
        title,
        original_title,
        overview,
        poster_path,
        backdrop_path,
        popularity,
        vote_average,
        vote_count,
        runtime,
        release_date,
        original_language,
        is_adult,
        movie_people (
          role_type,
          person:peoples (
            name
          )
        ),
        movie_trailers (
          youtube_key,
          is_main
        )
      `)
      .eq('id', movieId)
      .single()

    if (error) {
      console.log(error)
      setLoading(false)
      return
    }

    setMovie(data)

    const directors =
      data.movie_people
        ?.filter(
          (person: any) =>
            person.role_type === 'director'
        )
        .map(
          (person: any) =>
            person.person?.name
        )
        .filter(Boolean) || []

    setDirector(directors.join(', '))

    const trailers =
      data.movie_trailers || []

    const pickedTrailer =
      trailers.find(
        (trailer: any) =>
          trailer.is_main
      ) ?? trailers[0]

    if (pickedTrailer) {
      setTrailerUrl(
        `https://www.youtube.com/watch?v=${pickedTrailer.youtube_key}`
      )
    }

    setLoading(false)
  }

  const fetchSessions = async () => {
    setSessionsLoading(true)

    const now = new Date()
    const in30Days = new Date()

    in30Days.setDate(
      now.getDate() + 30
    )

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        starts_at,
        projection,
        version,
        booking_url,
        cinema:cinemas (
          id,
          name,
          address,
          city,
          postal_code
        )
      `)
      .eq('movie_id', movieId)
      .gte(
        'starts_at',
        now.toISOString()
      )
      .lte(
        'starts_at',
        in30Days.toISOString()
      )
      .order('starts_at', {
        ascending: true,
      })

    if (error) {
      console.log(error)
      setSessionsLoading(false)
      return
    }

    const normalized: MovieSession[] =
      data?.map((session: any) => ({
        ...session,
        cinema: Array.isArray(
          session.cinema
        )
          ? session.cinema[0]
          : session.cinema,
      })) || []

    setSessions(normalized)

    setSelectedDate(
      normalized.length > 0
        ? getDateKey(
            normalized[0].starts_at
          )
        : getDateKey(
            now.toISOString()
          )
    )

    setSessionsLoading(false)
  }

  const fetchMovieLists = async () => {
    setListsLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setListsLoading(false)
      return
    }

    const {
      data: listsData,
      error: listsError,
    } = await supabase
      .from('lists')
      .select('id, name, type')
      .eq('user_id', user.id)
      .neq('name', 'Déjà notées')

    if (listsError) {
      console.error(listsError)
      setListsLoading(false)
      return
    }

    const listIds = (listsData ?? []).map(
      (list: any) => list.id
    )

    let existingListIds =
      new Set<number>()

    if (listIds.length > 0) {
      const {
        data: existingRows,
        error: existingError,
      } = await supabase
        .from('list_movies')
        .select('list_id')
        .eq('movie_id', movieId)
        .in('list_id', listIds)

      if (existingError) {
        console.error(existingError)
      } else {
        existingListIds = new Set(
          (existingRows ?? []).map(
            (row: any) => row.list_id
          )
        )
      }
    }

    const formatted: MovieListItem[] =
      (listsData ?? []).map((list) => ({
        id: list.id,
        name: list.name,
        type: list.type,
        containsMovie: existingListIds.has(
          list.id
        ),
      }))

    formatted.sort((a, b) => {
      // Les listes système d'abord
      if (a.type !== b.type) {
        return a.type === 'system'
          ? -1
          : 1
      }

      // Puis ordre alphabétique
      return a.name.localeCompare(b.name)
    })

    setMovieLists(formatted)
    setListsLoading(false)
  }

  const openListModal = () => {
    setListSearch('')
    setListModalVisible(true)
    fetchMovieLists()
  }

  const closeListModal = () => {
    setListModalVisible(false)
    setListSearch('')
  }

  const addMovieToList = async (
    listId: number
  ) => {
    const selectedList = movieLists.find(
      (list) => list.id === listId
    )

    if (
      !selectedList ||
      selectedList.containsMovie
    ) {
      return
    }

    setAddingToListId(listId)

    const { error } = await supabase
      .from('list_movies')
      .insert({
        list_id: listId,
        movie_id: movieId,
      })

    setAddingToListId(null)

    if (error) {
      if (error.code === '23505') {
        setMovieLists((currentLists) =>
          currentLists.map((list) =>
            list.id === listId
              ? {
                  ...list,
                  containsMovie: true,
                }
              : list
          )
        )

        return
      }

      console.error(error)
      alert(
        "Impossible d'ajouter le film à cette liste."
      )
      return
    }

    setMovieLists((currentLists) =>
      currentLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              containsMovie: true,
            }
          : list
      )
    )
  }

  const removeMovieFromList = async (
    listId: number
  ) => {
    setAddingToListId(listId)

    const { error } = await supabase
      .from('list_movies')
      .delete()
      .eq('list_id', listId)
      .eq('movie_id', movieId)

    setAddingToListId(null)

    if (error) {
      console.error(error)
      alert(
        "Impossible de retirer le film de cette liste."
      )
      return
    }

    setMovieLists((currentLists) =>
      currentLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              containsMovie: false,
            }
          : list
      )
    )
  }

  const getPoster = () => {
    if (!movie?.poster_path) {
      return null
    }

    if (
      movie.poster_path.startsWith(
        'http://'
      ) ||
      movie.poster_path.startsWith(
        'https://'
      )
    ) {
      return movie.poster_path
    }

    if (
      movie.poster_path.startsWith(
        '/img'
      )
    ) {
      return `https://fr.web.img6.acsta.net${movie.poster_path}`
    }

    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`
  }

  const getBackdrop = () => {
    if (!movie?.backdrop_path) {
      return null
    }

    if (
      movie.backdrop_path.startsWith(
        'http://'
      ) ||
      movie.backdrop_path.startsWith(
        'https://'
      )
    ) {
      return movie.backdrop_path
    }

    return `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
  }

  const sessionDays = useMemo(() => {
    const seen = new Set<string>()

    return sessions
      .map((session) => {
        const key = getDateKey(
          session.starts_at
        )

        if (seen.has(key)) {
          return null
        }

        seen.add(key)

        const date = new Date(
          session.starts_at
        )

        const label =
          date.toLocaleDateString(
            'fr-FR',
            {
              weekday: 'short',
              day: '2-digit',
              month: 'short',
            }
          )

        return {
          key,
          label,
        }
      })
      .filter(Boolean) as {
        key: string
        label: string
      }[]
  }, [sessions])

  const sessionsForSelectedDate =
    sessions.filter(
      (session) =>
        getDateKey(
          session.starts_at
        ) === selectedDate
    )

  const filteredMovieLists =
    movieLists.filter((list) =>
      list.name
        .toLowerCase()
        .includes(
          listSearch.trim().toLowerCase()
        )
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
        style={styles.sectionTitleLine}
      />

      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <View
        style={styles.sectionTitleLine}
      />
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView
        style={styles.root}
        edges={['top']}
      >
        <LoadingState fullScreen />
      </SafeAreaView>
    )
  }

  if (!movie) {
    return (
      <SafeAreaView
        style={styles.root}
        edges={['top']}
      >
        <View
          style={
            styles.notFoundContainer
          }
        >
          <Text
            style={styles.notFoundText}
          >
            FILM INTROUVABLE
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.notFoundButton}
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

  const poster = getPoster()
  const backdrop = getBackdrop()

  return (
    <SafeAreaView
      style={styles.root}
      edges={['top']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.primary}
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* HERO */}
        <View style={styles.hero}>
          {backdrop ? (
            <Image
              source={{ uri: backdrop }}
              style={styles.backdrop}
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.backdropPlaceholder
              }
            >
              <Text
                style={
                  styles.backdropPlaceholderIcon
                }
              >
                🎬
              </Text>
            </View>
          )}

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.backBtn}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={styles.backBtnText}
            >
              ←
            </Text>
          </TouchableOpacity>
        </View>

        {/* INFORMATIONS PRINCIPALES */}
        <View style={styles.movieHeader}>
          <View
            style={
              styles.posterContainer
            }
          >
            {poster ? (
              <Image
                source={{ uri: poster }}
                style={styles.poster}
                resizeMode="cover"
              />
            ) : (
              <View
                style={
                  styles.posterPlaceholder
                }
              >
                <Text
                  style={
                    styles.posterPlaceholderIcon
                  }
                >
                  🎬
                </Text>

                <Text
                  style={
                    styles.posterPlaceholderText
                  }
                >
                  AFFICHE{'\n'}INDISPONIBLE
                </Text>
              </View>
            )}
          </View>

          <View
            style={
              styles.movieInformation
            }
          >
            <Text
              style={styles.title}
              numberOfLines={3}
            >
              {movie.title}
            </Text>

            {movie.original_title &&
              movie.original_title !==
                movie.title && (
                <Text
                  style={styles.subtitle}
                  numberOfLines={2}
                >
                  {movie.original_title}
                </Text>
              )}

            {!!director && (
              <Text
                style={styles.director}
                numberOfLines={2}
              >
                {director}
              </Text>
            )}

            <View style={styles.badges}>
              {!!movie.runtime && (
                <Badge
                  label={`${movie.runtime} MIN`}
                />
              )}

              {!!movie.release_date && (
                <Badge
                  label={movie.release_date.slice(
                    0,
                    4
                  )}
                />
              )}

              {!!movie.original_language && (
                <Badge
                  label={movie.original_language.toUpperCase()}
                />
              )}
            </View>

            <View
              style={
                styles.actionsRow
              }
            >
              <View
                style={styles.ratingBox}
              >
                <Text
                  style={
                    styles.ratingValue
                  }
                >
                  {movie.vote_average
                    ? movie.vote_average.toFixed(
                        1
                      )
                    : '—'}
                </Text>

                <Text
                  style={
                    styles.ratingText
                  }
                >
                  /10
                </Text>

                {!!movie.vote_count && (
                  <Text
                    style={
                      styles.ratingCount
                    }
                  >
                    {movie.vote_count} votes
                  </Text>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.addBtn}
                onPress={openListModal}
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
          </View>
        </View>

        <View style={styles.body}>
          {/* BANDE-ANNONCE */}
          {trailerUrl && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                Linking.openURL(
                  trailerUrl
                )
              }
              style={
                styles.trailerBtn
              }
            >
              <Text
                style={
                  styles.trailerBtnIcon
                }
              >
                ▶
              </Text>

              <Text
                style={
                  styles.trailerBtnText
                }
              >
                BANDE-ANNONCE
              </Text>
            </TouchableOpacity>
          )}

          {/* SYNOPSIS */}
          <View style={styles.section}>
            <View style={styles.synopsisCard}>
              <Text style={styles.synopsisTitle}>
                SYNOPSIS
              </Text>

              <Text
                style={styles.synopsisText}
                numberOfLines={
                  showFullSynopsis ? undefined : 5
                }
              >
                {movie.overview ||
                  'Aucune description disponible.'}
              </Text>

              {movie.overview &&
                movie.overview.length > 250 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() =>
                      setShowFullSynopsis(
                        !showFullSynopsis
                      )
                    }
                  >
                    <Text style={styles.moreText}>
                      {showFullSynopsis
                        ? 'AFFICHER MOINS ▲'
                        : 'AFFICHER PLUS ▼'}
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>

          {/* SÉANCES */}
          <View style={styles.section}>
            {renderSectionTitle(
              'SÉANCES'
            )}

            {sessionsLoading ? (
              <LoadingState />
            ) : sessions.length === 0 ? (
              <View
                style={
                  styles.noSessionsCard
                }
              >
                <Text
                  style={
                    styles.noSessionsText
                  }
                >
                  AUCUNE SÉANCE DISPONIBLE
                </Text>
              </View>
            ) : (
              <>
                <SessionCalendar
                  days={sessionDays}
                  selectedDate={
                    selectedDate
                  }
                  setSelectedDate={
                    setSelectedDate
                  }
                />

                <View
                  style={
                    styles.sessionsList
                  }
                >
                  {sessionsForSelectedDate.length ===
                  0 ? (
                    <View
                      style={
                        styles.noSessionsCard
                      }
                    >
                      <Text
                        style={
                          styles.noSessionsText
                        }
                      >
                        AUCUNE SÉANCE POUR
                        CETTE DATE
                      </Text>
                    </View>
                  ) : (
                    sessionsForSelectedDate.map(
                      (session) => (
                        <SessionCard
                          key={session.id}
                          session={session}
                        />
                      )
                    )
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={listModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeListModal}
      >
        <View style={styles.listModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeListModal}
          />

          <View style={styles.listModalBox}>
            <View style={styles.listModalHeader}>
              <Text style={styles.listModalTitle}>
                AJOUTER À UNE LISTE
              </Text>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={closeListModal}
                style={styles.listModalClose}
              >
                <Text
                  style={
                    styles.listModalCloseText
                  }
                >
                  ×
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={
                styles.listSearchContainer
              }
            >
              <Text
                style={styles.listSearchIcon}
              >
                ⌕
              </Text>

              <TextInput
                value={listSearch}
                onChangeText={setListSearch}
                placeholder="Rechercher une liste..."
                placeholderTextColor={
                  COLORS.ghostText
                }
                autoCorrect={false}
                allowFontScaling={false}
                style={styles.listSearchInput}
              />

              {listSearch.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    setListSearch('')
                  }
                  style={
                    styles.listSearchClear
                  }
                >
                  <Text
                    style={
                      styles.listSearchClearText
                    }
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {listsLoading ? (
              <LoadingState />
            ) : filteredMovieLists.length ===
              0 ? (
              <Pressable
                style={styles.listModalEmpty}
                onPress={() => Keyboard.dismiss()}
              >
                <Text style={styles.listModalEmptyText}>
                  {listSearch.trim()
                    ? 'AUCUNE LISTE TROUVÉE'
                    : 'AUCUNE LISTE DISPONIBLE'}
                </Text>
              </Pressable>
            ) : (
              <FlatList
                data={filteredMovieLists}
                keyExtractor={(item) =>
                  String(item.id)
                }
                style={styles.listsFlatList}
                contentContainerStyle={
                  styles.listsFlatListContent
                }
                showsVerticalScrollIndicator={
                  false
                }
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isAdding =
                    addingToListId === item.id

                  return (
                    <View
                      style={
                        styles.movieListRow
                      }
                    >
                      <View
                        style={
                          styles.movieListInformation
                        }
                      >
                        <Text
                          style={
                            styles.movieListName
                          }
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {item.name}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        disabled={isAdding}
                        onPress={() =>
                          item.containsMovie
                            ? removeMovieFromList(item.id)
                            : addMovieToList(item.id)
                        }
                        style={[
                          styles.addToListButton,
                          item.containsMovie &&
                            styles.removeFromListButton,
                        ]}
                      >
                        {isAdding ? (
                          <LoadingState inline />
                        ) : (
                          <Text
                            style={[
                              styles.addToListButtonText,
                              item.containsMovie &&
                                styles.addedToListButtonText,
                            ]}
                          >
                            {item.containsMovie
                              ? 'RETIRER'
                              : 'AJOUTER'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  )
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },

  // ── HERO ─────────────────────────────

  hero: {
    height: 220,
    overflow: 'hidden',

    backgroundColor: COLORS.primary,

    borderBottomWidth: 3,
    borderBottomColor: COLORS.contours,
  },

  backdrop: {
    width: '100%',
    height: '100%',
  },

  backdropPlaceholder: {
    width: '100%',
    height: '100%',

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,
  },

  backdropPlaceholderIcon: {
    fontSize: 52,
  },

  // ── BACK BUTTON ──────────────────────

  backBtn: {
    position: 'absolute',
    top: 16,
    left: 16,

    width: 44,
    height: 44,

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

    elevation: 5,
  },

  backBtnText: {
    marginTop: -2,

    color: COLORS.return,

    fontSize: 24,
    fontWeight: '900',
  },

  // ── MOVIE HEADER ─────────────────────

  movieHeader: {
    marginHorizontal: 16,
    marginTop: -40,

    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  posterContainer: {
    width: 120,
    aspectRatio: 2 / 3,

    overflow: 'hidden',
    flexShrink: 0,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 11,
  },

  poster: {
    width: '100%',
    height: '100%',
  },

  posterPlaceholder: {
    flex: 1,

    paddingHorizontal: 5,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,
  },

  posterPlaceholderIcon: {
    marginBottom: 8,
    fontSize: 28,
  },

  posterPlaceholderText: {
    color: COLORS.text2,

    fontSize: 8,
    fontWeight: '900',
    lineHeight: 11,
    letterSpacing: 0.5,

    textAlign: 'center',
  },

  movieInformation: {
    flex: 1,
    minWidth: 0,

    paddingLeft: 14,
    paddingTop: 50,
  },

  title: {
    color: COLORS.text2,

    fontSize: 18,
    fontWeight: '900',
    lineHeight: 21,
  },

  subtitle: {
    marginTop: 4,

    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },

  director: {
    marginTop: 4,

    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '900',
    lineHeight: 12,
    letterSpacing: 0.5,
  },

  badges: {
    marginTop: 8,

    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 5,
  },

  // ── RATING / ADD ─────────────────────

  actionsRow: {
    marginTop: 2,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  ratingBox: {
    flex: 1,
    minWidth: 0,

    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },

  ratingValue: {
    color: COLORS.text2,

    fontSize: 22,
    fontWeight: '900',
  },

  ratingText: {
    marginLeft: 3,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
  },

  ratingCount: {
    marginLeft: 6,

    color: COLORS.text2,

    fontSize: 8,
    fontWeight: '700',
  },

  addBtn: {
    width: 38,
    height: 38,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

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

  addBtnText: {
    marginTop: -3,

    color: COLORS.icon,

    fontSize: 25,
    fontWeight: '900',
  },

  // ── BODY ─────────────────────────────

  body: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },

  // ── TRAILER BUTTON ───────────────────

  trailerBtn: {
    minHeight: 52,

    marginBottom: 24,
    paddingHorizontal: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 10,

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

  trailerBtnIcon: {
    color: COLORS.icon,

    fontSize: 14,
    fontWeight: '900',
  },

  trailerBtnText: {
    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // ── SECTIONS ─────────────────────────

  section: {
    marginBottom: 28,
  },

  sectionTitleContainer: {
    marginBottom: 14,

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

  // ── SYNOPSIS ─────────────────────────

  synopsisCard: {
    padding: 15,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  synopsisTitle: {
    marginBottom: 10,

    color: COLORS.text2,

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  synopsisText: {
    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },

  moreText: {
    marginTop: 12,

    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '900',

    textAlign: 'center',
  },

  // ── SESSIONS ─────────────────────────

  sessionsList: {
    marginTop: 16,
  },

  noSessionsCard: {
    minHeight: 90,

    padding: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  noSessionsText: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,

    textAlign: 'center',
  },

  // ── NOT FOUND ────────────────────────

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

  notFoundText: {
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

  // ── LIST MODAL ───────────────────────

  listModalOverlay: {
    flex: 1,

    paddingHorizontal: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },

  listModalBox: {
    width: '100%',
    maxHeight: '72%',

    padding: 16,

    backgroundColor: COLORS.background,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 16,
  },

  listModalHeader: {
    minHeight: 42,

    marginBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  listModalTitle: {
    flex: 1,

    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  listModalClose: {
    width: 36,
    height: 36,

    marginLeft: 12,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 10,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 3,
  },

  listModalCloseText: {
    marginTop: -3,

    color: COLORS.icon,

    fontSize: 24,
    fontWeight: '900',
  },

  // ── LIST SEARCH ──────────────────────

  listSearchContainer: {
    minHeight: 48,

    marginBottom: 14,
    paddingHorizontal: 10,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 11,
  },

  listSearchIcon: {
    width: 26,

    color: COLORS.icon,

    fontSize: 25,
    fontWeight: '900',

    textAlign: 'center',
  },

  listSearchInput: {
    flex: 1,

    minHeight: 45,

    paddingHorizontal: 8,
    paddingVertical: 0,

    color: COLORS.text2,

    fontSize: 14,
    fontWeight: '600',
  },

  listSearchClear: {
    width: 28,
    height: 28,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 14,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 3,
  },

  listSearchClearText: {
    marginTop: -2,

    color: COLORS.icon,

    fontSize: 20,
    fontWeight: '900',
  },

  // ── LIST CONTENT ─────────────────────

  listsFlatList: {
    flexGrow: 0,
  },

  listsFlatListContent: {
    paddingBottom: 4,
  },

  movieListRow: {
    minHeight: 62,

    marginBottom: 10,
    padding: 10,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 10,

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 12,
  },

  movieListInformation: {
    flex: 1,
    minWidth: 0,
  },

  movieListName: {
    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
  },

  // ── ADD / REMOVE LIST BUTTON ─────────

  addToListButton: {
    width: 82,
    minHeight: 36,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 9,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 3,
  },

  removeFromListButton: {
    backgroundColor: COLORS.important,
  },

  addedToListButton: {
    backgroundColor: COLORS.important,
  },

  addToListButtonText: {
    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  addedToListButtonText: {
    color: COLORS.text2,
  },

  // ── MODAL STATES ─────────────────────

  listModalEmpty: {
    minHeight: 90,

    paddingHorizontal: 12,

    alignItems: 'center',
    justifyContent: 'center',
  },

  listModalEmptyText: {
    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,

    textAlign: 'center',
  },
})