import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import {
  SafeAreaView,
} from 'react-native-safe-area-context'

import {
  MaterialIcons,
} from '@expo/vector-icons'

import {
  useCallback,
  useMemo,
  useState,
} from 'react'

import {
  useFocusEffect,
} from '@react-navigation/native'

import LoadingState from '../components/LoadingState'
import EmptyState from '../components/EmptyState'

import {
  CinemaDetail,
  CinemaSessionRow,
  getCinemaDetail,
} from '../services/cinemaService'
import { COLORS } from '../theme/colors'

type Props = {
  route: any
  navigation: any
}

type DateItem =
  | {
      type: 'date'
      date: string
    }
  | {
      type: 'gap'
      key: string
    }

type MovieGroup = {
  movie: {
    id: number
    title: string
    poster_path: string | null
    release_date: string | null

    movie_people: {
      role_type: string
      person: {
        name: string
      } | null
    }[]
  }

  sessions: CinemaSessionRow[]
}

const getDateKey = (
  startsAt: string
) => {
  return startsAt.slice(0, 10)
}

const parseLocalDate = (
  date: string
) => {
  return new Date(
    `${date}T12:00:00`
  )
}

const getDaysDifference = (
  first: string,
  second: string
) => {
  const a =
    parseLocalDate(first)

  const b =
    parseLocalDate(second)

  return Math.round(
    (b.getTime() - a.getTime()) /
      86400000
  )
}

const formatDayName = (
  date: string
) =>
  parseLocalDate(date)
    .toLocaleDateString(
      'fr-FR',
      {
        weekday: 'short',
      }
    )
    .replace('.', '')
    .toUpperCase()

const formatDayNumber = (
  date: string
) =>
  parseLocalDate(date)
    .toLocaleDateString(
      'fr-FR',
      {
        day: '2-digit',
      }
    )

const formatMonth = (
  date: string
) =>
  parseLocalDate(date)
    .toLocaleDateString(
      'fr-FR',
      {
        month: 'short',
      }
    )
    .replace('.', '')
    .toUpperCase()

const formatTime = (
  startsAt: string
) => {
  const normalized =
    startsAt.includes('T')
      ? startsAt
      : startsAt.replace(
          ' ',
          'T'
        )

  return new Date(
    normalized
  ).toLocaleTimeString(
    'fr-FR',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  )
}

const getSessionCategory = (
  session: CinemaSessionRow
) => {
  const values = [
    session.version,
    session.projection,
  ].filter(Boolean)

  return values.length > 0
    ? values.join(' • ')
    : 'STANDARD'
}

