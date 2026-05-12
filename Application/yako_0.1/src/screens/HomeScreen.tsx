import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, StatusBar } from 'react-native'
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { Movie } from '../types/movie'
import MovieCard from '../components/MovieCard'
import { C } from '../theme/colors'

type Props = {
  navigation: any
}

export default function HomeScreen({ navigation }: Props) {
  const [search, setSearch] = useState<string>('')

  const [newMovies, setNewMovies] = useState<Movie[]>([])
  const [oldMovies, setOldMovies] = useState<Movie[]>([])
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([])

  const [loadingMovies, setLoadingMovies] = useState(true)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    await fetchMovies(user.id)
  }

  const parseDate = (dateString: string): number => {
    if (!dateString) return 0
    const iso = dateString.includes('T')
      ? dateString
      : dateString.replace(' ', 'T')
    const ts = new Date(iso).getTime()
    return isNaN(ts) ? 0 : ts
  }

  const fetchMovies = async (uid: string) => {
    setLoadingMovies(true)

    const nowTime = Date.now()

    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    const twoYearsAgoISO = twoYearsAgo.toISOString()

    const [newRes, oldRes, watchRes] = await Promise.all([
      supabase
        .from('movies')
        .select(`id, tmdb_id, title, release_date, popularity, poster_path, sessions (id, starts_at)`)
        .gte('release_date', twoYearsAgoISO)
        .order('popularity', { ascending: false }),

      supabase
        .from('movies')
        .select(`id, tmdb_id, title, release_date, popularity, poster_path, sessions (id, starts_at)`)
        .lt('release_date', twoYearsAgoISO)
        .order('popularity', { ascending: false }),

      supabase
        .from('watchlist')
        .select(`movie:movies (id, tmdb_id, title, release_date, popularity, poster_path, sessions (id, starts_at))`)
        .eq('user_id', uid)
    ])

    if (newRes.error)   console.log('NEW ERROR',   newRes.error)
    if (oldRes.error)   console.log('OLD ERROR',   oldRes.error)
    if (watchRes.error) console.log('WATCH ERROR', watchRes.error)

    const filterMovies = (movies: any[]) =>
      movies.filter((m: any) =>
        m.sessions?.some((s: any) => parseDate(s.starts_at) > nowTime)
      )

    setNewMovies(filterMovies(newRes.data || []))
    setOldMovies(filterMovies(oldRes.data || []))

    const watchMovies =
      watchRes.data
        ?.map((w: any) => w.movie)
        .filter(Boolean)
        .filter((m: any) =>
          m.sessions?.some((s: any) => parseDate(s.starts_at) > nowTime)
        ) || []

    setWatchlistMovies(watchMovies)
    setLoadingMovies(false)
  }

  const filterBySearch = (movies: Movie[]) => {
    if (!search.trim()) return movies
    return movies.filter(m =>
      m.title.toLowerCase().includes(search.toLowerCase())
    )
  }

  const renderMovie = ({ item }: { item: Movie }) => (
    <MovieCard
      movie={item}
      onPress={() => navigation.navigate('Movie', { movieId: item.id })}
    />
  )

  const Section = ({ title, data, accent = false }: { title: string; data: Movie[]; accent?: boolean }) => {
    if (!data || data.length === 0) return null

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          {accent && <View style={styles.sectionAccentDot} />}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={data}
          renderItem={renderMovie}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{
            paddingLeft: 8,
            paddingRight: 8
          }}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <View style={styles.inner}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.appName}>Yako Go</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Account')}
            style={styles.avatarBtn}
          >
            <Text style={styles.avatarText}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}></Text>
          <TextInput
            placeholder="Rechercher un film..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: C.muted, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CONTENU */}
        <View style={{ flex: 1 }}>
          {loadingMovies ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={C.accent} />
            </View>
          ) : (
            <FlatList
              data={[{ key: 'content' }]}
              showsVerticalScrollIndicator={false}
              renderItem={() => (
                <>
                  <Section
                    title="Modernités au cinéma"
                    data={filterBySearch(newMovies)}
                  />
                  <Section
                    title="Classiques au cinéma"
                    data={filterBySearch(oldMovies)}
                  />
                  {watchlistMovies.length > 0 && (
                    <Section
                      title="⭐ Dans ta liste"
                      data={filterBySearch(watchlistMovies)}
                      accent
                    />
                  )}
                </>
              )}
            />
          )}
        </View>

        {/* FOOTER NAV */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => navigation.navigate('Friends')}
          >
            <Text style={styles.footerLabel}>Amis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => navigation.navigate('Sessions')}
          >
            <Text style={styles.footerLabel}>Séances</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => navigation.navigate('Lists')}
          >
            <Text style={styles.footerLabel}>Listes</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: C.bg },
  inner: { flex: 1, paddingTop: 8 },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  appName: {
    color: C.accent,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarText: { fontSize: 16 },

  // SEARCH
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon:  { fontSize: 14 },
  searchInput: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    padding: 0,
  },

  // SECTIONS
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  sectionAccentDot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
  },
  sectionTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // LOADING
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // FOOTER
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  footerItem:  { alignItems: 'center', gap: 4 },
  footerIcon:  { fontSize: 20 },
  footerLabel: { color: C.muted, fontSize: 11, fontWeight: '600' },
})