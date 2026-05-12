import { useEffect, useState, useMemo } from 'react'
import {
  View,
  Text,
  Image,
  ActivityIndicator,
//   SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  StatusBar,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { supabase } from '../lib/supabase'
import { Movie } from '../types/movie'
import { MovieSession } from '../types/session'
import SessionCard from '../components/SessionCard'
import SessionCalendar from '../components/SessionCalendar'
import Badge from '../components/ui/Badge'
import { C } from '../theme/colors'

// ── HELPERS ─────────────────────────────
const getDateKey = (d: string) =>
  d.split('T')[0] || d.split(' ')[0]

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' })

// ── SCREEN ─────────────────────────────
export default function MovieScreen({ route, navigation }: any) {
  const { movieId } = route.params

  const [movie, setMovie] = useState<Movie | null>(null)
  const [director, setDirector] = useState<string | null>(null)
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null)
  const [sessions, setSessions] = useState<MovieSession[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const [loading, setLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(true)

  useEffect(() => {
    fetchMovie()
    fetchSessions()
  }, [])

  // ── FETCH MOVIE ──
  const fetchMovie = async () => {
    const { data, error } = await supabase
      .from('movies')
      .select(`
        id, title, original_title, overview,
        poster_path, backdrop_path,
        popularity, vote_average, vote_count,
        runtime, release_date, original_language, is_adult,
        movie_people ( role_type, person:peoples ( name ) ),
        movie_trailers ( youtube_key, is_main )
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
        ?.filter((p: any) => p.role_type === 'director')
        .map((p: any) => p.person?.name)
        .filter(Boolean) || []

    setDirector(directors.join(', '))

    const trailers = data.movie_trailers || []
    const picked = trailers.find((t: any) => t.is_main) ?? trailers[0]

    if (picked) {
      setTrailerUrl(`https://www.youtube.com/watch?v=${picked.youtube_key}`)
    }

    setLoading(false)
  }

  // ── FETCH SESSIONS ──
  const fetchSessions = async () => {
    setSessionsLoading(true)

    const now = new Date()
    const in30Days = new Date()
    in30Days.setDate(now.getDate() + 30)

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, starts_at, projection, version, booking_url,
        cinema:cinemas ( id, name, address, city, postal_code )
      `)
      .eq('movie_id', movieId)
      .gte('starts_at', now.toISOString())
      .lte('starts_at', in30Days.toISOString())
      .order('starts_at', { ascending: true })

    if (error) {
      console.log(error)
      setSessionsLoading(false)
      return
    }

    const normalized: MovieSession[] =
      data?.map((s: any) => ({
        ...s,
        cinema: Array.isArray(s.cinema) ? s.cinema[0] : s.cinema,
      })) || []

    setSessions(normalized)

    setSelectedDate(
      normalized.length > 0
        ? getDateKey(normalized[0].starts_at)
        : getDateKey(now.toISOString())
    )

    setSessionsLoading(false)
  }

  // ── IMAGES ──
  const getPoster = () => {
    if (!movie?.poster_path) return null
    return movie.poster_path.startsWith('/img')
      ? `https://fr.web.img6.acsta.net${movie.poster_path}`
      : `https://image.tmdb.org/t/p/w500${movie.poster_path}`
  }

  const getBackdrop = () =>
    movie?.backdrop_path
      ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
      : null

  // ── CALENDAR ──
  const sessionDays = useMemo(() => {
    const seen = new Set<string>()
    return sessions
      .map(s => {
        const key = getDateKey(s.starts_at)
        if (seen.has(key)) return null
        seen.add(key)
        const d = new Date(s.starts_at)
        const label = d.toLocaleDateString('fr-FR', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
        })
        return { key, label }
      })
      .filter(Boolean) as { key: string; label: string }[]
  }, [sessions])

  const sessionsForSelectedDate = sessions.filter(
    s => getDateKey(s.starts_at) === selectedDate
  )

  // ── LOADING ──
  if (loading) {
    return (
      <SafeAreaView style={[styles.root, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={C.accent} />
      </SafeAreaView>
    )
  }

  if (!movie) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <Text style={{ color: C.text }}>Film introuvable</Text>
      </SafeAreaView>
    )
  }

  const poster = getPoster()
  const backdrop = getBackdrop()

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <ScrollView>

        {/* HERO */}
        <View style={styles.hero}>
          {backdrop ? (
            <Image source={{ uri: backdrop }} style={styles.backdrop} />
          ) : (
            <View style={[styles.backdrop, { backgroundColor: C.surface }]} />
          )}

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* HEADER */}
        <View style={styles.headerRow}>
          {poster && <Image source={{ uri: poster }} style={styles.poster} />}

          <View style={{ flex: 1, paddingTop: 55 }}>
            <Text style={styles.title}>{movie.title}</Text>

            {movie.original_title !== movie.title && (
              <Text style={styles.subtitle}>{movie.original_title}</Text>
            )}

            {director && <Text style={styles.meta}>🎬 {director}</Text>}

            <View style={styles.badges}>
              {movie.runtime && <Badge label={`${movie.runtime} min`} />}
              {movie.release_date && <Badge label={movie.release_date.slice(0, 4)} />}
              {movie.original_language && <Badge label={movie.original_language.toUpperCase()} />}
            </View>

            <View style={styles.actionsRow}>
                <View style={styles.ratingBox}>
                    <Text style={styles.ratingValue}>
                        {movie.vote_average ? movie.vote_average.toFixed(1) : '—'}
                    </Text>
                    <Text style={styles.ratingText}>
                        /10 · {movie.vote_count ?? 0}
                    </Text>
                </View>

                <TouchableOpacity style={styles.addBtn}>
                    <Text style={styles.addBtnText}>＋</Text>
                </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* BODY */}
        <View style={styles.body}>

          {/* TRAILER */}
          {trailerUrl && (
            <TouchableOpacity
              onPress={() => Linking.openURL(trailerUrl)}
              style={styles.trailerBtn}
            >
              <Text style={{ color: 'white' }}>▶ Bande-annonce</Text>
            </TouchableOpacity>
          )}

          {/* DESCRIPTION */}
          <Text style={styles.section}>Synopsis</Text>
          <Text style={styles.text}>
            {movie.overview || 'Aucune description'}
          </Text>

          {/* SESSIONS */}
          <Text style={styles.section}>Séances</Text>

          <SessionCalendar
            days={sessionDays}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />

          <View style={{ marginTop: 15 }}>
            {sessionsLoading ? (
                <ActivityIndicator color={C.green} />
            ) : sessionsForSelectedDate.length === 0 ? (
                <Text style={{ color: C.muted }}>Aucune séance</Text>
            ) : (
                sessionsForSelectedDate.map(s => (
                  <SessionCard key={s.id} session={s} />
                ))
            )}
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

