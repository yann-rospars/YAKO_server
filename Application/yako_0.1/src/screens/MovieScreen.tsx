import { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { supabase } from '../lib/supabase'
import { Movie } from '../types/movie'
import { MovieSession } from '../types/session'

import SessionCard from '../components/SessionCard'
import SessionCalendar from '../components/SessionCalendar'
import Badge from '../components/ui/Badge'
import LoadingState from '../components/LoadingState'

const COLORS = {
  primary: '#FFE17A',
  white: '#FFFFFF',
  black: '#111111',
  grey: '#777777',
  lightGrey: '#F4F1E8',
}

const getDateKey = (date: string) =>
  date.split('T')[0] || date.split(' ')[0]

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
        <LoadingState />
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
            {renderSectionTitle(
              'SYNOPSIS'
            )}

            <View
              style={
                styles.synopsisCard
              }
            >
              <Text
                style={styles.synopsisText}
                numberOfLines={showFullSynopsis ? undefined : 5}
              >
                {movie.overview || 'Aucune description disponible.'}
              </Text>
              {movie.overview &&
                movie.overview.length > 250 && (
                  <TouchableOpacity
                    onPress={() =>
                      setShowFullSynopsis(!showFullSynopsis)
                    }
                  >
                    <Text style={styles.moreText}>
                      {showFullSynopsis
                        ? 'Afficher moins ▲'
                        : 'Afficher plus ▼'}
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
              <View
                style={
                  styles.sessionsLoading
                }
              >
                <ActivityIndicator
                  size="large"
                  color={COLORS.black}
                />

                <Text
                  style={
                    styles.sessionsLoadingText
                  }
                >
                  CHARGEMENT DES SÉANCES...
                </Text>
              </View>
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.lightGrey,
  },

  scrollContent: {
    paddingBottom: 40,
    backgroundColor: COLORS.lightGrey,
  },

  // HERO

  hero: {
    height: 220,
    overflow: 'hidden',
    backgroundColor: COLORS.primary,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
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
    borderColor: COLORS.black,
    borderRadius: 12,

    shadowColor: COLORS.black,
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
    color: COLORS.black,
    fontSize: 24,
    fontWeight: '900',
  },

  // HEADER DU FILM
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
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.black,
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
    color: COLORS.black,
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
    color: COLORS.black,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 21,
  },

  subtitle: {
    marginTop: 4,
    color: COLORS.grey,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
  },

  director: {
    marginTop: 4,
    color: COLORS.black,
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
    color: COLORS.black,
    fontSize: 22,
    fontWeight: '900',
  },

  ratingText: {
    marginLeft: 3,
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: '900',
  },

  ratingCount: {
    marginLeft: 6,
    color: COLORS.grey,
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
    borderColor: COLORS.black,
    borderRadius: 11,

    shadowColor: COLORS.black,
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
    color: COLORS.black,
    fontSize: 25,
    fontWeight: '900',
  },

  // BODY

  body: {
    paddingHorizontal: 16,
    paddingTop: 22,
  },

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
    borderColor: COLORS.black,
    borderRadius: 12,

    shadowColor: COLORS.black,
    shadowOffset: {
      width: 4,
      height: 4,
    },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },

  trailerBtnIcon: {
    color: COLORS.black,
    fontSize: 14,
    fontWeight: '900',
  },

  trailerBtnText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

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

  synopsisCard: {
    padding: 15,
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

  synopsisText: {
    color: COLORS.black,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },

  moreText: {
    marginTop: 12,
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },

  // SÉANCES

  sessionsList: {
    marginTop: 16,
  },

  sessionsLoading: {
    minHeight: 130,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 14,
  },

  sessionsLoadingText: {
    marginTop: 12,
    color: COLORS.black,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  noSessionsCard: {
    minHeight: 90,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 14,
  },

  noSessionsText: {
    color: COLORS.grey,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textAlign: 'center',
  },

  // NOT FOUND

  notFoundContainer: {
    flex: 1,
    margin: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 3,
    borderColor: COLORS.black,
    borderRadius: 14,
  },

  notFoundText: {
    color: COLORS.black,
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
    borderColor: COLORS.black,
    borderRadius: 11,
  },

  notFoundButtonText: {
    color: COLORS.black,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
})