export default function CinemaScreen({
  route,
  navigation,
}: Props) {
  const { cinemaId } =
    route.params

  const [
    cinema,
    setCinema,
  ] =
    useState<CinemaDetail | null>(
      null
    )

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    selectedDate,
    setSelectedDate,
  ] =
    useState<string | null>(
      null
    )

  useFocusEffect(
    useCallback(() => {
      fetchCinema()
    }, [cinemaId])
  )

  const fetchCinema =
    async () => {
      setLoading(true)

      try {
        const data =
          await getCinemaDetail(
            cinemaId
          )

        setCinema(data)

        const firstDate =
          data.sessions.length >
          0
            ? getDateKey(
                data.sessions[0]
                  .starts_at
              )
            : null

        setSelectedDate(
          (current) =>
            current &&
            data.sessions.some(
              (session) =>
                getDateKey(
                  session.starts_at
                ) === current
            )
              ? current
              : firstDate
        )
      } catch (error) {
        console.error(
          'Erreur récupération cinéma :',
          error
        )

        setCinema(null)
      } finally {
        setLoading(false)
      }
    }

  /*
    ----------------------------------
    JOURS DISPONIBLES
    ----------------------------------
  */

  const availableDates =
    useMemo(() => {
      if (!cinema) {
        return []
      }

      return Array.from(
        new Set(
          cinema.sessions.map(
            (session) =>
              getDateKey(
                session.starts_at
              )
          )
        )
      ).sort()
    }, [cinema])

  /*
    Insère "..." lorsqu'il manque
    au moins un jour entre deux dates.
  */

  const calendarItems:
    DateItem[] =
    useMemo(() => {
      const result:
        DateItem[] = []

      availableDates.forEach(
        (date, index) => {
          if (index > 0) {
            const previous =
              availableDates[
                index - 1
              ]

            if (
              getDaysDifference(
                previous,
                date
              ) > 1
            ) {
              result.push({
                type: 'gap',
                key: `gap-${previous}-${date}`,
              })
            }
          }

          result.push({
            type: 'date',
            date,
          })
        }
      )

      return result
    }, [availableDates])

  /*
    ----------------------------------
    SÉANCES DU JOUR
    ----------------------------------
  */

  const sessionsForDay =
    useMemo(() => {
      if (
        !cinema ||
        !selectedDate
      ) {
        return []
      }

      return cinema.sessions.filter(
        (session) =>
          getDateKey(
            session.starts_at
          ) === selectedDate
      )
    }, [
      cinema,
      selectedDate,
    ])

  /*
    ----------------------------------
    GROUPER PAR FILM
    ----------------------------------
  */

  const moviesForDay =
    useMemo(() => {
      const groups =
        new Map<
          number,
          MovieGroup
        >()

      for (
        const session of
        sessionsForDay
      ) {
        if (!session.movie) {
          continue
        }

        const existing =
          groups.get(
            session.movie.id
          )

        if (existing) {
          existing.sessions.push(
            session
          )
        } else {
          groups.set(
            session.movie.id,
            {
              movie:
                session.movie,

              sessions: [
                session,
              ],
            }
          )
        }
      }

      return Array.from(
        groups.values()
      )
    }, [sessionsForDay])

  const getPosterUrl = (
    posterPath: string | null
    ) => {
    if (!posterPath) {
        return null
    }

    if (
        posterPath.startsWith('http://') ||
        posterPath.startsWith('https://')
    ) {
        return posterPath
    }

    if (posterPath.startsWith('/img')) {
        return `https://fr.web.img6.acsta.net${posterPath}`
    }

    return `https://image.tmdb.org/t/p/w500${posterPath}`
  }

  const openBooking =
    async (
      url: string | null
    ) => {
      if (!url) {
        return
      }

      try {
        const canOpen =
          await Linking.canOpenURL(
            url
          )

        if (canOpen) {
          await Linking.openURL(
            url
          )
        }
      } catch (error) {
        console.error(
          'Erreur ouverture réservation :',
          error
        )
      }
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
        edges={[
          'top',
          'bottom',
        ]}
      >
        <LoadingState fullScreen />
      </SafeAreaView>
    )
  }

  /*
    ----------------------------------
    CINÉMA INTROUVABLE
    ----------------------------------
  */

  if (!cinema) {
    return (
      <SafeAreaView
        style={styles.root}
        edges={[
          'top',
          'bottom',
        ]}
      >
        <View
          style={
            styles.notFound
          }
        >
          <Text
            style={
              styles.notFoundText
            }
          >
            CINÉMA INTROUVABLE
          </Text>

          <Pressable
            style={
              styles.backSimpleButton
            }
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text
              style={
                styles.backSimpleText
              }
            >
              RETOUR
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={styles.root}
      edges={[
        'top',
        'bottom',
      ]}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,

            pressed &&
              styles.buttonPressed,
          ]}
          onPress={() =>
            navigation.goBack()
          }
        >
          <MaterialIcons
            name="arrow-back"
            size={21}
            color={COLORS.return}
          />
        </Pressable>

        <View
          style={
            styles.headerContent
          }
        >
          <Text
            style={
              styles.cinemaName
            }
            numberOfLines={2}
          >
            {cinema.name}
          </Text>

          <Text
            style={
              styles.cinemaLocation
            }
            numberOfLines={2}
          >
            {[
              cinema.address,
              cinema.postal_code,
              cinema.city,
            ]
              .filter(Boolean)
              .join(' • ')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.screen}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* CALENDRIER */}
        {calendarItems.length >
        0 ? (
          <View
            style={
              styles.calendarSection
            }
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.calendarRow
              }
            >
              {calendarItems.map(
                (item) => {
                  if (
                    item.type ===
                    'gap'
                  ) {
                    return (
                      <View
                        key={
                          item.key
                        }
                        style={
                          styles.calendarGap
                        }
                      >
                        <Text
                          style={
                            styles.calendarGapText
                          }
                        >
                          …
                        </Text>
                      </View>
                    )
                  }

                  const selected =
                    selectedDate ===
                    item.date

                  return (
                    <Pressable
                      key={
                        item.date
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.dayButton,

                        selected &&
                          styles.dayButtonSelected,

                        pressed &&
                          styles.buttonPressed,
                      ]}
                      onPress={() =>
                        setSelectedDate(
                          item.date
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.dayName,

                          selected &&
                            styles.dayTextSelected,
                        ]}
                      >
                        {formatDayName(
                          item.date
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.dayNumber,

                          selected &&
                            styles.dayTextSelected,
                        ]}
                      >
                        {formatDayNumber(
                          item.date
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.dayMonth,

                          selected &&
                            styles.dayTextSelected,
                        ]}
                      >
                        {formatMonth(
                          item.date
                        )}
                      </Text>
                    </Pressable>
                  )
                }
              )}
            </ScrollView>
          </View>
        ) : null}

        {/* FILMS DU JOUR */}
        {moviesForDay.length ===
        0 ? (
          <EmptyState
            icon="🎬"
            title="AUCUNE SÉANCE"
            description="Aucune séance prévue pour cette journée."
          />
        ) : (
          moviesForDay.map(
            ({
              movie,
              sessions,
            }) => {
              /*
                Chaque film est lui-même
                regroupé par :
                version + projection.
              */

              const categories =
                new Map<
                  string,
                  CinemaSessionRow[]
                >()

              for (
                const session of
                sessions
              ) {
                const category =
                  getSessionCategory(
                    session
                  )

                const existing =
                  categories.get(
                    category
                  )

                if (existing) {
                  existing.push(
                    session
                  )
                } else {
                  categories.set(
                    category,
                    [session]
                  )
                }
              }

              const posterUrl = getPosterUrl(movie.poster_path)

              return (
                <View
                  key={movie.id}
                  style={
                    styles.movieBlock
                  }
                >
                  {/* FILM */}
                  <Pressable
                    style={({ pressed }) => [
                        styles.movieHeader,
                        pressed &&
                        styles.movieHeaderPressed,
                    ]}
                    onPress={() =>
                        navigation.navigate('Movie', {
                        movieId: movie.id,
                        })
                    }
                    >
                    {posterUrl ? (
                      <Image
                        source={{
                          uri: posterUrl,
                        }}
                        style={styles.moviePoster}
                        resizeMode="cover"
                      />
                    ) : (
                        <View
                        style={
                            styles.moviePosterPlaceholder
                        }
                        >
                        <MaterialIcons
                            name="movie"
                            size={24}
                            color={COLORS.icon}
                        />
                        </View>
                    )}

                    <View style={styles.movieInfo}>
                        <Text
                        style={styles.movieTitle}
                        numberOfLines={2}
                        >
                        {movie.title}
                        </Text>

                        {movie.movie_people
                        .filter(
                            (item) =>
                            item.role_type ===
                            'director'
                        )
                        .map(
                            (item) =>
                            item.person?.name
                        )
                        .filter(Boolean)
                        .length > 0 && (
                        <Text
                            style={
                            styles.movieDirector
                            }
                            numberOfLines={1}
                        >
                            {movie.movie_people
                            .filter(
                                (item) =>
                                item.role_type ===
                                'director'
                            )
                            .map(
                                (item) =>
                                item.person?.name
                            )
                            .filter(Boolean)
                            .join(', ')}
                        </Text>
                        )}

                        {movie.release_date && (
                        <Text
                            style={styles.movieDate}
                        >
                            {new Date(
                            `${movie.release_date}T12:00:00`
                            ).getFullYear()}
                        </Text>
                        )}
                    </View>

                    <MaterialIcons
                        name="chevron-right"
                        size={22}
                        color={COLORS.icon}
                    />
                  </Pressable>

                  {/* CATÉGORIES */}
                  {Array.from(
                    categories.entries()
                  ).map(
                    ([
                      category,
                      categorySessions,
                    ]) => (
                      <View
                        key={
                          category
                        }
                        style={
                          styles.sessionCategory
                        }
                      >
                        <Text
                          style={
                            styles.categoryTitle
                          }
                        >
                          {category.toUpperCase()}
                        </Text>

                        <View
                          style={
                            styles.timesRow
                          }
                        >
                          {categorySessions.map(
                            (
                              session
                            ) => (
                              <Pressable
                                key={
                                  session.id
                                }
                                disabled={
                                  !session.booking_url
                                }
                                style={({
                                  pressed,
                                }) => [
                                  styles.timeButton,

                                  !session.booking_url &&
                                    styles.timeButtonDisabled,

                                  pressed &&
                                    session.booking_url &&
                                    styles.buttonPressed,
                                ]}
                                onPress={() =>
                                  openBooking(
                                    session.booking_url
                                  )
                                }
                              >
                                <Text
                                  style={
                                    styles.timeText
                                  }
                                >
                                  {formatTime(
                                    session.starts_at
                                  )}
                                </Text>
                              </Pressable>
                            )
                          )}
                        </View>
                      </View>
                    )
                  )}
                </View>
              )
            }
          )
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // ── LAYOUT ───────────────────────────

  root: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },

  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingBottom: 30,
  },

  // ── HEADER ───────────────────────────

  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.primary,

    borderBottomWidth: 3,
    borderBottomColor: COLORS.contours,
  },

  backButton: {
    width: 40,
    height: 40,

    flexShrink: 0,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
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

  headerContent: {
    flex: 1,
    minWidth: 0,

    marginLeft: 12,
  },

  cinemaName: {
    color: COLORS.text1,

    fontSize: 15,
    fontWeight: '900',

    lineHeight: 18,
    letterSpacing: 0.4,
  },

  cinemaLocation: {
    marginTop: 4,

    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '700',

    lineHeight: 12,
  },

  // ── CALENDAR ─────────────────────────

  calendarSection: {
    paddingVertical: 14,

    backgroundColor: COLORS.secondary,

    borderBottomWidth: 3,
    borderBottomColor: COLORS.contours,
  },

  calendarRow: {
    paddingHorizontal: 16,

    alignItems: 'center',

    gap: 8,
  },

  dayButton: {
    width: 58,
    height: 68,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.secondary,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 10,
  },

  dayButtonSelected: {
    backgroundColor: COLORS.primary,
    borderWidth: 3,
  },

  dayName: {
    color: COLORS.text2,

    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  dayNumber: {
    marginVertical: 2,

    color: COLORS.text1,

    fontSize: 19,
    fontWeight: '900',
  },

  dayMonth: {
    color: COLORS.text2,

    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  dayTextSelected: {
    color: COLORS.text1,
  },

  calendarGap: {
    width: 25,
    height: 68,

    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarGapText: {
    color: COLORS.text2,

    fontSize: 22,
    fontWeight: '900',
  },

  // ── MOVIES ───────────────────────────

  movieBlock: {
    marginHorizontal: 16,
    marginTop: 16,

    overflow: 'hidden',

    backgroundColor: COLORS.secondary,

    borderWidth: 3,
    borderColor: COLORS.contours,
    borderRadius: 14,
  },

  movieHeader: {
    minHeight: 102,

    paddingHorizontal: 12,
    paddingVertical: 9,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: COLORS.secondary,

    borderBottomWidth: 2,
    borderBottomColor: COLORS.contours,
  },

  movieHeaderPressed: {
    opacity: 0.7,
  },

  moviePoster: {
    width: 55,
    height: 82,

    marginRight: 13,

    backgroundColor: COLORS.background,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 7,
  },

  moviePosterPlaceholder: {
    width: 55,
    height: 82,

    marginRight: 13,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.background,

    borderWidth: 2,
    borderColor: COLORS.contours,
    borderRadius: 7,
  },

  movieInfo: {
    flex: 1,
    minWidth: 0,

    alignSelf: 'stretch',
    justifyContent: 'flex-start',

    paddingTop: 3,
    marginRight: 8,
  },

  movieTitle: {
    minWidth: 0,

    marginRight: 8,

    color: COLORS.text1,

    fontSize: 12,
    fontWeight: '900',
    lineHeight: 15,
  },

  movieDirector: {
    marginTop: 5,

    color: COLORS.text2,

    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },

  movieDate: {
    marginTop: 2,

    color: COLORS.text2,

    fontSize: 9,
    fontWeight: '800',
  },

  // ── SESSION CATEGORY ─────────────────

  sessionCategory: {
    paddingHorizontal: 12,
    paddingVertical: 11,

    borderBottomWidth: 1,
    borderBottomColor: COLORS.contours,
  },

  categoryTitle: {
    marginBottom: 8,

    color: COLORS.text2,

    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 8,
  },

  // ── TIME BUTTONS ─────────────────────

  timeButton: {
    minWidth: 58,
    height: 34,

    paddingHorizontal: 9,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 2,
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

  timeButtonDisabled: {
    opacity: 0.45,
    backgroundColor: COLORS.background,
  },

  timeText: {
    color: COLORS.text1,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  buttonPressed: {
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

    elevation: 1,
    opacity: 0.75,
  },

  // ── NOT FOUND ────────────────────────

  notFound: {
    flex: 1,

    alignItems: 'center',
    justifyContent: 'center',

    padding: 24,

    backgroundColor: COLORS.background,
  },

  notFoundText: {
    color: COLORS.text1,

    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  backSimpleButton: {
    height: 42,

    marginTop: 18,
    paddingHorizontal: 18,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: COLORS.primary,

    borderWidth: 2,
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

  backSimpleText: {
    color: COLORS.text1,

    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
})