// ── STYLES ──
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  hero: { height: 220 },
  backdrop: { width: '100%', height: '100%' },

  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', // 🔥 fond sombre
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerRow: {
    flexDirection: 'row',
    marginTop: -60,
    padding: 16,
  },

  poster: {
    width: 110,
    height: 165,
    borderRadius: 12,
    marginRight: 15,
    marginTop: 15, // 👈 AJOUT
  },

  title: { color: C.text, fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: C.muted, fontSize: 12 },
  meta: { color: C.muted, marginTop: 5 },

  badges: { flexDirection: 'row', gap: 6, marginTop: 8 },

  body: { padding: 16 },

  section: { color: C.text, fontSize: 16, fontWeight: 'bold', marginVertical: 10 },
  text: { color: C.muted },

  trailerBtn: {
    backgroundColor: C.accent,
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  ratingBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },

  ratingValue: {
    color: C.accent,
    fontSize: 20,
    fontWeight: '800',
    marginRight: 4,
  },

  ratingText: {
    color: C.muted,
    fontSize: 12,
  },

  addBtn: {
    backgroundColor: C.accentSoft,
    borderWidth: 1,
    borderColor: C.accent,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  addBtnText: {
    color: C.accent,
    fontSize: 20,
    fontWeight: 'bold',
  },

  backBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
})