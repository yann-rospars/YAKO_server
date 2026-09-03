import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  FlatList,
  Image,
  Modal,
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
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native'

import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated'

import { supabase } from '../lib/supabase'
import { COLORS } from '../theme/colors'
import LoadingState from '../components/LoadingState'

/*
  ----------------------------------
  TYPES CALENDRIER
  ----------------------------------
*/

type SessionDayRow = {
  day: string
}

type CalendarDay = {
  date: Date
  dateKey: string
  dayNumber: number
  hasSessions: boolean
  isAfterLastSession: boolean
}

type CalendarCell =
  | CalendarDay
  | null

type CalendarMonth = {
  key: string
  label: string
  weeks: CalendarCell[][]
}

/*
  ----------------------------------
  TYPES FILMS DU JOUR
  ----------------------------------
*/

type CalendarMovie = {
  movie_id: number
  title: string
  poster_path: string | null
  release_date: string | null
  popularity: number | null
  category:
    | 'reissue'
    | 'current'

  original_times:
    | string[]
    | null

  dubbed_times:
    | string[]
    | null

  local_times:
    | string[]
    | null
}

/*
  ----------------------------------
  CONSTANTES
  ----------------------------------
*/

const WEEK_DAYS = [
  'L',
  'M',
  'M',
  'J',
  'V',
  'S',
  'D',
]

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

const ALL_ARRONDISSEMENTS = [
  1, 2, 3, 4, 5,
  6, 7, 8, 9, 10,
  11, 12, 13, 14, 15,
  16, 17, 18, 19, 20,
]

const RIVE_GAUCHE = [
  5,
  6,
  7,
  13,
  14,
  15,
]

const RIVE_DROITE = [
  1,
  2,
  3,
  4,
  8,
  9,
  10,
  11,
  12,
  16,
  17,
  18,
  19,
  20,
]

/*
  ----------------------------------
  OUTILS DATE
  ----------------------------------
*/

const startOfDay = (
  date: Date
) => {
  const result =
    new Date(date)

  result.setHours(
    0,
    0,
    0,
    0
  )

  return result
}

const dateToKey = (
  date: Date
) => {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    )

  return `${year}-${month}-${day}`
}

const keyToDate = (
  dateKey: string
) => {
  const [
    year,
    month,
    day,
  ] = dateKey
    .split('-')
    .map(Number)

  return new Date(
    year,
    month - 1,
    day
  )
}

const getMondayIndex = (
  date: Date
) => {
  return (
    date.getDay() + 6
  ) % 7
}

const isSameDay = (
  firstDate: Date,
  secondDate: Date
) =>
  firstDate.getFullYear() ===
    secondDate.getFullYear() &&
  firstDate.getMonth() ===
    secondDate.getMonth() &&
  firstDate.getDate() ===
    secondDate.getDate()

/*
  ----------------------------------
  OUTILS POSTER
  ----------------------------------
*/

const getPosterUrl = (
  posterPath:
    | string
    | null
) => {
  if (!posterPath) {
    return null
  }

  if (
    posterPath.startsWith(
      'http://'
    ) ||
    posterPath.startsWith(
      'https://'
    )
  ) {
    return posterPath
  }

  if (
    posterPath.startsWith(
      '/img'
    )
  ) {
    return (
      'https://fr.web.img6.acsta.net' +
      posterPath
    )
  }

  return (
    'https://image.tmdb.org/t/p/w342' +
    posterPath
  )
}

/*
  ----------------------------------
  OUTILS FILTRES
  ----------------------------------
*/

const arraysEqual = (
  first: number[],
  second: number[]
) => {
  if (
    first.length !==
    second.length
  ) {
    return false
  }

  return first.every(
    (value) =>
      second.includes(value)
  )
}

