import { useEffect, useState } from 'react'
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import MovieCard from '../components/MovieCard'
import CinemaCard from '../components/CinemaCard'
import { Movie } from '../types/movie'
import { getOldMoviesWithFutureSessions } from '../services/movieService'
import { Cinema } from '../types/cinema'
import { getCinemas } from '../services/cinemaService'
import HomeFooter from '../components/HomeFooter'
import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const COLORS = {
  primary: '#FFE17A',
  white: '#FFFFFF',
  black: '#111111',
  grey: '#777777',
  lightGrey: '#F4F1E8',
}

type SearchMode = 'movies' | 'cinemas'

type Props = {
  navigation: any
}

export default function HomeScreen({ navigation }: Props) {
  const [searchMode, setSearchMode] =
    useState<SearchMode>('movies')

  const [search, setSearch] = useState('')
  const [movies, setMovies] = useState<Movie[]>([])
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [loading, setLoading] = useState(true)

  const debouncedSearch = useDebouncedValue(
    search,
    300
  )

  useEffect(() => {
    if (searchMode === 'movies') {
      fetchMovies()
    } else {
      fetchCinemas()
    }
  }, [debouncedSearch, searchMode])

  const fetchMovies = async () => {
    setLoading(true)

    try {
      const data = await getOldMoviesWithFutureSessions(debouncedSearch)

      setMovies(data)
    } catch (error) {
      console.error(
        'Erreur récupération films :',
        error
      )

      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCinemas = async () => {
    setLoading(true)

    try {
      const data = await getCinemas(debouncedSearch)

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

  const changeSearchMode = (mode: SearchMode) => {
    if (mode === searchMode) return

    setSearch('')
    setSearchMode(mode)
  }

  const getCinemaImageUrl = (
    imagePath: string | null
  ) => {
    if (!imagePath) return null

    return imagePath
  }

  const renderMovie = ({
    item,
  }: {
    item: Movie
  }) => (
    <View style={styles.movieGridItem}>
      <MovieCard
        movie={item}
        onPress={() =>
          navigation.navigate('Movie', {
            movieId: item.id,
          })
        }
      />
    </View>
  )

  const renderCinema = ({
    item,
  }: {
    item: Cinema
  }) => (
    <CinemaCard
      cinema={item}
      onPress={() =>
        navigation.navigate('Cinema', {
          cinemaId: item.id,
        })
      }
    />
  )

  const renderSectionTitle = () => (
    <View style={styles.sectionTitleContainer}>
      <View style={styles.sectionTitleLine} />

      <Text style={styles.sectionTitle}>
        {search.trim()
          ? 'RÉSULTATS'
          : searchMode === 'movies'
            ? 'À REVOIR AU CINÉMA'
            : 'LES CINÉMAS DE PARIS'}
      </Text>

      <View style={styles.sectionTitleLine} />
    </View>
  )

  const emptyTitle =
  searchMode === 'movies'
    ? 'AUCUN FILM TROUVÉ'
    : 'AUCUN CINÉMA TROUVÉ'

  const emptyDescription = search.trim()
    ? 'Essaie avec une autre recherche.'
    : searchMode === 'movies'
      ? 'Aucun film correspondant ne possède actuellement de séance future.'
      : 'Aucun cinéma ne correspond à ta recherche.'

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.modeSelector}>
        <Pressable
          style={({ pressed }) => [
            styles.modeButton,
            searchMode === 'movies' &&
              styles.modeButtonActive,
            pressed &&
              styles.smallButtonPressed,
          ]}
          onPress={() =>
            changeSearchMode('movies')
          }
        >
          <Text
            style={[
              styles.modeButtonText,
              searchMode === 'movies' &&
                styles.modeButtonTextActive,
            ]}
          >
            FILMS
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.modeButton,
            searchMode === 'cinemas' &&
              styles.modeButtonActive,
            pressed &&
              styles.smallButtonPressed,
          ]}
          onPress={() =>
            changeSearchMode('cinemas')
          }
        >
          <Text
            style={[
              styles.modeButtonText,
              searchMode === 'cinemas' &&
                styles.modeButtonTextActive,
            ]}
          >
            CINÉMAS
          </Text>
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>⌕</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={
            searchMode === 'movies'
              ? 'Rechercher un film...'
              : 'Rechercher un cinéma...'
          }
          placeholderTextColor={COLORS.grey}
          autoCorrect={false}
          returnKeyType="search"
          allowFontScaling={false}
          style={styles.searchInput}
        />

        {search.length > 0 ? (
          <Pressable
            hitSlop={10}
            style={({ pressed }) => [
              styles.clearButton,
              pressed &&
                styles.clearButtonPressed,
            ]}
            onPress={() => setSearch('')}
          >
            <Text style={styles.clearButtonText}>
              ×
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )

  const displayedData =
    searchMode === 'movies' ? movies : cinemas

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.primary}
      />

      <View style={styles.screen}>
        {loading ? (
          <>
            {renderHeader()}

            <LoadingState />
          </>
        ) : (
          <FlatList
            key={searchMode}
            data={displayedData as any[]}
            numColumns={3}
            renderItem={
              searchMode === 'movies'
                ? (renderMovie as any)
                : (renderCinema as any)
            }
            keyExtractor={(item) =>
              `${searchMode}-${item.id}`
            }
            ListHeaderComponent={
              <>
                {renderHeader()}
                {renderSectionTitle()}
              </>
            }
            ListEmptyComponent={
              <EmptyState
                icon={
                  searchMode === 'movies'
                    ? '🎬'
                    : '🎞️'
                }
                title={emptyTitle}
                description={emptyDescription}
              />
            }
            columnWrapperStyle={
              displayedData.length > 0
                ? styles.gridRow
                : undefined
            }
            contentContainerStyle={[
              styles.listContent,
              displayedData.length === 0 &&
                styles.emptyListContent,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <HomeFooter
          onCalendarPress={() =>
            navigation.navigate('Calendar')
          }
          onSessionsPress={() =>
            navigation.navigate('Sessions')
          }
          onAccountPress={() =>
            navigation.navigate('Account')
          }
          onListsPress={() =>
            navigation.navigate('Lists')
          }
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  listContent: {
    paddingBottom: 24,
    backgroundColor: COLORS.white,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
  },

  modeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  modeButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
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

  modeButtonActive: {
    backgroundColor: COLORS.primary,
  },

  modeButtonText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  modeButtonTextActive: {
    fontSize: 14,
  },

  smallButtonPressed: {
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
  },

  searchContainer: {
    minHeight: 50,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
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

  searchIcon: {
    width: 28,
    color: COLORS.black,
    fontSize: 29,
    fontWeight: '900',
    lineHeight: 31,
    textAlign: 'center',
  },

  searchInput: {
    flex: 1,
    minHeight: 49,
    paddingHorizontal: 10,
    paddingVertical: 0,
    color: COLORS.black,
    fontFamily:
      Platform.OS === 'ios'
        ? 'Arial'
        : 'sans-serif',
    fontSize: 15,
    fontWeight: '500',
  },

  clearButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 15,
  },

  clearButtonPressed: {
    opacity: 0.6,
  },

  clearButtonText: {
    marginTop: -2,
    color: COLORS.black,
    fontSize: 23,
    fontWeight: '900',
    lineHeight: 25,
  },

  sectionTitleContainer: {
    marginTop: 18,
    marginBottom: 12,
    marginHorizontal: 16, // même valeur que la grille
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
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  gridRow: {
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },

  movieGridItem: {
    width: '33.333%',
  },

  cinemaCardWrapper: {
    width: '33.333%',
    paddingHorizontal: 4,
    marginBottom: 14,
  },

  cinemaImageContainer: {
    width: '100%',
    aspectRatio: 1,
    overflow: 'hidden',
    backgroundColor: COLORS.lightGrey,
    borderBottomWidth: 2.5,
    borderBottomColor: COLORS.black,
  },

  cinemaPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
  },

  cinemaPlaceholderIcon: {
    fontSize: 28,
  },

  cinemaInformation: {
    minHeight: 92,
    padding: 7,
  },
})