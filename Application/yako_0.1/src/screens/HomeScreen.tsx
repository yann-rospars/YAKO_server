import { useEffect, useState } from 'react'
import {
  FlatList,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'

import {
  SafeAreaView,
} from 'react-native-safe-area-context'

import {
  MaterialIcons,
} from '@expo/vector-icons'

import { supabase } from '../lib/supabase'

import MovieCard from '../components/MovieCard'
import CinemaCard from '../components/CinemaCard'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

import { Movie } from '../types/movie'
import { Cinema } from '../types/cinema'

import {
  getHomeMovies,
} from '../services/movieService'

import {
  getCinemas,
} from '../services/cinemaService'

import {
  useDebouncedValue,
} from '../hooks/useDebouncedValue'

import { COLORS } from '../theme/colors'

const MOVIES_PER_PAGE = 18

type SearchMode =
  | 'movies'
  | 'cinemas'

type Genre = {
  id: number
  genre: string
}

type CinemaListItem =
  | {
      type: 'section'
      arrondissement: number
    }
  | {
      type: 'cinema'
      cinema: Cinema
    }

type Props = {
  navigation: any
}

export default function HomeScreen({
  navigation,
}: Props) {
  const { width } =
    useWindowDimensions()

  const [searchMode, setSearchMode] =
    useState<SearchMode>('movies')

  const [search, setSearch] =
    useState('')

  const [movies, setMovies] =
    useState<Movie[]>([])

  const [cinemas, setCinemas] =
    useState<Cinema[]>([])

  const [loading, setLoading] =
    useState(true)

  const [
    loadingMoreMovies,
    setLoadingMoreMovies,
  ] = useState(false)

  const [
    movieOffset,
    setMovieOffset,
  ] = useState(0)

  const [
    hasMoreMovies,
    setHasMoreMovies,
  ] = useState(true)

  const [minYear, setMinYear] =
    useState('1895')

  const [maxYear, setMaxYear] =
    useState(
      String(
        new Date().getFullYear() + 1
      )
    )

  const [genres, setGenres] =
    useState<Genre[]>([])

  const [
    selectedGenreIds,
    setSelectedGenreIds,
  ] = useState<number[]>([])

  const [
    futureSessionsOnly,
    setFutureSessionsOnly,
  ] = useState(true)

  const [
    genreModalVisible,
    setGenreModalVisible,
  ] = useState(false)

  const debouncedSearch =
    useDebouncedValue(
      search,
      300
    )

  const debouncedMinYear =
    useDebouncedValue(
      minYear,
      300
    )

  const debouncedMaxYear =
    useDebouncedValue(
      maxYear,
      300
    )

  /*
    ----------------------------------
    RESPONSIVE HEADER
    ----------------------------------
  */

  const HEADER_PADDING = 16

  const YEAR_WIDTH = 63

  const GENRE_MIN_WIDTH = 88

  const SESSION_MIN_WIDTH = 98

  const availableWidth =
    width - HEADER_PADDING * 2

  const filterGap = Math.max(
    3,
    Math.min(
      7,
      7 - (393 - width) * 0.08
    )
  )

  const searchGap = Math.max(
    4,
    Math.min(
      8,
      8 - (393 - width) * 0.08
    )
  )

  const flexibleFilterWidth =
    availableWidth -
    YEAR_WIDTH * 2 -
    filterGap * 3

  const inlineGenreWidth =
    Math.max(
      GENRE_MIN_WIDTH,
      flexibleFilterWidth * 0.45
    )

  const inlineSessionWidth =
    flexibleFilterWidth -
    inlineGenreWidth

  const sessionMustWrap =
    inlineSessionWidth <
    SESSION_MIN_WIDTH

  const genreWidth =
    sessionMustWrap
      ? availableWidth -
        YEAR_WIDTH * 2 -
        filterGap * 2
      : inlineGenreWidth

  const sessionWidth =
    sessionMustWrap
      ? availableWidth
      : inlineSessionWidth

  /*
    ----------------------------------
    LOAD DATA
    ----------------------------------
  */

  useEffect(() => {
    if (
      searchMode === 'movies'
    ) {
      fetchMovies()
    } else {
      fetchCinemas()
    }
  }, [
    debouncedSearch,
    searchMode,
    debouncedMinYear,
    debouncedMaxYear,
    selectedGenreIds,
    futureSessionsOnly,
  ])

  useEffect(() => {
    fetchGenres()
  }, [])

  /*
    ----------------------------------
    MOVIES
    ----------------------------------
  */

  const fetchMovies =
    async () => {
      setLoading(true)

      try {
        const data =
          await getHomeMovies({
            search:
              debouncedSearch,

            minYear:
              debouncedMinYear,

            maxYear:
              debouncedMaxYear,

            genreIds:
              selectedGenreIds,

            futureSessionsOnly,

            offset: 0,

            limit:
              MOVIES_PER_PAGE,
          })

        setMovies(data)

        setMovieOffset(
          MOVIES_PER_PAGE
        )

        setHasMoreMovies(
          data.length ===
            MOVIES_PER_PAGE
        )
      } catch (error) {
        console.error(
          'Erreur récupération films :',
          error
        )

        setMovies([])
        setMovieOffset(0)
        setHasMoreMovies(false)
      } finally {
        setLoading(false)
      }
    }

  const loadMoreMovies =
    async () => {
      if (
        loadingMoreMovies ||
        !hasMoreMovies
      ) {
        return
      }

      setLoadingMoreMovies(true)

      try {
        const data =
          await getHomeMovies({
            search:
              debouncedSearch,

            minYear:
              debouncedMinYear,

            maxYear:
              debouncedMaxYear,

            genreIds:
              selectedGenreIds,

            futureSessionsOnly,

            offset:
              movieOffset,

            limit:
              MOVIES_PER_PAGE,
          })

        setMovies(
          (currentMovies) => [
            ...currentMovies,
            ...data,
          ]
        )

        setMovieOffset(
          (currentOffset) =>
            currentOffset +
            MOVIES_PER_PAGE
        )

        setHasMoreMovies(
          data.length ===
            MOVIES_PER_PAGE
        )
      } catch (error) {
        console.error(
          'Erreur chargement films suivants :',
          error
        )
      } finally {
        setLoadingMoreMovies(false)
      }
    }

  /*
    ----------------------------------
    GENRES
    ----------------------------------
  */

  const fetchGenres =
    async () => {
      const {
        data,
        error,
      } = await supabase
        .from('genres')
        .select(
          'id, genre'
        )
        .order(
          'genre',
          {
            ascending: true,
          }
        )

      if (error) {
        console.error(
          'Erreur récupération genres :',
          error
        )

        setGenres([])

        return
      }

      setGenres(
        (data ?? []) as Genre[]
      )
    }

  /*
    ----------------------------------
    CINEMAS
    ----------------------------------
  */

  const fetchCinemas =
    async () => {
      setLoading(true)

      try {
        const data =
          await getCinemas(
            debouncedSearch
          )

        setCinemas(data)
      } catch (error) {
        console.error(
          'Erreur récupération cinémas :',
          error
        )

        setCinemas([])
      } finally {
        setLoading(false)
      }
    }

  const getParisArrondissement = (
    postalCode?: string | null
  ) => {
    if (!postalCode) {
      return null
    }

    const match =
      postalCode.match(
        /^750(\d{2})$/
      )

    if (!match) {
      return null
    }

    const arrondissement =
      Number(match[1])

    if (
      arrondissement < 1 ||
      arrondissement > 20
    ) {
      return null
    }

    return arrondissement
  }

  const getArrondissementLabel = (
    arrondissement: number
  ) => {
    if (
      arrondissement === 1
    ) {
      return '1ER ARRONDISSEMENT'
    }

    return `${arrondissement}E ARRONDISSEMENT`
  }

  const sortedCinemas =
    [...cinemas].sort(
      (a, b) => {
        const arrondissementA =
          getParisArrondissement(
            a.postal_code
          ) ?? 999

        const arrondissementB =
          getParisArrondissement(
            b.postal_code
          ) ?? 999

        if (
          arrondissementA !==
          arrondissementB
        ) {
          return (
            arrondissementA -
            arrondissementB
          )
        }

        return a.name.localeCompare(
          b.name,
          'fr'
        )
      }
    )

  const cinemaListData:
    CinemaListItem[] = []

  let previousArrondissement:
    | number
    | null = null

  for (
    const cinema of sortedCinemas
  ) {
    const arrondissement =
      getParisArrondissement(
        cinema.postal_code
      )

    if (
      arrondissement !== null &&
      arrondissement !==
        previousArrondissement
    ) {
      cinemaListData.push({
        type: 'section',
        arrondissement,
      })

      previousArrondissement =
        arrondissement
    }

    cinemaListData.push({
      type: 'cinema',
      cinema,
    })
  }

  /*
    ----------------------------------
    RENDER MOVIES
    ----------------------------------
  */

  const renderMovie = ({
    item,
  }: {
    item: Movie
  }) => (
    <View
      style={
        styles.movieGridItem
      }
    >
      <MovieCard
        movie={item}
        onPress={() =>
          navigation.navigate(
            'Movie',
            {
              movieId:
                item.id,
            }
          )
        }
      />
    </View>
  )

  /*
    ----------------------------------
    RENDER CINEMAS
    ----------------------------------
  */

  const renderCinemaListItem = ({
    item,
  }: {
    item: CinemaListItem
  }) => {
    if (
      item.type === 'section'
    ) {
      return (
        <View
          style={
            styles.arrondissementHeader
          }
        >
          <View
            style={
              styles.arrondissementLine
            }
          />

          <Text
            style={
              styles.arrondissementTitle
            }
          >
            {getArrondissementLabel(
              item.arrondissement
            )}
          </Text>

          <View
            style={
              styles.arrondissementLine
            }
          />
        </View>
      )
    }

    return (
      <CinemaCard
        cinema={item.cinema}
        onPress={() =>
          navigation.navigate(
            'Cinema',
            {
              cinemaId:
                item.cinema.id,
            }
          )
        }
      />
    )
  }

  /*
    ----------------------------------
    SECTION TITLE
    ----------------------------------
  */

  const renderSectionTitle =
    () => {
      const title =
        searchMode === 'movies'
          ? futureSessionsOnly
            ? 'À VOIR DANS PARIS'
            : 'SELON VOTRE SÉLECTION'
          : 'LES CINÉMAS DE PARIS'

      return (
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
    }

  const emptyTitle =
    searchMode === 'movies'
      ? 'AUCUN FILM TROUVÉ'
      : 'AUCUN CINÉMA TROUVÉ'

  const emptyDescription =
    search.trim()
      ? 'Essaie avec une autre recherche.'
      : searchMode ===
          'movies'
        ? futureSessionsOnly
          ? 'Aucun film correspondant ne possède actuellement de séance future.'
          : 'Aucun film ne correspond aux filtres sélectionnés.'
        : 'Aucun cinéma ne correspond à ta recherche.'

  /*
    ----------------------------------
    HEADER
    ----------------------------------
  */

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.searchRow}>
        <View
          style={
            styles.searchContainer
          }
        >
          <Text
            style={
              styles.searchIcon
            }
          >
            ⌕
          </Text>

          <TextInput
            value={search}
            onChangeText={
              setSearch
            }
            placeholder={
              searchMode ===
              'movies'
                ? 'Rechercher un film...'
                : 'Rechercher un cinéma...'
            }
            placeholderTextColor={
              COLORS.ghostText
            }
            autoCorrect={false}
            returnKeyType="search"
            allowFontScaling={
              false
            }
            style={
              styles.searchInput
            }
          />

          {search.length > 0 && (
            <Pressable
              hitSlop={10}
              style={({
                pressed,
              }) => [
                styles.clearButton,

                pressed &&
                  styles.clearButtonPressed,
              ]}
              onPress={() =>
                setSearch('')
              }
            >
              <Text
                style={
                  styles.clearButtonText
                }
              >
                ×
              </Text>
            </Pressable>
          )}
        </View>

        <Pressable
          style={({
            pressed,
          }) => [
            styles.modeButton,

            pressed &&
              styles.modeButtonPressed,
          ]}
          onPress={() => {
            setSearch('')

            setSearchMode(
              searchMode ===
              'movies'
                ? 'cinemas'
                : 'movies'
            )
          }}
        >
          <Text
            style={
              styles.modeButtonText
            }
          >
            {searchMode ===
            'movies'
              ? 'CINÉMAS'
              : 'FILMS'}
          </Text>
        </Pressable>
      </View>

      {searchMode ===
        'movies' && (
        <View
          style={[
            styles.filtersRow,
            {
              columnGap:
                filterGap,

              rowGap:
                filterGap,
            },
          ]}
        >
          {/* YEAR MIN */}
          <View
            style={
              styles.yearFilter
            }
          >
            <Text
              style={
                styles.yearPrefix
              }
            >
              +
            </Text>

            <TextInput
              value={
                minYear
              }
              onChangeText={(
                value
              ) =>
                setMinYear(
                  value
                    .replace(
                      /\D/g,
                      ''
                    )
                    .slice(
                      0,
                      4
                    )
                )
              }
              placeholder="____"
              placeholderTextColor={
                COLORS.ghostText
              }
              keyboardType="number-pad"
              maxLength={4}
              allowFontScaling={
                false
              }
              style={
                styles.yearInput
              }
            />
          </View>

          {/* YEAR MAX */}
          <View
            style={
              styles.yearFilter
            }
          >
            <Text
              style={
                styles.yearPrefix
              }
            >
              −
            </Text>

            <TextInput
              value={
                maxYear
              }
              onChangeText={(
                value
              ) =>
                setMaxYear(
                  value
                    .replace(
                      /\D/g,
                      ''
                    )
                    .slice(
                      0,
                      4
                    )
                )
              }
              placeholder="____"
              placeholderTextColor={
                COLORS.ghostText
              }
              keyboardType="number-pad"
              maxLength={4}
              allowFontScaling={
                false
              }
              style={
                styles.yearInput
              }
            />
          </View>

          {/* GENRES */}
          <Pressable
            style={({
              pressed,
            }) => [
              styles.genreButton,

              {
                width:
                  genreWidth,
              },

              pressed &&
                styles.filterPressed,
            ]}
            onPress={() =>
              setGenreModalVisible(
                true
              )
            }
          >
            <View
              style={
                styles.genreButtonContent
              }
            >
              <Text
                style={
                  styles.genreButtonText
                }
                numberOfLines={
                  1
                }
              >
                {selectedGenreIds.length ===
                0
                  ? 'TOUS GENRES'
                  : `${selectedGenreIds.length} GENRE${
                      selectedGenreIds.length >
                      1
                        ? 'S'
                        : ''
                    }`}
              </Text>

              <MaterialIcons
                name="keyboard-arrow-down"
                size={16}
                color={
                  COLORS.icon
                }
                style={{
                  marginRight:
                    -3,
                }}
              />
            </View>
          </Pressable>

          {/* SESSION */}
          <Pressable
            style={({
              pressed,
            }) => [
              styles.sessionFilterButton,

              {
                width:
                  sessionWidth,
              },

              futureSessionsOnly &&
                styles.sessionFilterButtonActive,

              pressed &&
                styles.filterPressed,
            ]}
            onPress={() =>
              setFutureSessionsOnly(
                !futureSessionsOnly
              )
            }
          >
            <View
              style={
                styles.sessionFilterContent
              }
            >
              <MaterialIcons
                name={
                  futureSessionsOnly
                    ? 'check-box'
                    : 'check-box-outline-blank'
                }
                size={15}
                color={
                  COLORS.icon
                }
              />

              <Text
                style={
                  styles.sessionFilterText
                }
                numberOfLines={
                  1
                }
              >
                AVEC SÉANCE
              </Text>
            </View>
          </Pressable>
        </View>
      )}
    </View>
  )

  /*
    ----------------------------------
    RETURN
    ----------------------------------
  */

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={
          COLORS.primary
        }
      />

      <View
        style={
          styles.screen
        }
      >
        {renderHeader()}

        {loading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <LoadingState />
          </View>
        ) : searchMode ===
          'movies' ? (
          /*
            --------------------------
            MOVIES LIST
            --------------------------
          */

          <FlatList
            key="movies"
            style={
              styles.list
            }
            data={
              movies
            }
            numColumns={
              3
            }
            renderItem={
              renderMovie
            }
            keyExtractor={(
              item
            ) =>
              `movie-${item.id}`
            }
            ListHeaderComponent={
              renderSectionTitle
            }
            ListFooterComponent={
              hasMoreMovies ? (
                <View
                  style={
                    styles.loadMoreContainer
                  }
                >
                  <Pressable
                    disabled={
                      loadingMoreMovies
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.loadMoreButton,

                      pressed &&
                        styles.loadMoreButtonPressed,

                      loadingMoreMovies &&
                        styles.loadMoreButtonDisabled,
                    ]}
                    onPress={
                      loadMoreMovies
                    }
                  >
                    {loadingMoreMovies ? (
                      <Text
                        style={
                          styles.loadMoreButtonText
                        }
                      >
                        CHARGEMENT...
                      </Text>
                    ) : (
                      <>
                        <Text
                          style={
                            styles.loadMoreButtonText
                          }
                        >
                          VOIR PLUS
                        </Text>

                        <MaterialIcons
                          name="keyboard-arrow-down"
                          size={18}
                          color={
                            COLORS.icon
                          }
                        />
                      </>
                    )}
                  </Pressable>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon="🎬"
                title={
                  emptyTitle
                }
                description={
                  emptyDescription
                }
              />
            }
            columnWrapperStyle={
              movies.length >
              0
                ? styles.gridRow
                : undefined
            }
            contentContainerStyle={[
              styles.listContent,

              movies.length ===
                0 &&
                styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        ) : (
          /*
            --------------------------
            CINEMAS LIST
            --------------------------
          */

          <FlatList
            key="cinemas"
            style={styles.list}
            data={cinemaListData}
            renderItem={renderCinemaListItem}
            keyExtractor={(item) =>
              item.type === 'section'
                ? `arrondissement-${item.arrondissement}`
                : `cinema-${item.cinema.id}`
            }
            ListEmptyComponent={
              <EmptyState
                icon="🎞️"
                title={emptyTitle}
                description={emptyDescription}
              />
            }
            contentContainerStyle={[
              styles.cinemaListContent,
              cinemaListData.length === 0 &&
                styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        )}
      </View>

      {/* MODAL GENRES */}
      <Modal
        visible={
          genreModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setGenreModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.genreModalOverlay
          }
        >
          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={() =>
              setGenreModalVisible(
                false
              )
            }
          />

          <View
            style={
              styles.genreModalBox
            }
          >
            <View
              style={
                styles.genreModalHeader
              }
            >
              <Text
                style={
                  styles.genreModalTitle
                }
              >
                GENRES
              </Text>

              <Pressable
                style={
                  styles.genreModalClose
                }
                onPress={() =>
                  setGenreModalVisible(
                    false
                  )
                }
              >
                <Text
                  style={
                    styles.genreModalCloseText
                  }
                >
                  ×
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.genreRow,

                selectedGenreIds.length ===
                  0 &&
                  styles.genreRowSelected,
              ]}
              onPress={() =>
                setSelectedGenreIds(
                  []
                )
              }
            >
              <Text
                style={
                  styles.genreRowText
                }
              >
                TOUS
              </Text>

              <View
                style={[
                  styles.genreCheckbox,

                  selectedGenreIds.length ===
                    0 &&
                    styles.genreCheckboxSelected,
                ]}
              >
                {selectedGenreIds.length ===
                  0 && (
                  <Text
                    style={
                      styles.genreCheckboxCheck
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>
            </Pressable>

            <FlatList
              data={
                genres
              }
              keyExtractor={(
                item
              ) =>
                String(
                  item.id
                )
              }
              showsVerticalScrollIndicator={
                false
              }
              style={
                styles.genreList
              }
              renderItem={({
                item,
              }) => {
                const isSelected =
                  selectedGenreIds.includes(
                    item.id
                  )

                return (
                  <Pressable
                    style={[
                      styles.genreRow,

                      isSelected &&
                        styles.genreRowSelected,
                    ]}
                    onPress={() => {
                      setSelectedGenreIds(
                        (
                          current
                        ) =>
                          isSelected
                            ? current.filter(
                                (
                                  id
                                ) =>
                                  id !==
                                  item.id
                              )
                            : [
                                ...current,
                                item.id,
                              ]
                      )
                    }}
                  >
                    <Text
                      style={
                        styles.genreRowText
                      }
                      numberOfLines={
                        1
                      }
                    >
                      {item.genre.toUpperCase()}
                    </Text>

                    <View
                      style={[
                        styles.genreCheckbox,

                        isSelected &&
                          styles.genreCheckboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Text
                          style={
                            styles.genreCheckboxCheck
                          }
                        >
                          ✓
                        </Text>
                      )}
                    </View>
                  </Pressable>
                )
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({
  // ── LAYOUT ───────────────────────────

  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  list: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  listContent: {
    paddingBottom: 24,
    backgroundColor: COLORS.background,
  },

  cinemaListContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,

    backgroundColor: COLORS.background,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  // ── HEADER ───────────────────────────

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,

    backgroundColor: COLORS.primary,

    borderBottomWidth: 3,
    borderBottomColor: COLORS.contours,
  },

  searchRow: {
    width: '100%',

    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── SEARCH ───────────────────────────

  searchContainer: {
    flex: 1,
    minWidth: 0,

    height: 42,
    paddingHorizontal: 11,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,

    borderTopLeftRadius: 11,
    borderBottomLeftRadius: 11,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },

  searchIcon: {
    width: 28,
    flexShrink: 0,

    color: COLORS.icon,

    fontSize: 29,
    fontWeight: '900',
    lineHeight: 31,

    textAlign: 'center',
  },

  searchInput: {
    flex: 1,
    minWidth: 0,

    height: '100%',

    paddingVertical: 0,
    marginLeft: 7,

    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '700',
  },

  clearButton: {
    width: 30,
    height: 30,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 15,
  },

  clearButtonPressed: {
    opacity: 0.6,
  },

  clearButtonText: {
    marginTop: -2,

    color: COLORS.icon,

    fontSize: 23,
    fontWeight: '900',
    lineHeight: 25,
  },

  // ── MODE BUTTON ──────────────────────

  modeButton: {
    width: 72,
    height: 42,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderLeftWidth: 0,
    borderColor: COLORS.contours,

    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 11,
    borderBottomRightRadius: 11,
  },

  modeButtonText: {
    color: COLORS.text2,

    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  modeButtonPressed: {
    opacity: 0.6,
  },

  // ── FILTERS ──────────────────────────

  filtersRow: {
    width: '100%',

    marginTop: 10,

    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  yearFilter: {
    width: 63,
    height: 36,

    flexShrink: 0,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 8,

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 9,
  },

  yearPrefix: {
    marginRight: 3,

    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
  },

  yearInput: {
    flex: 1,
    minWidth: 0,

    height: '100%',
    paddingVertical: 0,

    color: COLORS.text2,

    fontSize: 11,
    fontWeight: '800',
  },

  genreButton: {
    height: 36,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 9,
  },

  genreButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  genreButtonText: {
    color: COLORS.text2,

    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  sessionFilterButton: {
    height: 36,

    flexShrink: 0,

    paddingHorizontal: 9,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 9,
  },

  sessionFilterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  sessionFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 4,
  },

  sessionFilterText: {
    color: COLORS.text2,

    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  filterPressed: {
    opacity: 0.6,
  },

  // ── SECTION TITLE ────────────────────

  sectionTitleContainer: {
    marginTop: 18,
    marginBottom: 12,
    marginHorizontal: 16,

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

    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,

    textAlign: 'center',
  },

  // ── MOVIE GRID ───────────────────────

  gridRow: {
    paddingHorizontal: 12,

    justifyContent: 'flex-start',
  },

  movieGridItem: {
    width: '33.333%',
  },

  // ── CINEMA ARRONDISSEMENTS ──────────

  arrondissementHeader: {
    width: '100%',

    marginTop: 16,
    marginBottom: 10,

    flexDirection: 'row',
    alignItems: 'center',
  },

  arrondissementLine: {
    flex: 1,
    height: 2,

    backgroundColor: COLORS.contours,
  },

  arrondissementTitle: {
    marginHorizontal: 10,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,

    textAlign: 'center',
  },

  // ── LOAD MORE BUTTON ─────────────────

  loadMoreContainer: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,

    alignItems: 'center',
  },

  loadMoreButton: {
    minWidth: 130,
    height: 38,

    paddingHorizontal: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 4,

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 9,

    shadowColor: COLORS.contours,
    shadowOffset: {
      width: 3,
      height: 3,
    },
    shadowOpacity: 1,
    shadowRadius: 0,

    elevation: 4,
  },

  loadMoreButtonPressed: {
    transform: [
      {
        translateX: 2,
      },
      {
        translateY: 2,
      },
    ],

    shadowOffset: {
      width: 1,
      height: 1,
    },

    elevation: 1,
    opacity: 0.75,
  },

  loadMoreButtonDisabled: {
    opacity: 0.55,
  },

  loadMoreButtonText: {
    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  // ── GENRE MODAL ──────────────────────

  genreModalOverlay: {
    flex: 1,

    paddingHorizontal: 24,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor:
      'rgba(0, 0, 0, 0.55)',
  },

  genreModalBox: {
    width: '100%',
    maxHeight: '70%',

    padding: 16,

    backgroundColor: COLORS.background,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 16,
  },

  genreModalHeader: {
    marginBottom: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  genreModalTitle: {
    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  genreModalClose: {
    width: 34,
    height: 34,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 9,
  },

  genreModalCloseText: {
    marginTop: -2,

    color: COLORS.icon,

    fontSize: 22,
    fontWeight: '900',
  },

  genreList: {
    flexGrow: 0,
  },

  genreRow: {
    minHeight: 46,

    marginBottom: 8,
    paddingHorizontal: 12,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 10,
  },

  genreRowSelected: {
    backgroundColor: COLORS.primary,
  },

  genreRowText: {
    flex: 1,

    marginRight: 12,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  genreCheckbox: {
    width: 22,
    height: 22,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 6,
  },

  genreCheckboxSelected: {
    backgroundColor: COLORS.primary,
  },

  genreCheckboxCheck: {
    marginTop: -2,

    color: COLORS.icon,

    fontSize: 14,
    fontWeight: '900',
  },
})