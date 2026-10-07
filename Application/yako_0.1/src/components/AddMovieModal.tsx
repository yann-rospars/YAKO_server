import ModalCloseButton from './ModalCloseButton'
import SearchClearButton from './SearchClearButton'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert, FlatList, Image, Modal, Pressable, StyleSheet,
  Text, TextInput, TouchableOpacity, View, useWindowDimensions,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { supabase } from '../lib/supabase'
import { getHomeMovies } from '../services/movieService'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { Movie } from '../types/movie'
import { COLORS } from '../theme/colors'
import LoadingState from './LoadingState'

const PAGE_SIZE = 18

type Result = Movie & { containsMovie: boolean }
type Props = {
  listId: number
  onClose: () => void
  onMembershipChange: (movie: Movie, included: boolean) => void
}

function posterUrl(path?: string) {
  if (!path) return null
  if (/^https?:\/\//.test(path)) return path
  if (path.startsWith('/img')) return `https://fr.web.img6.acsta.net${path}`
  return `https://image.tmdb.org/t/p/w500${path}`
}

function releaseDate(value: string) {
  if (!value) return 'Date inconnue'
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  return Number.isNaN(date.getTime()) ? 'Date inconnue' : date.toLocaleDateString('fr-FR')
}

export default function AddMovieModal({ listId, onClose, onMembershipChange }: Props) {
  const { height } = useWindowDimensions()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingMovieId, setPendingMovieId] = useState<number | null>(null)
  const offset = useRef(0)
  const generation = useRef(0)
  const pageInFlight = useRef(false)
  const mutationInFlight = useRef(false)
  const membershipChanges = useRef(new Map<number, boolean>())
  const resultsRef = useRef<FlatList<Result>>(null)
  const waitingForSearch = search !== debouncedSearch

  const fetchPage = useCallback(async (query: string, pageOffset: number) => {
    // Defaults deliberately omit years, genres and the future-sessions filter.
    const movies = await getHomeMovies({ search: query, offset: pageOffset, limit: PAGE_SIZE })
    if (movies.length === 0) return []
    const { data, error } = await supabase
      .from('list_movies')
      .select('movie_id')
      .eq('list_id', listId)
      .in('movie_id', movies.map((movie) => movie.id))
    if (error) throw error
    const existingIds = new Set((data ?? []).map((row) => row.movie_id))
    return movies.map((movie) => ({
      ...movie,
      containsMovie: membershipChanges.current.get(movie.id) ?? existingIds.has(movie.id),
    }))
  }, [listId])

  useEffect(() => {
    const request = ++generation.current
    setLoading(true)
    setLoadingMore(false)
    setError(null)
    setResults([])
    setHasMore(false)
    pageInFlight.current = false
    offset.current = 0
    fetchPage(debouncedSearch, 0)
      .then((page) => {
        if (generation.current !== request) return
        setResults(page)
        offset.current = PAGE_SIZE
        setHasMore(page.length === PAGE_SIZE)
        resultsRef.current?.scrollToOffset({ offset: 0, animated: false })
      })
      .catch(() => {
        if (generation.current === request) setError('Impossible de charger les films. Réessaie.')
      })
      .finally(() => {
        if (generation.current === request) setLoading(false)
      })
    return () => { generation.current += 1 }
  }, [debouncedSearch, fetchPage])

  const loadMore = async () => {
    if (loading || waitingForSearch || pageInFlight.current || !hasMore) return
    const request = generation.current
    pageInFlight.current = true
    setLoadingMore(true)
    setError(null)
    try {
      const page = await fetchPage(debouncedSearch, offset.current)
      if (generation.current !== request) return
      setResults((current) => {
        const ids = new Set(current.map((movie) => movie.id))
        return [...current, ...page.filter((movie) => !ids.has(movie.id))]
      })
      offset.current += PAGE_SIZE
      setHasMore(page.length === PAGE_SIZE)
    } catch {
      if (generation.current === request) setError('Impossible de charger la suite. Réessaie avec Voir plus.')
    } finally {
      if (generation.current === request) {
        pageInFlight.current = false
        setLoadingMore(false)
      }
    }
  }

  const toggleMovie = async (movie: Result) => {
    if (mutationInFlight.current) return
    mutationInFlight.current = true
    setPendingMovieId(movie.id)
    const included = !movie.containsMovie
    try {
      const { error } = included
        ? await supabase.from('list_movies').insert({ list_id: listId, movie_id: movie.id })
        : await supabase.from('list_movies').delete().eq('list_id', listId).eq('movie_id', movie.id)
      if (error && !(included && error.code === '23505')) throw error
      membershipChanges.current.set(movie.id, included)
      setResults((current) => current.map((item) => item.id === movie.id
        ? { ...item, containsMovie: included } : item))
      onMembershipChange(movie, included)
    } catch {
      Alert.alert('Erreur', included ? "Impossible d'ajouter ce film." : 'Impossible de retirer ce film.')
    } finally {
      mutationInFlight.current = false
      setPendingMovieId(null)
    }
  }

  const close = () => {
    if (!mutationInFlight.current) onClose()
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View style={[styles.box, { height: height * 0.7 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>AJOUTER UN FILM</Text>
            <ModalCloseButton onPress={close} disabled={pendingMovieId !== null} />
          </View>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={25} color={COLORS.icon} />
            <View style={styles.inputWrapper}>
              <TextInput value={search} onChangeText={setSearch}
                accessibilityLabel="Rechercher un film" autoCorrect={false}
                autoCapitalize="none" returnKeyType="search" allowFontScaling={false}
                style={styles.searchInput} />
              {!search && (
                <View pointerEvents="none" style={styles.placeholderContainer}>
                  <Text accessible={false} numberOfLines={1} allowFontScaling={false}
                    style={styles.placeholder}>Rechercher un film...</Text>
                </View>
              )}
            </View>
            {!!search && <SearchClearButton onPress={() => setSearch('')} />}
          </View>
          {loading || waitingForSearch ? <LoadingState fullScreen /> : (
            <FlatList ref={resultsRef} data={results} extraData={pendingMovieId}
              style={styles.results} keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
              automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={styles.emptyText}>{error ?? 'AUCUN FILM TROUVÉ'}</Text>}
              renderItem={({ item }) => {
                const poster = posterUrl(item.poster_path)
                return (
                  <View style={styles.row}>
                    {poster ? <Image source={{ uri: poster }} style={styles.poster} resizeMode="cover" />
                      : <View style={[styles.poster, styles.posterFallback]}>
                          <MaterialIcons name="movie" size={22} color={COLORS.icon} />
                        </View>}
                    <View style={styles.movieInformation}>
                      <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.movieDate}>{releaseDate(item.release_date)}</Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.8} disabled={pendingMovieId !== null}
                      onPress={() => toggleMovie(item)}
                      accessibilityLabel={`${item.containsMovie ? 'Retirer' : 'Ajouter'} ${item.title}`}
                      style={[styles.actionButton, item.containsMovie && styles.removeButton]}>
                      {pendingMovieId === item.id ? <LoadingState inline /> :
                        <Text style={styles.actionText}>{item.containsMovie ? 'RETIRER' : 'AJOUTER'}</Text>}
                    </TouchableOpacity>
                  </View>
                )
              }}
              ListFooterComponent={<View style={styles.footer}>
                {!!error && results.length > 0 && <Text style={styles.emptyText}>{error}</Text>}
                {hasMore && <Pressable disabled={loadingMore} onPress={loadMore}
                  style={styles.loadMoreButton}>
                  {loadingMore ? <LoadingState inline /> : <>
                    <Text style={styles.loadMoreText}>VOIR PLUS</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={18} color={COLORS.icon} />
                  </>}
                </Pressable>}
              </View>}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,

    paddingHorizontal: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  box: {
    width: '100%',

    padding: 16,

    backgroundColor: COLORS.background,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 16,
  },
  header: {
    minHeight: 42,

    marginBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flex: 1,

    color: COLORS.text2,

    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  searchContainer: {
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

  actionButton: {
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
  actionText: {
    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  removeButton: {
    backgroundColor: COLORS.important,
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
  loadMoreText: {
    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  inputWrapper: { flex: 1, minWidth: 0, height: 45, marginHorizontal: 8 },
  searchInput: { flex: 1, padding: 0, fontSize: 14, fontWeight: '600', color: COLORS.text2 },
  placeholderContainer: { ...StyleSheet.absoluteFill, justifyContent: 'center' },
  placeholder: { color: COLORS.ghostText, fontSize: 14, fontWeight: '600', letterSpacing: 0 },
  results: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    marginBottom: 10, backgroundColor: COLORS.secondary, borderWidth: 3,
    borderColor: COLORS.contours, borderRadius: 12 },
  poster: { width: 40, height: 60, borderRadius: 4, backgroundColor: COLORS.primary },
  posterFallback: { alignItems: 'center', justifyContent: 'center' },
  movieInformation: { flex: 1, minWidth: 0 },
  movieTitle: { fontSize: 12, fontWeight: '900', color: COLORS.text2 },
  movieDate: { marginTop: 5, fontSize: 10, color: COLORS.ghostText },
  emptyText: { paddingVertical: 20, textAlign: 'center', color: COLORS.text2, fontSize: 12 },
  footer: { alignItems: 'center', paddingVertical: 8 },
})