export default function CalendarScreen() {
  const navigation =
    useNavigation<any>()

  /*
    ----------------------------------
    CALENDRIER
    ----------------------------------
  */

  const [
    sessionDays,
    setSessionDays,
  ] = useState<
    SessionDayRow[]
  >([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  /*
    ----------------------------------
    JOUR SÉLECTIONNÉ
    ----------------------------------
  */

  const [
    selectedDate,
    setSelectedDate,
  ] = useState<
    string | null
  >(null)

  /*
    ----------------------------------
    FILMS DU JOUR
    ----------------------------------
  */

  const [
    dayMovies,
    setDayMovies,
  ] = useState<
    CalendarMovie[]
  >([])

  const [
    dayLoading,
    setDayLoading,
  ] = useState(false)

  /*
    ----------------------------------
    FILTRE ARRONDISSEMENTS
    ----------------------------------
  */

  const [
    selectedArrondissements,
    setSelectedArrondissements,
  ] = useState<number[]>(
    ALL_ARRONDISSEMENTS
  )

  const [
    arrondissementModalVisible,
    setArrondissementModalVisible,
  ] = useState(false)

  /*
    ----------------------------------
    SECTIONS REPLIABLES
    ----------------------------------
  */

  const [
    reissuesExpanded,
    setReissuesExpanded,
  ] = useState(true)

  const [
    currentExpanded,
    setCurrentExpanded,
  ] = useState(true)

  /*
    ----------------------------------
    ANIMATION / SCROLL CALENDRIER
    ----------------------------------
  */

  const scrollViewRef =
    useRef<ScrollView>(null)

  const currentScrollY =
    useRef(0)

  const calendarScrollY =
    useRef(0)

  /*
    ----------------------------------
    CHARGEMENT JOURS
    ----------------------------------
  */

  const fetchSessionDays =
    useCallback(async () => {
      setLoading(true)

      const {
        data,
        error,
      } = await supabase
        .rpc(
          'get_session_days'
        )

      if (error) {
        console.error(
          'Erreur récupération jours :',
          error
        )

        setSessionDays([])
        setLoading(false)

        return
      }

      setSessionDays(
        (data ?? []) as
          SessionDayRow[]
      )

      setLoading(false)
    }, [])

  useFocusEffect(
    useCallback(() => {
      fetchSessionDays()
    }, [
      fetchSessionDays,
    ])
  )

  /*
    ----------------------------------
    CHARGEMENT FILMS DU JOUR
    ----------------------------------
  */

  const fetchDayMovies =
    useCallback(
      async (
        dateKey: string,
        arrondissements:
          number[]
      ) => {
        setDayLoading(true)

        const allSelected =
          arraysEqual(
            arrondissements,
            ALL_ARRONDISSEMENTS
          )

        const {
          data,
          error,
        } = await supabase
          .rpc(
            'get_calendar_movies',
            {
              p_day:
                dateKey,

              p_arrondissements:
                allSelected
                  ? null
                  : arrondissements,
            }
          )

        if (error) {
          console.error(
            'Erreur récupération films du jour :',
            error
          )

          setDayMovies([])
          setDayLoading(false)

          return
        }

        setDayMovies(
          (data ?? []) as
            CalendarMovie[]
        )

        setDayLoading(false)
      },
      []
    )

  useEffect(() => {
    if (!selectedDate) {
      return
    }

    fetchDayMovies(
      selectedDate,
      selectedArrondissements
    )
  }, [
    selectedDate,
    selectedArrondissements,
    fetchDayMovies,
  ])

  /*
    ----------------------------------
    DATES AVEC SÉANCES
    ----------------------------------
  */

  const sessionDates =
    useMemo(() => {
      return new Set(
        sessionDays.map(
          (sessionDay) =>
            sessionDay.day
        )
      )
    }, [
      sessionDays,
    ])

  /*
    ----------------------------------
    CONSTRUCTION CALENDRIER
    ----------------------------------
  */

  const months =
    useMemo<
      CalendarMonth[]
    >(() => {
      if (
        sessionDays.length ===
        0
      ) {
        return []
      }

      const today =
        startOfDay(
          new Date()
        )

      const lastSessionDay =
        sessionDays[
          sessionDays.length - 1
        ].day

      const lastSessionDate =
        keyToDate(
          lastSessionDay
        )

      const result:
        CalendarMonth[] = []

      let currentMonth =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )

      const finalMonth =
        new Date(
          lastSessionDate.getFullYear(),
          lastSessionDate.getMonth(),
          1
        )

      while (
        currentMonth <=
        finalMonth
      ) {
        const year =
          currentMonth.getFullYear()

        const month =
          currentMonth.getMonth()

        const firstDay =
          new Date(
            year,
            month,
            1
          )

        const lastDay =
          new Date(
            year,
            month + 1,
            0
          )

        const cells:
          CalendarCell[] = []

        const leadingEmptyCells =
          getMondayIndex(
            firstDay
          )

        for (
          let index = 0;
          index <
          leadingEmptyCells;
          index++
        ) {
          cells.push(null)
        }

        for (
          let day = 1;
          day <=
          lastDay.getDate();
          day++
        ) {
          const date =
            new Date(
              year,
              month,
              day
            )

          if (
            date < today
          ) {
            cells.push(null)
            continue
          }

          const dateKey =
            dateToKey(date)

          cells.push({
            date,
            dateKey,
            dayNumber: day,

            hasSessions:
              sessionDates.has(
                dateKey
              ),

            isAfterLastSession:
              date >
              lastSessionDate,
          })
        }

        while (
          cells.length % 7 !==
          0
        ) {
          cells.push(null)
        }

        const weeks:
          CalendarCell[][] = []

        for (
          let index = 0;
          index <
          cells.length;
          index += 7
        ) {
          weeks.push(
            cells.slice(
              index,
              index + 7
            )
          )
        }

        result.push({
          key:
            `${year}-${month}`,

          label:
            MONTH_NAMES[
              month
            ],

          weeks,
        })

        currentMonth =
          new Date(
            year,
            month + 1,
            1
          )
      }

      return result
    }, [
      sessionDays,
      sessionDates,
    ])

  /*
    ----------------------------------
    SEMAINE SÉLECTIONNÉE
    ----------------------------------
  */

  const selectedCalendarLocation =
    useMemo(() => {
      if (!selectedDate) {
        return null
      }

      for (const month of months) {
        const weekIndex =
          month.weeks.findIndex(
            (week) =>
              week.some(
                (day) =>
                  day?.dateKey ===
                  selectedDate
              )
          )

        if (weekIndex !== -1) {
          return {
            monthKey: month.key,
            weekIndex,
          }
        }
      }

      return null
    }, [
      months,
      selectedDate,
    ])

  const dayMode =
    selectedDate !== null &&
    selectedCalendarLocation !== null

  /*
    ----------------------------------
    FILMS
    ----------------------------------
  */

  const reissueMovies =
    useMemo(
      () =>
        dayMovies.filter(
          (movie) =>
            movie.category ===
            'reissue'
        ),
      [
        dayMovies,
      ]
    )

  const currentMovies =
    useMemo(
      () =>
        dayMovies.filter(
          (movie) =>
            movie.category ===
            'current'
        ),
      [
        dayMovies,
      ]
    )

  /*
    ----------------------------------
    ÉTATS FILTRE
    ----------------------------------
  */

  const allSelected =
    arraysEqual(
      selectedArrondissements,
      ALL_ARRONDISSEMENTS
    )

  const rightBankSelected =
    arraysEqual(
      selectedArrondissements,
      RIVE_DROITE
    )

  const leftBankSelected =
    arraysEqual(
      selectedArrondissements,
      RIVE_GAUCHE
    )

  const arrondissementFilterLabel =
    useMemo(() => {
      if (allSelected) {
        return 'TOUS LES ARRONDISSEMENTS'
      }

      if (rightBankSelected) {
        return 'RIVE DROITE'
      }

      if (leftBankSelected) {
        return 'RIVE GAUCHE'
      }

      if (
        selectedArrondissements.length ===
        0
      ) {
        return 'AUCUN ARRONDISSEMENT'
      }

      return `${selectedArrondissements.length} ARRONDISSEMENT${
        selectedArrondissements.length >
        1
          ? 'S'
          : ''
      }`
    }, [
      allSelected,
      rightBankSelected,
      leftBankSelected,
      selectedArrondissements,
    ])

  /*
    ----------------------------------
    JOUR
    ----------------------------------
  */

  const handleDayPress = (
    day: CalendarDay
  ) => {
    if (!selectedDate) {
      calendarScrollY.current =
        currentScrollY.current
    }

    setSelectedDate(
      day.dateKey
    )

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      })
    })
  }

  const handleBackToCalendar =
    () => {
      setSelectedDate(null)
      setDayMovies([])

      requestAnimationFrame(() => {
        scrollViewRef.current?.scrollTo({
          y: calendarScrollY.current,
          animated: true,
        })
      })
    }

  /*
    ----------------------------------
    FILTRES
    ----------------------------------
  */

  const selectAll =
    () => {
      if (allSelected) {
        setSelectedArrondissements(
          []
        )

        return
      }

      setSelectedArrondissements(
        ALL_ARRONDISSEMENTS
      )
    }

  const selectRightBank =
    () => {
      if (rightBankSelected) {
        setSelectedArrondissements(
          []
        )

        return
      }

      setSelectedArrondissements(
        RIVE_DROITE
      )
    }

  const selectLeftBank =
    () => {
      if (leftBankSelected) {
        setSelectedArrondissements(
          []
        )

        return
      }

      setSelectedArrondissements(
        RIVE_GAUCHE
      )
    }

  const toggleArrondissement =
    (
      arrondissement: number
    ) => {
      setSelectedArrondissements(
        (current) => {
          /*
            Si TOUT était actif,
            on repart de zéro.
          */

          if (
            arraysEqual(
              current,
              ALL_ARRONDISSEMENTS
            )
          ) {
            return [
              arrondissement,
            ]
          }

          /*
            Toggle classique.
          */

          if (
            current.includes(
              arrondissement
            )
          ) {
            return current.filter(
              (value) =>
                value !==
                arrondissement
            )
          }

          const next = [
            ...current,
            arrondissement,
          ].sort(
            (a, b) =>
              a - b
          )

          /*
            Si les 20 sont cochés
            individuellement, on repasse
            automatiquement sur TOUT.
          */

          if (
            next.length ===
            ALL_ARRONDISSEMENTS.length
          ) {
            return (
              ALL_ARRONDISSEMENTS
            )
          }

          return next
        }
      )
    }

  /*
    ----------------------------------
    FILM
    ----------------------------------
  */

  const handleMoviePress =
    (
      movieId: number
    ) => {
      navigation.navigate(
        'Movie',
        {
          movieId,
        }
      )
    }

  /*
    ----------------------------------
    HORAIRES
    ----------------------------------
  */

  const renderTimes = (
    label: string,
    times:
      | string[]
      | null
  ) => {
    if (
      !times ||
      times.length === 0
    ) {
      return null
    }

    return (
      <View
        style={
          styles.timesSection
        }
      >
        <Text
          style={
            styles.versionLabel
          }
        >
          {label}
        </Text>

        <View
          style={
            styles.timesContainer
          }
        >
          {times.map(
            (time) => (
              <View
                key={
                  `${label}-${time}`
                }
                style={
                  styles.timeBadge
                }
              >
                <Text
                  style={
                    styles.timeText
                  }
                >
                  {time}
                </Text>
              </View>
            )
          )}
        </View>
      </View>
    )
  }

  /*
    ----------------------------------
    FILM
    ----------------------------------
  */

  const renderMovie = (
    movie:
      CalendarMovie
  ) => {
    const posterUrl =
      getPosterUrl(
        movie.poster_path
      )

    return (
      <Pressable
        key={
          movie.movie_id
        }
        onPress={() =>
          handleMoviePress(
            movie.movie_id
          )
        }
        style={({ pressed }) => [
          styles.movieCard,

          pressed &&
            styles.movieCardPressed,
        ]}
      >
        <View
          style={
            styles.posterContainer
          }
        >
          {posterUrl ? (
            <Image
              source={{
                uri: posterUrl,
              }}
              style={
                styles.poster
              }
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
                  styles.posterPlaceholderText
                }
              >
                ?
              </Text>
            </View>
          )}
        </View>

        <View
          style={
            styles.movieInfo
          }
        >
          <Text
            style={
              styles.movieTitle
            }
            numberOfLines={
              2
            }
          >
            {movie.title}
          </Text>

          {renderTimes(
            'VO',
            movie.original_times
          )}

          {renderTimes(
            'VF',
            movie.dubbed_times
          )}

          {renderTimes(
            'LOCAL',
            movie.local_times
          )}
        </View>
      </Pressable>
    )
  }

  /*
    ----------------------------------
    SECTION FILMS
    ----------------------------------
  */

  const renderMovieSection = (
    title: string,
    movies: CalendarMovie[],
    expanded: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.movieSection}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [
          styles.movieSectionHeader,
          pressed &&
            styles.sectionHeaderPressed,
        ]}
      >
        <View
          style={
            styles.movieSectionTitleContainer
          }
        >
          <Text
            style={
              styles.movieSectionTitle
            }
          >
            {title}
          </Text>

          <Text
            style={
              styles.movieSectionCount
            }
          >
            {movies.length}
          </Text>
        </View>

        <Text style={styles.chevron}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      {expanded && (
        <View
          style={
            styles.moviesContainer
          }
        >
          {movies.length === 0 ? (
            <Text
              style={
                styles.noMoviesText
              }
            >
              Aucun film
            </Text>
          ) : (
            movies.map(renderMovie)
          )}
        </View>
      )}
    </View>
  )

  /*
    ----------------------------------
    LOADING
    ----------------------------------
  */

  if (loading) {
    return (
      <SafeAreaView
        style={
          styles.root
        }
        edges={[
          'top',
        ]}
      >
        <View
          style={
            styles.header
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            CALENDRIER
          </Text>
        </View>

        <LoadingState fullScreen />
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
      style={
        styles.root
      }
      edges={[
        'top',
      ]}
    >
      <View
        style={
          styles.header
        }
      >
        <Text
          style={
            styles.headerTitle
          }
        >
          CALENDRIER
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={
          styles.scrollView
        }
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
        onScroll={(event) => {
          currentScrollY.current =
            event.nativeEvent.contentOffset.y
        }}
        scrollEventThrottle={16}
      >
        {months.length ===
        0 ? (
          <View
            style={
              styles.emptyContainer
            }
          >
            <Text
              style={
                styles.emptyTitle
              }
            >
              AUCUNE SÉANCE
            </Text>

            <Text
              style={
                styles.emptyDescription
              }
            >
              Aucune séance à venir
              n'est disponible.
            </Text>
          </View>
        ) : (
          <Animated.View
            layout={
              LinearTransition
                .duration(320)
            }
          >
            {dayMode &&
              selectedDate && (
                <Animated.View
                  entering={
                    FadeIn.duration(220)
                  }
                  exiting={
                    FadeOut.duration(140)
                  }
                  layout={
                    LinearTransition
                      .duration(320)
                  }
                  style={
                    styles.dayModeHeader
                  }
                >
                  <Pressable
                    onPress={
                      handleBackToCalendar
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.dayModeBackButton,
                      pressed &&
                        styles.dayModeBackButtonPressed,
                    ]}
                  >
                    <MaterialIcons
                      name="arrow-back"
                      size={20}
                      color={
                        COLORS.return
                      }
                    />
                  </Pressable>

                  <Text
                    style={
                      styles.dayModeMonth
                    }
                  >
                    {selectedDate
                      ? MONTH_NAMES[
                          keyToDate(
                            selectedDate
                          ).getMonth()
                        ]
                      : ''}
                  </Text>

                  <Text
                    style={
                      styles.dayModeDate
                    }
                    numberOfLines={1}
                  >
                    {keyToDate(
                      selectedDate
                    ).toLocaleDateString(
                      'fr-FR',
                      {
                        weekday:
                          'long',
                        day:
                          'numeric',
                        month:
                          'long',
                      }
                    )}
                  </Text>
                </Animated.View>
              )}

            {months.map(
              (month) => {
                const monthSelected =
                  dayMode &&
                  selectedCalendarLocation?.monthKey ===
                    month.key

                if (
                  dayMode &&
                  !monthSelected
                ) {
                  return null
                }

                return (
                  <Animated.View
                    key={
                      month.key
                    }
                    layout={
                      LinearTransition
                        .duration(320)
                    }
                    entering={
                      FadeIn.duration(220)
                    }
                    exiting={
                      FadeOut.duration(180)
                    }
                    style={[
                      styles.monthSection,
                      dayMode &&
                        styles.monthSectionDayMode,
                    ]}
                  >
                    {!dayMode && (
                      <Animated.View
                        entering={
                          FadeIn.duration(220)
                        }
                        exiting={
                          FadeOut.duration(140)
                        }
                        style={
                          styles.monthHeader
                        }
                      >
                        <Text
                          style={
                            styles.monthTitle
                          }
                        >
                          {
                            month.label
                          }
                        </Text>
                      </Animated.View>
                    )}

                    <Animated.View
                      layout={
                        LinearTransition
                          .duration(320)
                      }
                      style={
                        styles.weekHeader
                      }
                    >
                      {WEEK_DAYS.map(
                        (
                          day,
                          index
                        ) => (
                          <View
                            key={
                              `${month.key}-header-${index}`
                            }
                            style={
                              styles.weekDayCell
                            }
                          >
                            <Text
                              style={
                                styles.weekDayText
                              }
                            >
                              {day}
                            </Text>
                          </View>
                        )
                      )}
                    </Animated.View>

                    <Animated.View
                      layout={
                        LinearTransition
                          .duration(320)
                      }
                      style={
                        styles.weeksContainer
                      }
                    >
                      {month.weeks.map(
                        (
                          week,
                          weekIndex
                        ) => {
                          const weekSelected =
                            monthSelected &&
                            selectedCalendarLocation?.weekIndex ===
                              weekIndex

                          if (
                            dayMode &&
                            !weekSelected
                          ) {
                            return null
                          }

                          return (
                            <Animated.View
                              key={
                                `${month.key}-week-${weekIndex}`
                              }
                              layout={
                                LinearTransition
                                  .duration(320)
                              }
                              entering={
                                FadeIn.duration(220)
                              }
                              exiting={
                                FadeOut.duration(160)
                              }
                              style={
                                styles.weekRow
                              }
                            >
                              {week.map(
                                (
                                  day,
                                  dayIndex
                                ) => {
                                  if (!day) {
                                    return (
                                      <View
                                        key={
                                          `empty-${weekIndex}-${dayIndex}`
                                        }
                                        style={
                                          styles.dayColumn
                                        }
                                      />
                                    )
                                  }

                                  const today =
                                    isSameDay(
                                      day.date,
                                      new Date()
                                    )

                                  const selected =
                                    selectedDate ===
                                    day.dateKey

                                  return (
                                    <View
                                      key={
                                        day.dateKey
                                      }
                                      style={
                                        styles.dayColumn
                                      }
                                    >
                                      <Pressable
                                        disabled={
                                          day.isAfterLastSession
                                        }
                                        onPress={() =>
                                          handleDayPress(
                                            day
                                          )
                                        }
                                        style={({
                                          pressed,
                                        }) => [
                                          styles.dayButton,

                                          day.hasSessions &&
                                            styles.dayButtonWithSessions,

                                          selected &&
                                            styles.dayButtonSelected,

                                          day.isAfterLastSession &&
                                            styles.dayButtonDisabled,

                                          today &&
                                            styles.todayButton,

                                          day.hasSessions &&
                                            pressed &&
                                            styles.dayButtonPressed,
                                        ]}
                                      >
                                        <Text
                                          style={[
                                            styles.dayNumber,

                                            day.hasSessions &&
                                              styles.dayNumberWithSessions,

                                            day.isAfterLastSession &&
                                              styles.dayNumberDisabled,
                                          ]}
                                        >
                                          {
                                            day.dayNumber
                                          }
                                        </Text>

                                        {day.hasSessions && (
                                          <View
                                            style={
                                              styles.sessionIndicator
                                            }
                                          />
                                        )}
                                      </Pressable>
                                    </View>
                                  )
                                }
                              )}
                            </Animated.View>
                          )
                        }
                      )}
                    </Animated.View>
                  </Animated.View>
                )
              }
            )}
          </Animated.View>
        )}

        {dayMode &&
          selectedDate && (
            <Animated.View
              entering={
                FadeIn
                  .delay(90)
                  .duration(240)
              }
              exiting={
                FadeOut.duration(140)
              }
              layout={
                LinearTransition
                  .duration(320)
              }
              style={
                styles.dayDetail
              }
            >
              <Pressable
                onPress={() =>
                  setArrondissementModalVisible(
                    true
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.arrondissementSelector,

                  pressed &&
                    styles.filterPressed,
                ]}
              >
                <View
                  style={
                    styles.arrondissementSelectorContent
                  }
                >
                  <Text
                    style={
                      styles.arrondissementSelectorText
                    }
                    numberOfLines={1}
                  >
                    {
                      arrondissementFilterLabel
                    }
                  </Text>

                  <MaterialIcons
                    name="keyboard-arrow-down"
                    size={18}
                    color={
                      COLORS.icon
                    }
                  />
                </View>
              </Pressable>

              {dayLoading ? (
                <LoadingState />
              ) : (
                <>
                  {renderMovieSection(
                    'Les films qui ressortent',
                    reissueMovies,
                    reissuesExpanded,
                    () =>
                      setReissuesExpanded(
                        (
                          current
                        ) =>
                          !current
                      )
                  )}

                  {renderMovieSection(
                    'Toujours au cinéma',
                    currentMovies,
                    currentExpanded,
                    () =>
                      setCurrentExpanded(
                        (
                          current
                        ) =>
                          !current
                      )
                  )}
                </>
              )}
            </Animated.View>
          )}
      </ScrollView>
      {/* MODAL ARRONDISSEMENTS */}

      <Modal
        visible={
          arrondissementModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setArrondissementModalVisible(
            false
          )
        }
      >
        <View
          style={
            styles.arrondissementModalOverlay
          }
        >
          <Pressable
            style={
              StyleSheet.absoluteFill
            }
            onPress={() =>
              setArrondissementModalVisible(
                false
              )
            }
          />

          <View
            style={
              styles.arrondissementModalBox
            }
          >
            <View
              style={
                styles.arrondissementModalHeader
              }
            >
              <Text
                style={
                  styles.arrondissementModalTitle
                }
              >
                ARRONDISSEMENTS
              </Text>

              <Pressable
                onPress={() =>
                  setArrondissementModalVisible(
                    false
                  )
                }
                style={({
                  pressed,
                }) => [
                  styles.arrondissementModalClose,

                  pressed &&
                    styles.filterPressed,
                ]}
              >
                <Text
                  style={
                    styles.arrondissementModalCloseText
                  }
                >
                  ×
                </Text>
              </Pressable>
            </View>

            {/* TOUT */}

            <Pressable
              style={[
                styles.arrondissementRow,

                allSelected &&
                  styles.arrondissementRowSelected,
              ]}
              onPress={
                selectAll
              }
            >
              <Text
                style={
                  styles.arrondissementRowText
                }
              >
                TOUS LES ARRONDISSEMENTS
              </Text>

              <View
                style={[
                  styles.arrondissementCheckbox,

                  allSelected &&
                    styles.arrondissementCheckboxSelected,
                ]}
              >
                {allSelected && (
                  <Text
                    style={
                      styles.arrondissementCheckboxCheck
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>
            </Pressable>

            {/* RIVE DROITE */}

            <Pressable
              style={[
                styles.arrondissementRow,

                rightBankSelected &&
                  styles.arrondissementRowSelected,
              ]}
              onPress={
                selectRightBank
              }
            >
              <Text
                style={
                  styles.arrondissementRowText
                }
              >
                RIVE DROITE
              </Text>

              <View
                style={[
                  styles.arrondissementCheckbox,

                  rightBankSelected &&
                    styles.arrondissementCheckboxSelected,
                ]}
              >
                {rightBankSelected && (
                  <Text
                    style={
                      styles.arrondissementCheckboxCheck
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>
            </Pressable>

            {/* RIVE GAUCHE */}

            <Pressable
              style={[
                styles.arrondissementRow,

                leftBankSelected &&
                  styles.arrondissementRowSelected,
              ]}
              onPress={
                selectLeftBank
              }
            >
              <Text
                style={
                  styles.arrondissementRowText
                }
              >
                RIVE GAUCHE
              </Text>

              <View
                style={[
                  styles.arrondissementCheckbox,

                  leftBankSelected &&
                    styles.arrondissementCheckboxSelected,
                ]}
              >
                {leftBankSelected && (
                  <Text
                    style={
                      styles.arrondissementCheckboxCheck
                    }
                  >
                    ✓
                  </Text>
                )}
              </View>
            </Pressable>

            {/* SÉPARATION */}

            <View
              style={
                styles.arrondissementSeparator
              }
            />

            {/* ARRONDISSEMENTS */}

            <FlatList
              data={
                ALL_ARRONDISSEMENTS
              }
              keyExtractor={(
                item
              ) =>
                String(
                  item
                )
              }
              showsVerticalScrollIndicator={
                false
              }
              style={
                styles.arrondissementList
              }
              renderItem={({
                item,
              }) => {
                /*
                  Si TOUT est actif,
                  les arrondissements
                  restent visuellement
                  décochés.
                */

                const selected =
                  !allSelected &&
                  selectedArrondissements.includes(
                    item
                  )

                return (
                  <Pressable
                    style={[
                      styles.arrondissementRow,

                      selected &&
                        styles.arrondissementRowSelected,
                    ]}
                    onPress={() =>
                      toggleArrondissement(
                        item
                      )
                    }
                  >
                    <Text
                      style={
                        styles.arrondissementRowText
                      }
                    >
                      {item === 1
                        ? '1ER ARRONDISSEMENT'
                        : `${item}E ARRONDISSEMENT`}
                    </Text>

                    <View
                      style={[
                        styles.arrondissementCheckbox,

                        selected &&
                          styles.arrondissementCheckboxSelected,
                      ]}
                    >
                      {selected && (
                        <Text
                          style={
                            styles.arrondissementCheckboxCheck
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

const styles =
  StyleSheet.create({
    /*
      ----------------------------------
      LAYOUT
      ----------------------------------
    */

    root: {
      flex: 1,
      backgroundColor:
        COLORS.primary,
    },

    scrollView: {
      flex: 1,
      backgroundColor:
        COLORS.background,
    },

    scrollContent: {
      paddingHorizontal: 12,
      paddingTop: 18,
      paddingBottom: 32,
    },

    /*
      ----------------------------------
      HEADER
      ----------------------------------
    */

    header: {
      minHeight: 64,

      paddingHorizontal: 16,
      paddingVertical: 8,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.primary,

      borderBottomWidth: 3,
      borderBottomColor:
        COLORS.contours,
    },

    headerTitle: {
      color:
        COLORS.text2,

      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1.1,

      textAlign: 'center',
    },

    dayModeHeader: {
      minHeight: 44,
      marginBottom: 10,
      paddingHorizontal: 2,

      flexDirection: 'row',
      alignItems: 'center',
    },

    dayModeBackButton: {
      width: 36,
      height: 36,

      marginRight: 10,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.secondary,

      borderWidth: 2,
      borderColor:
        COLORS.contours,

      borderRadius: 9,

      shadowColor:
        COLORS.contours,

      shadowOffset: {
        width: 2,
        height: 2,
      },

      shadowOpacity: 1,
      shadowRadius: 0,

      elevation: 3,
    },

    dayModeMonth: {
      color: COLORS.text2,

      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    dayModeBackButtonPressed: {
      transform: [
        { translateX: 1 },
        { translateY: 1 },
      ],

      shadowOffset: {
        width: 1,
        height: 1,
      },

      elevation: 1,
    },

    dayModeDate: {
      flex: 1,

      color:
        COLORS.text1,

      fontSize: 16,
      fontWeight: '900',

      textTransform: 'capitalize',
    },

    /*
      ----------------------------------
      MOIS
      ----------------------------------
    */

    monthSection: {
      marginBottom: 30,
    },

    monthSectionDayMode: {
      marginBottom: 0,
    },

    monthHeader: {
      marginBottom: 14,
      paddingHorizontal: 4,
    },

    monthTitle: {
      color:
        COLORS.text2,

      fontSize: 14,
      fontWeight: '800',
      letterSpacing: 0.5,

      textAlign: 'left',
    },

    /*
      ----------------------------------
      JOURS SEMAINE
      ----------------------------------
    */

    weekHeader: {
      flexDirection: 'row',
      marginBottom: 8,
    },

    weekDayCell: {
      flex: 1,

      alignItems: 'center',
      justifyContent: 'center',
    },

    weekDayText: {
      color:
        COLORS.text2,

      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.4,
    },

    /*
      ----------------------------------
      SEMAINES
      ----------------------------------
    */

    weeksContainer: {
      gap: 6,
    },

    weekRow: {
      flexDirection: 'row',
    },

    dayColumn: {
      flex: 1,

      paddingHorizontal: 3,

      alignItems: 'center',
    },

    /*
      ----------------------------------
      JOUR
      ----------------------------------
    */

    dayButton: {
      width: '100%',
      aspectRatio: 1,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.secondary,

      borderWidth: 2,
      borderColor:
        COLORS.contours,

      borderRadius: 10,
    },

    dayButtonWithSessions: {
      shadowColor:
        COLORS.contours,

      shadowOffset: {
        width: 2,
        height: 2,
      },

      shadowOpacity: 1,
      shadowRadius: 0,

      elevation: 3,
    },

    dayButtonSelected: {
      backgroundColor:
        COLORS.primary,

      borderWidth: 3,
    },

    dayButtonDisabled: {
      opacity: 0.45,
    },

    todayButton: {
      borderWidth: 3,
    },

    dayButtonPressed: {
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
    },

    dayNumber: {
      color:
        COLORS.text2,

      fontSize: 13,
      fontWeight: '800',
    },

    dayNumberWithSessions: {
      fontWeight: '900',
    },

    dayNumberDisabled: {
      opacity: 0.65,
    },

    sessionIndicator: {
      position: 'absolute',

      bottom: 5,

      width: 4,
      height: 4,

      backgroundColor:
        COLORS.icon,

      borderRadius: 2,
    },

    /*
      ----------------------------------
      DÉTAIL JOUR
      ----------------------------------
    */

    dayDetail: {
      paddingTop: 10,
      paddingBottom: 0,
    },

    /*
      ----------------------------------
      SÉLECTEUR ARRONDISSEMENTS
      ----------------------------------
    */

    arrondissementSelector: {
      width: '100%',
      height: 42,

      marginBottom: 7.5,
      paddingHorizontal: 12,

      justifyContent: 'center',

      backgroundColor: COLORS.secondary,

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

    arrondissementSelectorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    arrondissementSelectorText: {
      flex: 1,

      marginRight: 8,

      color:
        COLORS.text2,

      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.4,
    },

    filterPressed: {
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
    },

    chevron: {
      marginLeft: 8,
      color: COLORS.text2,
      fontSize: 14,
      fontWeight: '900',
    },

    /*
      ----------------------------------
      MODAL ARRONDISSEMENTS
      ----------------------------------
    */

    arrondissementModalOverlay: {
      flex: 1,

      paddingHorizontal: 24,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        'rgba(0, 0, 0, 0.55)',
    },

    arrondissementModalBox: {
      width: '100%',
      maxHeight: '75%',

      padding: 16,

      backgroundColor:
        COLORS.background,

      borderWidth: 3,
      borderColor:
        COLORS.contours,

      borderRadius: 16,
    },

    arrondissementModalHeader: {
      marginBottom: 14,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
    },

    arrondissementModalTitle: {
      color:
        COLORS.text2,

      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 1,
    },

    arrondissementModalClose: {
      width: 34,
      height: 34,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.primary,

      borderWidth: 2,
      borderColor:
        COLORS.contours,

      borderRadius: 9,

      shadowColor:
        COLORS.contours,

      shadowOffset: {
        width: 2,
        height: 2,
      },

      shadowOpacity: 1,
      shadowRadius: 0,

      elevation: 3,
    },

    arrondissementModalCloseText: {
      marginTop: -2,

      color:
        COLORS.icon,

      fontSize: 22,
      fontWeight: '900',
    },

    arrondissementSeparator: {
      height: 2,

      marginTop: 6,
      marginBottom: 14,

      backgroundColor:
        COLORS.contours,
    },

    arrondissementList: {
      flexGrow: 0,
    },

    arrondissementRow: {
      minHeight: 46,

      marginBottom: 8,
      paddingHorizontal: 12,

      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',

      backgroundColor:
        COLORS.secondary,

      borderWidth: 2,
      borderColor:
        COLORS.contours,

      borderRadius: 10,
    },

    arrondissementRowSelected: {
      backgroundColor:
        COLORS.primary,
    },

    arrondissementRowText: {
      flex: 1,

      marginRight: 12,

      color:
        COLORS.text2,

      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    arrondissementCheckbox: {
      width: 22,
      height: 22,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.secondary,

      borderWidth: 2,
      borderColor:
        COLORS.contours,

      borderRadius: 6,
    },

    arrondissementCheckboxSelected: {
      backgroundColor:
        COLORS.primary,
    },

    arrondissementCheckboxCheck: {
      marginTop: -2,

      color:
        COLORS.icon,

      fontSize: 14,
      fontWeight: '900',
    },

    /*
      ----------------------------------
      SECTIONS FILMS
      ----------------------------------
    */

    movieSection: {
      marginBottom: 0,
    },

    movieSectionHeader: {
      minHeight: 0,

      paddingHorizontal: 2,
      paddingTop: 14,
      paddingBottom: 8,

      flexDirection: 'row',
      alignItems: 'center',

      gap: 8,
    },

    sectionHeaderPressed: {
      opacity: 0.55,
    },

    movieSectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,

    },

    movieSectionTitle: {
      flexShrink: 1,

      color: COLORS.text2,

      fontSize: 15,
      fontWeight: '900',
    },

    movieSectionCount: {
      minWidth: 24,

      paddingHorizontal: 6,
      paddingVertical: 2,

      color:
        COLORS.icon,

      fontSize: 10,
      fontWeight: '900',

      textAlign: 'center',

      backgroundColor:
        COLORS.secondary,

      borderWidth: 1,
      borderColor:
        COLORS.contours,

      borderRadius: 10,
    },

    moviesContainer: {
      paddingTop: 0,

      gap: 10,
    },

    noMoviesText: {
      paddingVertical: 14,

      color:
        COLORS.text2,

      fontSize: 11,
      fontWeight: '600',

      textAlign: 'center',
    },

    /*
      ----------------------------------
      FILM
      ----------------------------------
    */

    movieCard: {
      minHeight: 112,

      padding: 9,

      flexDirection: 'row',

      backgroundColor:
        COLORS.secondary,

      borderWidth: 2,
      borderColor:
        COLORS.contours,

      borderRadius: 10,

      shadowColor:
        COLORS.contours,

      shadowOffset: {
        width: 2,
        height: 2,
      },

      shadowOpacity: 1,
      shadowRadius: 0,

      elevation: 3,
    },

    movieCardPressed: {
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
    },

    posterContainer: {
      width: 66,
      aspectRatio: 2 / 3,

      overflow: 'hidden',

      backgroundColor:
        COLORS.background,

      borderWidth: 2,
      borderColor:
        COLORS.contours,

      borderRadius: 6,
    },

    poster: {
      width: '100%',
      height: '100%',
    },

    posterPlaceholder: {
      flex: 1,

      alignItems: 'center',
      justifyContent: 'center',

      backgroundColor:
        COLORS.primary,
    },

    posterPlaceholderText: {
      color:
        COLORS.icon,

      fontSize: 18,
      fontWeight: '900',
    },

    movieInfo: {
      flex: 1,
      paddingLeft: 11,
    },

    movieTitle: {
      marginBottom: 9,

      color:
        COLORS.icon,

      fontSize: 13,
      fontWeight: '900',

      lineHeight: 17,
    },

    /*
      ----------------------------------
      HORAIRES
      ----------------------------------
    */

    timesSection: {
      marginTop: 5,
    },

    versionLabel: {
      marginBottom: 4,

      color:
        COLORS.icon,

      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    timesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',

      gap: 5,
    },

    timeBadge: {
      paddingHorizontal: 7,
      paddingVertical: 4,

      backgroundColor:
        COLORS.primary,

      borderWidth: 1,
      borderColor:
        COLORS.contours,

      borderRadius: 6,
    },

    timeText: {
      color:
        COLORS.icon,

      fontSize: 10,
      fontWeight: '800',
    },

    /*
      ----------------------------------
      VIDE
      ----------------------------------
    */

    emptyContainer: {
      minHeight: 220,

      padding: 24,

      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyTitle: {
      color:
        COLORS.text1,

      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 1,

      textAlign: 'center',
    },

    emptyDescription: {
      marginTop: 8,

      color:
        COLORS.text2,

      fontSize: 11,
      fontWeight: '600',
      lineHeight: 17,

      textAlign: 'center',
    },
  })