import SearchClearButton from '../components/SearchClearButton'
import { useEffect, useState } from 'react'
import {
  FlatList,
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

  const [includeNewReleases, setIncludeNewReleases] = useState(false)
  const [includeOlderReleases, setIncludeOlderReleases] = useState(true)

  const [
    futureSessionsOnly,
    setFutureSessionsOnly,
  ] = useState(true)

  const debouncedSearch =
    useDebouncedValue(
      search,
      300
    )

  const filterGap = width < 360 ? 3 : 7

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
    includeNewReleases,
    includeOlderReleases,
    futureSessionsOnly,
  ])

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

            includeNewReleases,
            includeOlderReleases,

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

            includeNewReleases,
            includeOlderReleases,

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

          <View style={styles.searchInputWrapper}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              accessibilityLabel={
                searchMode === 'movies'
                  ? 'Rechercher un film'
                  : 'Rechercher un cin?ma'
              }
              autoCorrect={false}
              returnKeyType="search"
              allowFontScaling={false}
              style={[styles.searchInput, styles.searchTypography]}
            />
            {search.length === 0 && (
              <View
                pointerEvents="none"
                style={styles.searchPlaceholderContainer}
              >
                <Text
                  accessible={false}
                  allowFontScaling={false}
                  numberOfLines={1}
                  style={[styles.searchTypography, styles.searchPlaceholder]}
                >
                  {searchMode === 'movies'
                    ? 'Rechercher un film...'
                    : 'Rechercher un cin?ma...'}
                </Text>
              </View>
            )}
          </View>

          {search.length > 0 && (
            <SearchClearButton onPress={() => setSearch('')} />
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
          {[
            { label: 'AVEC SÉANCE', checked: futureSessionsOnly, toggle: () => setFutureSessionsOnly(value => !value) },
            { label: 'DÉJÀ SORTI', checked: includeOlderReleases, toggle: () => setIncludeOlderReleases(value => !value) },
            { label: 'NOUVEAUTÉ', checked: includeNewReleases, toggle: () => setIncludeNewReleases(value => !value) },
          ].map(filter => (
            <Pressable
              key={filter.label}
              accessibilityRole="checkbox"
              accessibilityLabel={filter.label}
              accessibilityState={{ checked: filter.checked }}
              style={({ pressed }) => [
                styles.sessionFilterButton,
                filter.checked && styles.sessionFilterButtonActive,
                pressed && styles.filterPressed,
              ]}
              onPress={filter.toggle}
            >
              <View style={styles.sessionFilterContent}>
                <MaterialIcons
                  name={filter.checked ? 'check-box' : 'check-box-outline-blank'}
                  size={15}
                  color={COLORS.icon}
                />
                <Text style={styles.sessionFilterText} numberOfLines={1} adjustsFontSizeToFit>
                  {filter.label}
                </Text>
              </View>
            </Pressable>
          ))}
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
          <LoadingState fullScreen />
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
                    {loading ? (
                      <LoadingState fullScreen />
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
    paddingTop: 2,
    paddingBottom: 10,

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

  searchInputWrapper: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    marginLeft: 7,
    position: 'relative',
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    color: COLORS.text2,
  },

  searchTypography: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },

  searchPlaceholderContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
  },

  searchPlaceholder: {
    color: COLORS.ghostText,
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

    marginTop: 6,

    flexDirection: 'row',
    alignItems: 'center',
  },

  sessionFilterButton: {
    height: 30,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,

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
    flexShrink: 1,
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

})
